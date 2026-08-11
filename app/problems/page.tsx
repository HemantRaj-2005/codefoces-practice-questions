import * as React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/Layout";
import { ProblemsClient } from "./ProblemsClient";

export default async function ProblemsPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect("/login");
  }

  // 1. Fetch user data
  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch syllabus and topic metadata (grouped/nested format)
  const topics = await db.topic.findMany({
    orderBy: { order: "asc" },
    include: {
      subTopics: {
        orderBy: { order: "asc" },
        include: {
          problems: {
            orderBy: { rating: "asc" },
          },
        },
      },
    },
  });

  // 3. Fetch user achievements & logs
  const userProgress = await db.problemProgress.findMany({
    where: { userId: user.id },
  });

  const userBookmarks = await db.bookmark.findMany({
    where: { userId: user.id },
  });

  const userRevisions = await db.revision.findMany({
    where: { userId: user.id },
  });

  const userNotes = await db.note.findMany({
    where: { userId: user.id },
  });

  // Calculate overall syllabus stats
  const allProblems = topics.flatMap((t: any) =>
    t.subTopics.flatMap((st: any) => st.problems)
  );
  const totalCount = allProblems.length;
  const completedCount = userProgress.filter(p => p.status === "SOLVED").length;
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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Syllabus Catalog</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse through practice tracks, filter by ratings, organize bookmarks, and log personalized observation notes.
          </p>
        </div>
        <ProblemsClient
          topics={topics}
          userProgress={userProgress}
          userBookmarks={userBookmarks}
          userRevisions={userRevisions}
          userNotes={userNotes}
        />
      </div>
    </SidebarLayout>
  );
}
