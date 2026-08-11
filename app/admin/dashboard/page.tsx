import { db } from "@/lib/db";
import { AdminCharts } from "@/components/AdminCharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
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
        <GlassCard className="col-span-1" glassClassName="glass-blue relative overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Total Problems</span>
              <span className="text-3xl font-extrabold text-[#716bff] drop-shadow-[0_0_8px_rgba(113,107,255,0.2)]">{total}</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-[#4c6fff] shadow-sm">
              <CheckSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-1" glassClassName="glass-yellow relative overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Completed</span>
              <span className="text-3xl font-extrabold text-[#ffbe3c] drop-shadow-[0_0_8px_rgba(255,190,60,0.2)]">{completed}</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-[#ffbe3c] shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-1" glassClassName="glass-orange relative overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Completion %</span>
              <span className="text-3xl font-extrabold text-[#ff542f] drop-shadow-[0_0_8px_rgba(255,84,47,0.2)]">{percentage}%</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-[#ff542f] shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-1" glassClassName="glass-red relative overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Remaining</span>
              <span className="text-3xl font-extrabold text-[#ff4646] drop-shadow-[0_0_8px_rgba(255,70,70,0.2)]">{remaining}</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-[#ff4646] shadow-sm">
              <ListPlus className="h-5 w-5" />
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Visual Charts */}
      <AdminCharts completionByTopic={completionByTopic} problemsByRating={problemsByRating} />
    </div>
  );
}
