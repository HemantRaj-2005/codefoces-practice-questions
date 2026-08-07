import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SidebarLayout from "@/components/Layout";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Get total statistics for the sidebar widget
  const problems = await db.problem.findMany({
    select: { completed: true },
  });

  const total = problems.length;
  const completed = problems.filter((p: any) => p.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <SidebarLayout
      isAdmin={true}
      adminEmail={session.email}
      overallProgress={{ total, completed, percentage }}
    >
      {children}
    </SidebarLayout>
  );
}
