"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * Toggle bookmark status for a problem.
 */
export async function toggleBookmark(problemId: string) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Authentication required.");
  }

  const existing = await db.bookmark.findUnique({
    where: {
      userId_problemId: {
        userId: session.userId,
        problemId,
      },
    },
  });

  if (existing) {
    await db.bookmark.delete({
      where: { id: existing.id },
    });
    
    // Update problem progress state if exists
    try {
      await db.problemProgress.update({
        where: {
          userId_problemId: {
            userId: session.userId,
            problemId,
          },
        },
        data: {
          status: "NOT_STARTED", // Fallback or adjust based on other records
        },
      });
    } catch (e) {}

    return { bookmarked: false };
  } else {
    await db.bookmark.create({
      data: {
        userId: session.userId,
        problemId,
      },
    });

    // Ensure progress record exists
    await db.problemProgress.upsert({
      where: {
        userId_problemId: {
          userId: session.userId,
          problemId,
        },
      },
      update: {
        status: "BOOKMARKED",
      },
      create: {
        userId: session.userId,
        problemId,
        status: "BOOKMARKED",
      },
    });

    return { bookmarked: true };
  }
}

/**
 * Updates note details for a problem.
 */
export async function updateProblemNote(
  problemId: string,
  content: string,
  keyObservations?: string,
  mistakes?: string,
  approach?: string
) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Authentication required.");
  }

  return await db.note.upsert({
    where: {
      userId_problemId: {
        userId: session.userId,
        problemId,
      },
    },
    update: {
      content,
      keyObservations,
      mistakes,
      approach,
    },
    create: {
      userId: session.userId,
      problemId,
      content,
      keyObservations,
      mistakes,
      approach,
    },
  });
}

/**
 * Adds or updates a problem in the revision queue.
 */
export async function toggleRevision(problemId: string, difficulty: string, notes?: string) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Authentication required.");
  }

  const existing = await db.revision.findUnique({
    where: {
      userId_problemId: {
        userId: session.userId,
        problemId,
      },
    },
  });

  if (existing && !difficulty) {
    // Remove if difficulty passed is empty (untoggle)
    await db.revision.delete({
      where: { id: existing.id },
    });
    return { inQueue: false };
  }

  const result = await db.revision.upsert({
    where: {
      userId_problemId: {
        userId: session.userId,
        problemId,
      },
    },
    update: {
      difficulty,
      notes,
      revisionCount: { increment: 1 },
      lastRevisionDate: new Date(),
    },
    create: {
      userId: session.userId,
      problemId,
      difficulty,
      notes,
      revisionCount: 1,
      lastRevisionDate: new Date(),
    },
  });

  // Ensure progress status reflects revisit state
  await db.problemProgress.upsert({
    where: {
      userId_problemId: {
        userId: session.userId,
        problemId,
      },
    },
    update: {
      status: "REVISIT",
    },
    create: {
      userId: session.userId,
      problemId,
      status: "REVISIT",
    },
  });

  return { inQueue: true, revision: result };
}

/**
 * Creates a practice goal.
 */
export async function createGoal(title: string, target: number, type: string) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Authentication required.");
  }

  return await db.goal.create({
    data: {
      userId: session.userId,
      title,
      target,
      current: 0,
      type,
    },
  });
}

/**
 * Updates progress of a specific goal.
 */
export async function updateGoalProgress(goalId: string, current: number) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Authentication required.");
  }

  return await db.goal.update({
    where: { id: goalId },
    data: { current },
  });
}

/**
 * Deletes a goal.
 */
export async function deleteGoal(goalId: string) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Authentication required.");
  }

  await db.goal.delete({
    where: { id: goalId },
  });
  return { success: true };
}

/**
 * Update onboarding settings (daily goal solves target).
 */
export async function saveOnboardingSettings(dailyTarget: number) {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Authentication required.");
  }

  return await db.user.update({
    where: { id: session.userId },
    data: {
      dailyTarget,
    },
  });
}

/**
 * Get personalized recommended problems and weak topics breakdown.
 */
