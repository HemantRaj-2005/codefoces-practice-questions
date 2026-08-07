import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ProblemsClient from "./ProblemsClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminProblemsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const page = parseInt((resolvedSearchParams.page as string) || "1", 10);
  const limit = parseInt((resolvedSearchParams.limit as string) || "20", 10);
  const search = (resolvedSearchParams.search as string) || "";
  const subtopicId = (resolvedSearchParams.subtopic as string) || "";
  const topicId = (resolvedSearchParams.topic as string) || "";

  const skip = (page - 1) * limit;

  // Build prisma filter conditions
  const where: any = {};
  if (search) {
    where.OR = [
      { problem: { contains: search, mode: "insensitive" } },
      { mainTopic: { contains: search, mode: "insensitive" } },
      { hiddenPattern: { contains: search, mode: "insensitive" } },
    ];
  }
  if (subtopicId) {
    where.subTopicId = subtopicId;
  } else if (topicId) {
    where.subTopic = {
      topicId: topicId,
    };
  }

  // Fetch count & records in parallel
  const [totalProblems, problems] = await db.$transaction([
    db.problem.count({ where }),
    db.problem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        subTopic: {
          include: {
            topic: true,
          },
        },
      },
      skip,
      take: limit,
    }),
  ]);

  // Fetch topics and subtopics for assign dropdowns
  const topics = await db.topic.findMany({
    orderBy: { order: "asc" },
    include: {
      subTopics: {
        orderBy: { order: "asc" },
      },
    },
  });

  const totalPages = Math.max(1, Math.ceil(totalProblems / limit));

  return (
    <ProblemsClient
      problems={problems}
      topics={topics}
      pagination={{
        page,
        limit,
        totalItems: totalProblems,
        totalPages,
      }}
      filters={{
        search,
        subtopicId,
        topicId,
      }}
    />
  );
}
