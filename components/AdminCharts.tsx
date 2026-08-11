"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

interface TopicData {
  name: string;
  completed: number;
  total: number;
  percentage: number;
}

interface RatingData {
  rating: string;
  count: number;
}

interface AdminChartsProps {
  completionByTopic: TopicData[];
  problemsByRating: RatingData[];
}

export function AdminCharts({ completionByTopic, problemsByRating }: AdminChartsProps) {
  // Custom tooltip styling for glassmorphic design
  const customTooltipStyle = {
    contentStyle: {
      backgroundColor: "rgba(8, 10, 18, 0.85)",
      borderColor: "rgba(255, 255, 255, 0.14)",
      borderRadius: "14px",
      color: "#f0f0f5",
      backdropFilter: "blur(20px) saturate(140%)",
      boxShadow: "0 12px 35px rgba(0, 0, 0, 0.45)",
      border: "1px solid rgba(255, 255, 255, 0.10)",
    },
    labelStyle: {
      fontWeight: "bold",
      color: "#ffffff",
    },
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Chart 1: Completion by Topic */}
      <Card className="glass-2 border border-white/8 shadow-lg relative overflow-hidden glass-reflect">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Completion by Topic</CardTitle>
          <CardDescription className="text-xs text-zinc-400">Comparison of total and completed problems per topic</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {completionByTopic.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={completionByTopic}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="#707384" fontSize={10} tickLine={false} />
                <YAxis stroke="#707384" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={customTooltipStyle.contentStyle}
                  labelStyle={customTooltipStyle.labelStyle}
                  cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                <Bar
                  name="Completed"
                  dataKey="completed"
                  fill="#ffbe3c"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  className="drop-shadow-[0_0_6px_rgba(255,190,60,0.3)]"
                />
                <Bar
                  name="Total Problems"
                  dataKey="total"
                  fill="#625cff"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  className="drop-shadow-[0_0_6px_rgba(98,92,255,0.3)]"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
              No topic statistics available. Seed the database to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Problems by Rating */}
      <Card className="glass-2 border border-white/8 shadow-lg relative overflow-hidden glass-reflect">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Problems by Rating</CardTitle>
          <CardDescription className="text-xs text-zinc-400">Distribution of problems based on Codeforces rating</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {problemsByRating.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={problemsByRating}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff542f" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ff542f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                <XAxis dataKey="rating" stroke="#707384" fontSize={10} tickLine={false} />
                <YAxis stroke="#707384" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={customTooltipStyle.contentStyle}
                  labelStyle={customTooltipStyle.labelStyle}
                />
                <Area
                  name="Count"
                  type="monotone"
                  dataKey="count"
                  stroke="#ff542f"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-555 text-xs">
              No rating statistics available. Upload problems via CSV to populate data.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default AdminCharts;
