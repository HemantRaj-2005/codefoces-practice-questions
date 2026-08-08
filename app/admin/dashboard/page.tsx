import { db } from "@/lib/db";
import { AdminCharts } from "@/components/AdminCharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Activity, CheckSquare, ListPlus, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch topics, subtopics, and problems
  const topics = await db.topic.findMany({
    include: {
      subTopics: {
        include: {
          problems: true,
        },
      },
    },
  });

  const allProblems = topics.flatMap((t: any) =>
    t.subTopics.flatMap((st: any) => st.problems)
  );

  const total = allProblems.length;
  const completed = allProblems.filter((p: any) => p.completed).length;
  const remaining = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 1. Completion by Topic Data
  const completionByTopic = topics.map((t: any) => {
    const problems = t.subTopics.flatMap((st: any) => st.problems);
    const totalP = problems.length;
    const completedP = problems.filter((p: any) => p.completed).length;
    return {
      name: t.name,
      completed: completedP,
      total: totalP,
      percentage: totalP > 0 ? Math.round((completedP / totalP) * 100) : 0,
    };
  });

  // 2. Problems by Rating Data
  const ratingMap: Record<number, number> = {};
  allProblems.forEach((p: any) => {
    ratingMap[p.rating] = (ratingMap[p.rating] || 0) + 1;
  });

  const problemsByRating = Object.entries(ratingMap)
    .map(([rating, count]) => ({
      rating: rating,
      count: count,
    }))
    .sort((a, b) => parseInt(a.rating) - parseInt(b.rating));

  // Recent completions
  const recentCompletions = await db.problem.findMany({
    where: { completed: true },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Monitor your problem-solving metrics and distribution statistics.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-blue">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Problems</span>
              <span className="text-3xl font-extrabold text-[#716bff]">{total}</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#4c6fff]/10 border border-[#4c6fff]/20 flex items-center justify-center text-[#4c6fff]">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-yellow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Completed</span>
              <span className="text-3xl font-extrabold text-[#ffbe3c]">{completed}</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#ffbe3c]/10 border border-[#ffbe3c]/20 flex items-center justify-center text-[#ffbe3c]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-orange">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Completion %</span>
              <span className="text-3xl font-extrabold text-[#ff542f]">{percentage}%</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#ff542f]/10 border border-[#ff542f]/20 flex items-center justify-center text-[#ff542f]">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-red">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Remaining</span>
              <span className="text-3xl font-extrabold text-[#ff4646]">{remaining}</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#ff4646]/10 border border-[#ff4646]/20 flex items-center justify-center text-[#ff4646]">
              <ListPlus className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts */}
      <AdminCharts completionByTopic={completionByTopic} problemsByRating={problemsByRating} />

      {/* Recent Completions */}
      <Card className="border-zinc-800 bg-zinc-950/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Recent Completions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCompletions.length > 0 ? (
            <div className="divide-y divide-zinc-900">
              {recentCompletions.map((p: any) => (
                <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-semibold text-zinc-200">{p.problem}</h5>
                    <span className="text-zinc-500">Rating: {p.rating} | {p.mainTopic}</span>
                  </div>
                  <span className="text-zinc-500 font-medium">
                    {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No problems completed yet. Check off a problem on the homepage to start recording history!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
