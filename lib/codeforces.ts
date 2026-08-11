export interface CodeforcesProfile {
  handle: string;
  rating?: number;
  rank?: string;
  maxRating?: number;
  maxRank?: string;
  avatar: string;
  registrationTimeSeconds: number;
}

export interface CodeforcesSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    type: string;
    points?: number;
    rating?: number;
    tags: string[];
  };
  author: any;
  programmingLanguage: string;
  verdict: string; // "OK", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", etc.
  passCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

const BASE_URL = "https://codeforces.com/api";

// Fetch response helper
async function callCodeforcesAPI<T>(endpoint: string): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
      next: { revalidate: 60 }, // Cache responses for 60 seconds
    });
    
    if (!res.ok) {
      throw new Error(`Codeforces API responded with HTTP error status ${res.status}`);
    }

    const data = await res.json();
    if (data.status !== "OK") {
      throw new Error(data.comment || "Failed to query Codeforces API");
    }

    return data.result as T;
  } catch (err: any) {
    throw new Error(err.message || "Failed to communicate with Codeforces API");
  }
}

/**
 * Validates and fetches Codeforces profile details for a handle.
 */
export async function fetchCodeforcesProfile(handle: string): Promise<CodeforcesProfile> {
  const result = await callCodeforcesAPI<any[]>(`user.info?handles=${encodeURIComponent(handle)}`);
  const profile = result[0];
  
  if (!profile) {
    throw new Error(`Profile not found for handle: ${handle}`);
  }

  return {
    handle: profile.handle,
    rating: profile.rating,
    rank: profile.rank,
    maxRating: profile.maxRating,
    maxRank: profile.maxRank,
    avatar: profile.titlePhoto || profile.avatar,
    registrationTimeSeconds: profile.registrationTimeSeconds,
  };
}

/**
 * Fetches user submission history.
 */
export async function fetchCodeforcesSubmissions(
  handle: string,
  from: number = 1,
  count: number = 1000
): Promise<CodeforcesSubmission[]> {
  return await callCodeforcesAPI<CodeforcesSubmission[]>(
    `user.status?handle=${encodeURIComponent(handle)}&from=${from}&count=${count}`
  );
}

/**
 * Fetches user contest participations and rating changes.
 */
export async function fetchCodeforcesContests(handle: string): Promise<CodeforcesRatingChange[]> {
  return await callCodeforcesAPI<CodeforcesRatingChange[]>(
    `user.rating?handle=${encodeURIComponent(handle)}`
  );
}
