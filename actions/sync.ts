"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  fetchCodeforcesProfile,
  fetchCodeforcesSubmissions,
  fetchCodeforcesContests,
} from "@/lib/codeforces";

export interface SyncState {
  error?: string | null;
  success?: boolean;
  profile?: any;
  addedCount?: number;
}

/**
 * Extracts contestId and index from Codeforces link for matching.
 */
function parseCodeforcesLink(link: string): { contestId: number; index: string } | null {
  try {
    const url = new URL(link);
    const path = url.pathname;
    
    // Match /problemset/problem/1155/B
    const problemsetMatch = path.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
    if (problemsetMatch) {
      return { contestId: parseInt(problemsetMatch[1], 10), index: problemsetMatch[2].toUpperCase() };
    }
    
    // Match /contest/1155/problem/B
    const contestMatch = path.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (contestMatch) {
      return { contestId: parseInt(contestMatch[1], 10), index: contestMatch[2].toUpperCase() };
    }
    
    // Match /gym/102345/problem/A
    const gymMatch = path.match(/\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (gymMatch) {
      return { contestId: parseInt(gymMatch[1], 10), index: gymMatch[2].toUpperCase() };
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

/**
 * Server action to link a Codeforces handle to the logged-in user profile.
 */
export async function connectCodeforcesHandle(handle: string): Promise<SyncState> {
  const session = await getSession();
  if (!session || !session.userId) {
    return { error: "Authentication required." };
  }

  if (!handle.trim()) {
    return { error: "Please enter a valid Codeforces handle." };
  }

  try {
    const profile = await fetchCodeforcesProfile(handle.trim());

    // Update User profile
    await db.user.update({
      where: { id: session.userId },
      data: {
        codeforcesHandle: profile.handle,
        codeforcesRating: profile.rating || null,
        codeforcesRank: profile.rank || null,
        codeforcesMaxRating: profile.maxRating || null,
        codeforcesMaxRank: profile.maxRank || null,
        avatarUrl: profile.avatar || null,
      },
    });

    // Create sync notification
    await db.notification.create({
      data: {
        userId: session.userId,
        title: "Codeforces Connected",
        content: `Your Codeforces account @${profile.handle} has been successfully connected!`,
      },
    });

    return { success: true, profile };
  } catch (err: any) {
    return { error: err.message || "Failed to connect Codeforces profile." };
  }
}

/**
 * Server action to disconnect Codeforces handle.
 */
export async function disconnectCodeforces(): Promise<SyncState> {
  const session = await getSession();
  if (!session || !session.userId) {
    return { error: "Authentication required." };
  }

  try {
    await db.user.update({
      where: { id: session.userId },
      data: {
        codeforcesHandle: null,
        codeforcesRating: null,
        codeforcesRank: null,
        codeforcesMaxRating: null,
        codeforcesMaxRank: null,
        avatarUrl: null,
        lastSyncedAt: null,
        lastProcessedSubmissionId: null,
      },
    });

    // Notify user
    await db.notification.create({
      data: {
        userId: session.userId,
        title: "Codeforces Disconnected",
        content: "Your Codeforces account was successfully disconnected from this platform.",
      },
    });

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to disconnect Codeforces account." };
  }
}

/**
 * Performs synchronization of submissions, ratings, activity heatmap, and streaks.
 */
export async function syncCodeforcesSubmissions(): Promise<SyncState> {
  const session = await getSession();
  if (!session || !session.userId) {
    return { error: "Authentication required." };
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.codeforcesHandle) {
    return { error: "No connected Codeforces handle found." };
  }

  try {
    // 1. Fetch user status / submissions from API
    // Fetch a large chunk (up to 2000) descending by time
    const submissions = await fetchCodeforcesSubmissions(user.codeforcesHandle, 1, 2000);
    
    // Determine new submissions to process
    let newSubmissions = submissions;
    if (user.lastProcessedSubmissionId) {
      const idx = submissions.findIndex(s => String(s.id) === user.lastProcessedSubmissionId);
      if (idx !== -1) {
        // Slice to process only submissions after (newer than) this index
        newSubmissions = submissions.slice(0, idx);
      }
    }

    // 2. Load all database problems and build map
    const dbProblems = await db.problem.findMany();
    const problemMap = new Map<string, string>(); // Key: "contestId_index" -> Value: problemId
    
    dbProblems.forEach((p) => {
      const parsed = parseCodeforcesLink(p.link);
      if (parsed) {
        problemMap.set(`${parsed.contestId}_${parsed.index}`, p.id);
      }
    });

    // 3. Process each submission chronologically (oldest to newest in the new subset)
    const reversedNewSubmissions = [...newSubmissions].reverse();
    
    let addedCount = 0;
    const dailyStats: Record<string, { solved: number; total: number }> = {};

    for (const sub of reversedNewSubmissions) {
      if (!sub.problem || !sub.problem.contestId) continue;
      
      const key = `${sub.problem.contestId}_${sub.problem.index.toUpperCase()}`;
      const dbProblemId = problemMap.get(key);

      const submissionDate = new Date(sub.creationTimeSeconds * 1000);
      const dateStr = submissionDate.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = { solved: 0, total: 0 };
      }
      dailyStats[dateStr].total += 1;

      if (sub.verdict === "OK") {
        dailyStats[dateStr].solved += 1;
      }

      if (dbProblemId) {
        const isSolved = sub.verdict === "OK";
        
        // Find existing progress
        const existingProgress = await db.problemProgress.findUnique({
          where: {
            userId_problemId: {
              userId: user.id,
              problemId: dbProblemId,
            },
          },
        });

        if (existingProgress) {
          const wasSolvedBefore = existingProgress.status === "SOLVED";
          await db.problemProgress.update({
            where: { id: existingProgress.id },
            data: {
              status: isSolved ? "SOLVED" : wasSolvedBefore ? "SOLVED" : "ATTEMPTED",
              attempts: existingProgress.attempts + 1,
              lastAttemptedAt: submissionDate,
              firstSolvedAt: isSolved && !wasSolvedBefore ? submissionDate : existingProgress.firstSolvedAt,
            },
          });
          if (isSolved && !wasSolvedBefore) addedCount++;
        } else {
          await db.problemProgress.create({
            data: {
              userId: user.id,
              problemId: dbProblemId,
              status: isSolved ? "SOLVED" : "ATTEMPTED",
              attempts: 1,
              lastAttemptedAt: submissionDate,
              firstSolvedAt: isSolved ? submissionDate : null,
            },
          });
          if (isSolved) addedCount++;
        }
      }
    }

    // 4. Update Daily Activity Heatmap counts
    for (const [dateStr, stats] of Object.entries(dailyStats)) {
      const targetDate = new Date(dateStr);
      const existingActivity = await db.dailyActivity.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: targetDate,
          },
        },
      });

      if (existingActivity) {
        await db.dailyActivity.update({
          where: { id: existingActivity.id },
          data: {
            submissionCount: existingActivity.submissionCount + stats.total,
            solvedCount: existingActivity.solvedCount + stats.solved,
            acceptedCount: existingActivity.acceptedCount + stats.solved,
          },
        });
      } else {
        await db.dailyActivity.create({
          data: {
            userId: user.id,
            date: targetDate,
            submissionCount: stats.total,
            solvedCount: stats.solved,
            acceptedCount: stats.solved,
          },
        });
      }
    }

    // 5. Sync Contest Rating History
    const contests = await fetchCodeforcesContests(user.codeforcesHandle);
    for (const c of contests) {
      const contestDate = new Date(c.ratingUpdateTimeSeconds * 1000);
      await db.contest.upsert({
        where: {
          userId_contestId: {
            userId: user.id,
            contestId: c.contestId,
          },
        },
        update: {
          name: c.contestName,
          date: contestDate,
          rank: c.rank,
          ratingBefore: c.oldRating,
          ratingAfter: c.newRating,
          ratingChange: c.newRating - c.oldRating,
        },
        create: {
          userId: user.id,
          contestId: c.contestId,
          name: c.contestName,
          date: contestDate,
          rank: c.rank,
          ratingBefore: c.oldRating,
          ratingAfter: c.newRating,
          ratingChange: c.newRating - c.oldRating,
          problemsSolved: 0, // Placeholder
        },
      });
    }

    // 6. Recalculate Streak
    const allActivities = await db.dailyActivity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    let hasStreakToday = false;
    let hasStreakYesterday = false;

    // Build unique solved dates set
    const solvedDates = new Set<string>();
    allActivities.forEach((act) => {
      if (act.solvedCount > 0) {
        solvedDates.add(act.date.toISOString().split("T")[0]);
      }
    });

    if (solvedDates.has(todayStr)) hasStreakToday = true;
    if (solvedDates.has(yesterdayStr)) hasStreakYesterday = true;

    // Calculate current streak
    if (hasStreakToday || hasStreakYesterday) {
      let checkDate = hasStreakToday ? new Date() : new Date(Date.now() - 86400000);
      while (true) {
        const checkStr = checkDate.toISOString().split("T")[0];
        if (solvedDates.has(checkStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak in history
    // Get sorted list of dates ascending
    const sortedSolvedDates = Array.from(solvedDates).sort();
    if (sortedSolvedDates.length > 0) {
      let streak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedSolvedDates.length; i++) {
        const prev = new Date(sortedSolvedDates[i - 1]);
        const curr = new Date(sortedSolvedDates[i]);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
          if (streak > longestStreak) longestStreak = streak;
        } else if (diffDays > 1) {
          streak = 1;
        }
      }
      if (streak > longestStreak) longestStreak = streak;
    }

    // 7. Update User's Sync Metrics and Ratings
    const latestProfile = await fetchCodeforcesProfile(user.codeforcesHandle);
    
    const latestProcessedId = submissions.length > 0 ? String(submissions[0].id) : user.lastProcessedSubmissionId;

    await db.user.update({
      where: { id: user.id },
      data: {
        codeforcesRating: latestProfile.rating || null,
        codeforcesRank: latestProfile.rank || null,
        codeforcesMaxRating: latestProfile.maxRating || null,
        codeforcesMaxRank: latestProfile.maxRank || null,
        currentStreak,
        longestStreak: Math.max(longestStreak, user.longestStreak),
        lastSyncedAt: new Date(),
        lastProcessedSubmissionId: latestProcessedId,
      },
    });

    // Log Sync History
    await db.syncHistory.create({
      data: {
        userId: user.id,
        status: "SUCCESS",
        newSubmissionsCount: newSubmissions.length,
      },
    });

    // Create Notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Codeforces Synced Successfully",
        content: `Processed ${newSubmissions.length} new submissions. Streaks & stats recalculated!`,
      },
    });

    return { success: true, addedCount: newSubmissions.length, profile: latestProfile };
  } catch (err: any) {
    // Log Failed Sync History
    await db.syncHistory.create({
      data: {
        userId: user.id,
        status: "FAILED",
        error: err.message || "Unknown synchronization error",
        newSubmissionsCount: 0,
      },
    });
    return { error: err.message || "Failed to complete Codeforces synchronization." };
  }
}
