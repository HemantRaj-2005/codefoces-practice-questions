import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function extractProblemId(link: string): string {
  try {
    const url = new URL(link);
    const path = url.pathname;
    
    // Match /problemset/problem/1155/B
    const problemsetMatch = path.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
    if (problemsetMatch) {
      return `${problemsetMatch[1]}${problemsetMatch[2].toUpperCase()}`;
    }
    
    // Match /contest/1155/problem/B
    const contestMatch = path.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (contestMatch) {
      return `${contestMatch[1]}${contestMatch[2].toUpperCase()}`;
    }
    
    // Match /gym/102345/problem/A
    const gymMatch = path.match(/\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (gymMatch) {
      return `Gym ${gymMatch[1]}${gymMatch[2].toUpperCase()}`;
    }

    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const last = segments[segments.length - 1];
      const secondLast = segments[segments.length - 2];
      if (/^\d+$/.test(secondLast)) {
        return `${secondLast}${last.toUpperCase()}`;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return "CF Link";
}

