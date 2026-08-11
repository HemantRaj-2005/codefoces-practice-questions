import * as React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserProfileMetrics, getSmartRecommendations } from "@/actions/platform";
import { SidebarLayout } from "@/components/Layout";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect("/login");
  }

  const userMetrics = await getUserProfileMetrics();
  if (!userMetrics) {
    redirect("/login");
  }

  const recommendations = await getSmartRecommendations();

  // Calculate overall syllabus progress
  const totalProblems = userMetrics.progress?.length || 0;
  const completedProblems = userMetrics.progress?.filter((p: any) => p.status === "SOLVED").length || 0;
  const overallPercentage = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;

  const progressProps = {
    total: totalProblems,
    completed: completedProblems,
    percentage: overallPercentage,
  };

  return (
    <SidebarLayout user={userMetrics} overallProgress={progressProps}>
      <DashboardClient user={userMetrics} recommendationsData={recommendations} />
    </SidebarLayout>
  );
}
