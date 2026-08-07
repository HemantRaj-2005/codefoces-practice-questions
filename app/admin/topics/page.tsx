import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TopicsClient from "./TopicsClient";

export const dynamic = "force-dynamic";

export default async function AdminTopicsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const topics = await db.topic.findMany({
    orderBy: { order: "asc" },
    include: {
      subTopics: {
        orderBy: { order: "asc" },
      },
    },
  });

  return <TopicsClient initialTopics={topics} />;
}
export type { AdminTopicsPage };