export async function getSmartRecommendations() {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error("Authentication required.");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      progress: {
        include: {
          problem: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  // Calculate success statistics by topic
  // Group problems by mainTopic
  const topicAttempts: Record<string, { total: number; solved: number }> = {};
  
  user.progress.forEach((prog) => {
    const topic = prog.problem.mainTopic;
    if (!topic) return;

    if (!topicAttempts[topic]) {
      topicAttempts[topic] = { total: 0, solved: 0 };
    }
    topicAttempts[topic].total += prog.attempts;
    if (prog.status === "SOLVED") {
      topicAttempts[topic].solved += 1;
    }
  });

  // Calculate success rate and identify weak areas (< 75% rate and has attempts)
  const weakAreas = Object.entries(topicAttempts)
    .map(([topic, stats]) => {
      const rate = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
      return { topic, successRate: Math.round(rate), stats };
    })
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 3); // Top 3 weakest topics

  // Find recommended problems in database matching weak topics, ratings matching user level
  const userRating = user.codeforcesRating || 1200;
  
  // Exclude already solved problem ids
  const solvedProblemIds = user.progress
    .filter((p) => p.status === "SOLVED")
    .map((p) => p.problemId);

  const recommendedProblems: any[] = [];
  
  for (const area of weakAreas) {
    const candidate = await db.problem.findFirst({
      where: {
        mainTopic: area.topic,
        id: { notIn: solvedProblemIds },
        rating: {
          gte: userRating - 200,
          lte: userRating + 250,
        },
      },
    });

    if (candidate) {
      recommendedProblems.push({
        problem: candidate,
        reason: `Recommended because ${area.topic} is one of your weak topics (${area.successRate}% accuracy rate) and matches your current rating range.`,
      });
    }
  }

  // Fill recommendations up to 4 if we don't have enough candidates
  if (recommendedProblems.length < 4) {
    const extraCandidates = await db.problem.findMany({
      where: {
        id: { notIn: [...solvedProblemIds, ...recommendedProblems.map((r) => r.problem.id)] },
        rating: {
          gte: userRating - 100,
          lte: userRating + 200,
        },
      },
      take: 4 - recommendedProblems.length,
    });

    extraCandidates.forEach((candidate) => {
      recommendedProblems.push({
        problem: candidate,
        reason: `Recommended to stretch your rating levels near your target range of ${userRating}.`,
      });
    });
  }

  return {
    weakAreas,
    recommendations: recommendedProblems,
  };
}

/**
 * Returns user profile metrics, streaks, goals, activities, etc.
 */
export async function getUserProfileMetrics() {
  const session = await getSession();
  if (!session || !session.userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      goals: true,
      bookmarks: {
        include: {
          problem: true,
        },
      },
      revisions: {
        include: {
          problem: true,
        },
      },
      activities: {
        orderBy: { date: "asc" },
      },
      contests: {
        orderBy: { date: "asc" },
      },
      progress: {
        include: {
          problem: true,
        },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  return user;
}

/**
 * Mark notifications as read.
 */
export async function markNotificationsAsRead() {
  const session = await getSession();
  if (!session || !session.userId) return;

  await db.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Global search querying problems, topics, and contests.
 */
export async function searchGlobal(query: string) {
  const session = await getSession();
  if (!session || !session.userId) return { problems: [], topics: [], contests: [] };

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return { problems: [], topics: [], contests: [] };

  const problems = await db.problem.findMany({
    where: {
      OR: [
        { problem: { contains: cleanQuery, mode: "insensitive" } },
        { mainTopic: { contains: cleanQuery, mode: "insensitive" } },
      ],
    },
    take: 5,
  });

  const topics = await db.topic.findMany({
    where: {
      name: { contains: cleanQuery, mode: "insensitive" },
    },
    take: 3,
  });

  const contests = await db.contest.findMany({
    where: {
      userId: session.userId,
      name: { contains: cleanQuery, mode: "insensitive" },
    },
    take: 3,
  });

  return { problems, topics, contests };
}
