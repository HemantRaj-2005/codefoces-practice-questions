import * as React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/Layout";
import { GoalsClient } from "./GoalsClient";

export default async function GoalsPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect("/login");
  }

  // 1. Fetch user data with goals and revisions
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      goals: {
        orderBy: { createdAt: "desc" },
      },
      revisions: {
        include: {
          problem: true,
        },
        orderBy: { updatedAt: "desc" },
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Goals & Revision Queue</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track custom competitive programming targets, and revisit key patterns in your revision loop.
          </p>
        </div>
        <GoalsClient goals={user.goals} revisions={user.revisions} />
      </div>
    </SidebarLayout>
  );
}
