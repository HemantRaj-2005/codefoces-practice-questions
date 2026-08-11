"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from "recharts";
import { Award, Calendar, ChevronRight, TrendingUp } from "lucide-react";

interface ContestsClientProps {
  contests: any[];
}

export function ContestsClient({ contests }: ContestsClientProps) {
  // Process data for rating change bar chart
  const chartData = React.useMemo(() => {
    return contests.map((c) => ({
      name: c.name.length > 20 ? c.name.substring(0, 18) + "..." : c.name,
      change: c.ratingChange,
      rank: c.rank,
      date: new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [contests]);

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

  return (
    <div className="space-y-6">
      {/* Rating Change Bar Chart */}
      <GlassCard glassClassName="glass-2 p-5 border-white/8 relative overflow-hidden shadow-lg">
        <div>
          <h3 className="font-bold text-sm text-white">Contest Performance & Rating Changes</h3>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Delta change in rating per contest participation</span>
        </div>

        <div className="h-64 w-full pt-6">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="#707384" fontSize={10} tickLine={false} />
                <YAxis stroke="#707384" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={customTooltipStyle.contentStyle}
                  labelStyle={customTooltipStyle.labelStyle}
                />
                <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.1)" />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isPositive = entry.change >= 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isPositive ? "rgba(91, 140, 255, 0.75)" : "rgba(255, 84, 47, 0.75)"}
                        stroke={isPositive ? "#5b8cff" : "#ff542f"}
                        strokeWidth={1}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-550 text-xs">
              No contest rating delta history synced yet. Let's practice first!
            </div>
          )}
        </div>
      </GlassCard>

      {/* Contests List Table */}
      <GlassCard glassClassName="glass-2 border-white/6 overflow-hidden shadow-md">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Contest History Logs</h3>
          <Badge variant="outline">{contests.length} Contests</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/1 text-zinc-450 font-bold uppercase tracking-wider text-[9px]">
                <th className="px-5 py-3">Contest Name</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-center">Rank</th>
                <th className="px-5 py-3 text-center">Change</th>
                <th className="px-5 py-3 text-right">Rating After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {contests.length > 0 ? (
                contests.map((c) => {
                  const isPositive = c.ratingChange >= 0;
                  return (
                    <tr key={c.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-zinc-200 truncate max-w-[300px]" title={c.name}>
                        {c.name}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">
                        {new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-zinc-300">
                        {c.rank}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold inline-block border",
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          )}
                        >
                          {isPositive ? `+${c.ratingChange}` : c.ratingChange}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-[#ffbe3c]">
                        {c.ratingAfter}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-zinc-550">
                    No connected contest records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
export default ContestsClient;
