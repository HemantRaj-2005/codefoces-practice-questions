"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Zap,
  Info,
  Clock,
} from "lucide-react";

interface DashboardClientProps {
  user: any;
  recommendationsData: {
    weakAreas: any[];
    recommendations: any[];
  };
}

export function DashboardClient({ user, recommendationsData }: DashboardClientProps) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [hoveredDay, setHoveredDay] = React.useState<any>(null);

  // 1. Prepare Contest Rating Data for Chart
  const ratingData = React.useMemo(() => {
    if (!user.contests || user.contests.length === 0) return [];
    return user.contests.map((c: any) => ({
      name: c.name,
      rating: c.ratingAfter,
      change: c.ratingChange,
      rank: c.rank,
      date: new Date(c.date).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    }));
  }, [user.contests]);

  // 2. Prepare Heatmap solves calendar (past 365 days)
  const heatmapDays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    
    // Map dates to activity counts
    const activityMap = new Map<string, { solved: number; total: number }>();
    user.activities?.forEach((act: any) => {
      const dateKey = act.date.toISOString().split("T")[0];
      activityMap.set(dateKey, { solved: act.solvedCount, total: act.submissionCount });
    });

    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const stats = activityMap.get(dateStr) || { solved: 0, total: 0 };
      days.push({
        date: d,
        dateString: dateStr,
        solved: stats.solved,
        submissions: stats.total,
        accepted: stats.solved,
      });
    }
    return days;
  }, [user.activities]);

  // 3. Prepare Topic progress percentages
  const topicProgress = React.useMemo(() => {
    const topics: Record<string, { solved: number; total: number }> = {};
    user.progress?.forEach((prog: any) => {
      const topic = prog.problem.mainTopic;
      if (!topic) return;
      if (!topics[topic]) {
        topics[topic] = { solved: 0, total: 0 };
      }
      topics[topic].total += 1;
      if (prog.status === "SOLVED") {
        topics[topic].solved += 1;
      }
    });

    return Object.entries(topics).map(([name, stats]) => {
      const percentage = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;
      return { name, solved: stats.solved, total: stats.total, percentage };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [user.progress]);

  // Heatmap helper for square glass color intensity
  const getHeatmapColor = (solved: number) => {
    if (solved === 0) return "bg-white/5 border-white/5";
    if (solved <= 1) return "bg-[#5b8cff]/20 border-[#5b8cff]/30 shadow-[0_0_6px_rgba(91,140,255,0.1)]"; // cool blue
    if (solved <= 3) return "bg-[#9b6dff]/40 border-[#9b6dff]/50 shadow-[0_0_10px_rgba(155,110,255,0.2)]"; // purple
    if (solved <= 5) return "bg-[#ffbe3c]/60 border-[#ffbe3c]/70 shadow-[0_0_12px_rgba(255,190,60,0.3)]"; // warm amber
    return "bg-[#ff542f]/85 border-[#ff542f] shadow-[0_0_16px_rgba(255,84,47,0.4)]"; // hot orange/red
  };

  const customTooltipStyle = {
    contentStyle: {
      backgroundColor: "rgba(8, 10, 18, 0.85)",
      borderColor: "rgba(255, 255, 255, 0.12)",
      borderRadius: "14px",
      color: "#f0f0f5",
      backdropFilter: "blur(20px) saturate(140%)",
      boxShadow: "0 12px 35px rgba(0, 0, 0, 0.45)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
    },
    labelStyle: {
      fontWeight: "bold",
      color: "#ffffff",
    },
  };

  const solvedCount = user.progress?.filter((p: any) => p.status === "SOLVED").length || 0;
  const attemptedCount = user.progress?.filter((p: any) => p.status === "ATTEMPTED").length || 0;
  const acceptanceRate = solvedCount + attemptedCount > 0 
    ? Math.round((solvedCount / (solvedCount + attemptedCount)) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome header & connected card details */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CP Overview Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Realtime monitoring of your competitive programming milestones and Codeforces metrics.
          </p>
        </div>

        {user.codeforcesHandle ? (
          <GlassCard glassClassName="glass-2 px-5 py-3 border-white/8 relative overflow-hidden flex items-center gap-4">
            <div className="relative h-10 w-10 rounded-full border border-white/10 overflow-hidden shadow-sm">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-white/5 flex items-center justify-center text-xs">CF</div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">@{user.codeforcesHandle}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950 animate-pulse" />
              </div>
              <span className="text-[10px] text-zinc-450 font-semibold uppercase tracking-wider block mt-0.5">
                {user.codeforcesRank || "Unranked"}
              </span>
            </div>
            <div className="border-l border-white/5 pl-4 flex gap-4 text-center">
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Rating</span>
                <span className="font-extrabold text-sm text-[#ff6a3d]">{user.codeforcesRating || "-"}</span>
              </div>
              <div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">Max</span>
                <span className="font-extrabold text-sm text-zinc-350">{user.codeforcesMaxRating || "-"}</span>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard glassClassName="glass-red p-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <div className="text-xs">
              No Codeforces account connected.{" "}
              <a href="/settings" className="underline font-semibold hover:text-white">Connect handle</a>
            </div>
          </GlassCard>
        )}
      </div>

      {/* CP Platform Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Rating */}
        <GlassCard className="col-span-1" glassClassName="glass-orange relative overflow-hidden">
          <div className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Rating</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#ff6a3d] drop-shadow-[0_0_8px_rgba(255,106,61,0.2)]">
                {user.codeforcesRating || "-"}
              </span>
              <span className="text-[9px] text-zinc-450 uppercase tracking-wider block">Rank: {user.codeforcesRank || "-"}</span>
            </div>
          </div>
        </GlassCard>

        {/* Solved Problems */}
        <GlassCard className="col-span-1" glassClassName="glass-yellow relative overflow-hidden">
          <div className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Solved</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#ffbe3c] drop-shadow-[0_0_8px_rgba(255,190,60,0.2)]">
                {solvedCount}
              </span>
              <span className="text-[9px] text-zinc-450 uppercase tracking-wider block">CF database</span>
            </div>
          </div>
        </GlassCard>

        {/* Current Streak */}
        <GlassCard className="col-span-1" glassClassName="glass-red relative overflow-hidden">
          <div className="p-4 flex flex-col justify-between h-24">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Current Streak</span>
              {user.currentStreak > 0 && <Flame className="h-4 w-4 text-[#ff542f] animate-pulse" />}
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#ff4b4b] drop-shadow-[0_0_8px_rgba(255,75,75,0.2)]">
                {user.currentStreak} <span className="text-xs font-semibold text-zinc-400">days</span>
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Longest Streak */}
        <GlassCard className="col-span-1" glassClassName="glass-purple relative overflow-hidden">
          <div className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Longest Streak</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#9b6dff] drop-shadow-[0_0_8px_rgba(155,110,255,0.2)]">
                {user.longestStreak} <span className="text-xs font-semibold text-zinc-400">days</span>
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Max Rating */}
        <GlassCard className="col-span-1" glassClassName="glass-blue relative overflow-hidden">
          <div className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Max Rating</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#5b8cff] drop-shadow-[0_0_8px_rgba(91,140,255,0.2)]">
                {user.codeforcesMaxRating || "-"}
              </span>
              <span className="text-[9px] text-zinc-450 uppercase tracking-wider block">{user.codeforcesMaxRank || "-"}</span>
            </div>
          </div>
        </GlassCard>

        {/* Acceptance Rate */}
        <GlassCard className="col-span-1" glassClassName="glass-blue relative overflow-hidden">
          <div className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Acceptance %</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-zinc-200">
                {acceptanceRate}%
              </span>
              <span className="text-[9px] text-zinc-455 uppercase tracking-wider block">Solved: {solvedCount}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Daily Target Progress Alert */}
      <GlassCard glassClassName="glass-gradient-amber-orange p-5 border-white/10 relative overflow-hidden shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-[#ffbe3c]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Today's Practice Target</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Maintain your solve streak by tracking your target goals.</p>
            </div>
          </div>
          <div className="w-full sm:max-w-xs flex flex-col gap-1.5 self-stretch sm:self-center">
            <div className="flex justify-between text-[10px] font-bold text-zinc-300">
              <span>Goal Solves: {user.dailyTarget} problems</span>
              <span>Daily Target</span>
            </div>
            <Progress value={Math.min(100, (solvedCount / user.dailyTarget) * 100)} className="h-2" />
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column: Rating over time graph */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <GlassCard glassClassName="glass-2 border-white/8 relative overflow-hidden shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-sm text-white">Codeforces Rating Graph</h3>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Contest history and ratings progress</span>
              </div>
            </div>
            
            <div className="h-80 w-full pt-2">
              {ratingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6a3d" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ff6a3d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                    <XAxis dataKey="date" stroke="#707384" fontSize={10} tickLine={false} />
                    <YAxis stroke="#707384" fontSize={10} tickLine={false} domain={["dataMin - 100", "dataMax + 100"]} />
                    <Tooltip
                      contentStyle={customTooltipStyle.contentStyle}
                      labelStyle={customTooltipStyle.labelStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      stroke="#ff6a3d"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#ratingGrad)"
                      name="Rating"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-550 text-xs">
                  <Info className="h-5 w-5 mb-1.5" />
                  No contest rating history synced. Connect your handle and compete!
                </div>
              )}
            </div>
          </GlassCard>

          {/* Activity Heatmap Grid */}
          <GlassCard glassClassName="glass-2 border-white/8 relative overflow-hidden shadow-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-sm text-white">Daily Solving Heatmap</h3>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Activity levels from your Codeforces submissions</span>
              </div>
              {hoveredDay && (
                <div className="text-[10px] text-zinc-350 bg-white/4 px-2.5 py-1 rounded-lg border border-white/6 animate-in fade-in">
                  <strong>{new Date(hoveredDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>:{" "}
                  {hoveredDay.solved} solves / {hoveredDay.submissions} attempts
                </div>
              )}
            </div>

            {/* Grid display */}
            <div className="overflow-x-auto">
              <div className="flex gap-[3px] min-w-[650px] p-1">
                {/* 53 columns representing weeks */}
                {Array.from({ length: 53 }).map((_, weekIdx) => {
                  return (
                    <div key={weekIdx} className="flex flex-col gap-[3px]">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const dayOffset = weekIdx * 7 + dayIdx;
                        const dayData = heatmapDays[dayOffset];
                        if (!dayData) return null;
                        
                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              "w-[9px] h-[9px] rounded-[2px] transition-all cursor-pointer hover:scale-125 border",
                              getHeatmapColor(dayData.solved)
                            )}
                            onMouseEnter={() => setHoveredDay(dayData)}
                            onMouseLeave={() => setHoveredDay(null)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-end gap-1.5 mt-3 items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest pr-1">
              <span>Less</span>
              <div className="w-[8px] h-[8px] rounded-[1px] bg-white/5 border border-white/5" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-[#5b8cff]/20 border-[#5b8cff]/30" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-[#9b6dff]/40 border-[#9b6dff]/50" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-[#ffbe3c]/60 border-[#ffbe3c]/70" />
              <div className="w-[8px] h-[8px] rounded-[1px] bg-[#ff542f]/85 border-[#ff542f]" />
              <span>More</span>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Column: Streak / Recommendations / Weak Topics */}
        <div className="space-y-6">
          {/* Smart Recommendations */}
          <GlassCard glassClassName="glass-2 border-white/8 relative overflow-hidden shadow-lg p-5">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Lightbulb className="h-4.5 w-4.5 text-[#ffbe3c]" />
              Smart Recommendations
            </h3>
            <div className="space-y-3.5">
              {recommendationsData.recommendations && recommendationsData.recommendations.length > 0 ? (
                recommendationsData.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/3 border border-white/6 shadow-sm hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <a
                        href={rec.problem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold hover:underline text-zinc-150 hover:text-white"
                      >
                        {rec.problem.problem}
                      </a>
                      <Badge variant="rating">{rec.problem.rating}</Badge>
                    </div>
                    <p className="text-[10px] text-zinc-450 mt-1.5 leading-snug">{rec.reason}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-550 text-xs font-medium">
                  Solve problems in the catalog to generate personalized syllabus recommendations.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Weak Areas Analyser */}
          <GlassCard glassClassName="glass-2 border-white/8 relative overflow-hidden shadow-lg p-5">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-[#ff542f]" />
              Weak Areas Analysis
            </h3>
            <div className="space-y-3.5">
              {recommendationsData.weakAreas && recommendationsData.weakAreas.length > 0 ? (
                recommendationsData.weakAreas.map((area: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-200">{area.topic}</span>
                      <span className="text-[#ff542f]">{area.successRate}% rate</span>
                    </div>
                    <Progress value={area.successRate} className="h-1.5" indicatorClassName="bg-gradient-to-r from-red-500 to-red-400" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-550 text-xs font-medium">
                  Connect Codeforces to compile performance metrics by topic.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Topic Progress Breakdown */}
          <GlassCard glassClassName="glass-2 border-white/8 relative overflow-hidden shadow-lg p-5">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-[#9b6dff]" />
              Topic Syllabus Progress
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {topicProgress.length > 0 ? (
                topicProgress.slice(0, 5).map((topic: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                      <span>{topic.name}</span>
                      <span>{topic.percentage}%</span>
                    </div>
                    <Progress value={topic.percentage} className="h-1" indicatorClassName="bg-[#9b6dff]" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-550 text-xs">
                  No progress statistics recorded yet.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
export default DashboardClient;
