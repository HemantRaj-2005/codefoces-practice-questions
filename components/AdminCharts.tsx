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
      backgroundColor: "rgba(9, 9, 11, 0.9)",
      borderColor: "rgba(39, 39, 42, 0.8)",
      borderRadius: "8px",
      color: "#f4f4f5",
      backdropFilter: "blur(8px)",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
    },
    labelStyle: {
      fontWeight: "bold",
      color: "#ffffff",
    },
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Chart 1: Completion by Topic */}
      <Card className="border-zinc-800 bg-zinc-950/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Completion by Topic</CardTitle>
          <CardDescription>Comparison of total and completed problems per topic</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {completionByTopic.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={completionByTopic}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={customTooltipStyle.contentStyle}
                  labelStyle={customTooltipStyle.labelStyle}
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar
                  name="Completed"
                  dataKey="completed"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  name="Total Problems"
                  dataKey="total"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
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
      <Card className="border-zinc-800 bg-zinc-950/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Problems by Rating</CardTitle>
          <CardDescription>Distribution of problems based on Codeforces rating</CardDescription>
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="rating" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={customTooltipStyle.contentStyle}
                  labelStyle={customTooltipStyle.labelStyle}
                />
                <Area
                  name="Count"
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
              No rating statistics available. Upload problems via CSV to populate data.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default AdminCharts;
