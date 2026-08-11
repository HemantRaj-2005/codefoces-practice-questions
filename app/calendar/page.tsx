import * as React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/Layout";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect("/login");
  }

  // 1. Fetch user data and daily activity counts
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      activities: true,
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Coding Activity Calendar</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track daily consistency ratios, solve counts, and practice volumes month-over-month.
          </p>
        </div>
        <CalendarClient activities={user.activities} />
      </div>
    </SidebarLayout>
  );
}
