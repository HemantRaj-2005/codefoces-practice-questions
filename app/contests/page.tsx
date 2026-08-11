import * as React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/Layout";
import { ContestsClient } from "./ContestsClient";

export default async function ContestsPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect("/login");
  }

  // 1. Fetch user data and contest list
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      contests: {
        orderBy: { date: "desc" },
      },
      progress: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Calculate overall syllabus stats
  const totalCount = await db.problem.count();
  const completedCount = user.progress?.filter(p => p.status === "SOLVED").length || 0;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const progressProps = {
    total: totalCount,
    completed: completedCount,
    percentage,
  };

  return (
    <SidebarLayout user={user} overallProgress={progressProps}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Contest History</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review rating milestones, contest ranks, and point deltas from your Codeforces history.
          </p>
        </div>
        <ContestsClient contests={user.contests} />
      </div>
    </SidebarLayout>
  );
}
