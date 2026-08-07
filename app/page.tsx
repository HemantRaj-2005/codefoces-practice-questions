import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import HomePageClient from "./HomePageClient";

// Force dynamic rendering to ensure fresh data and session status
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  const adminEmail = session?.email || null;

  // Fetch topics with relations
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

  // Calculate statistics
  const allProblems = topics.flatMap((t: any) =>
    t.subTopics.flatMap((st: any) => st.problems)
  );

  const total = allProblems.length;
  const completed = allProblems.filter((p: any) => p.completed).length;
  const remaining = total - completed;
  const topicsCount = topics.length;
  const subtopicsCount = topics.reduce((acc: number, t: any) => acc + t.subTopics.length, 0);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = {
    total,
    completed,
    remaining,
    topicsCount,
    subtopicsCount,
    percentage,
  };

  return (
    <HomePageClient
      initialTopics={topics}
      stats={stats}
      adminEmail={adminEmail}
    />
  );
}
export type { Page };
