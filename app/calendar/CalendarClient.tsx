"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle, Flame, Calendar, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CalendarClientProps {
  activities: any[];
}

export function CalendarClient({ activities }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = React.useState<any | null>(null);

  // Map dates YYYY-MM-DD to activities
  const activityMap = React.useMemo(() => {
    const map = new Map<string, any>();
    activities.forEach((act) => {
      const d = new Date(act.date);
      const key = d.toISOString().split("T")[0];
      map.set(key, act);
    });
    return map;
  }, [activities]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get name of the month
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Get first day of the month (0 = Sunday, 1 = Monday...)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Get total days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Prev month helper
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayInfo(null);
  };

  // Next month helper
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayInfo(null);
  };

  // Get color for solve count
  const getSolveIntensityClass = (solved: number) => {
    if (solved === 0) return "bg-white/3 hover:bg-white/6 border-white/5";
    if (solved <= 1) return "bg-[#5b8cff]/20 border-[#5b8cff]/30 text-[#5b8cff] shadow-[0_0_6px_rgba(91,140,255,0.15)]";
    if (solved <= 3) return "bg-[#9b6dff]/30 border-[#9b6dff]/40 text-[#9b6dff] shadow-[0_0_8px_rgba(155,110,255,0.2)]";
    return "bg-[#ff542f]/30 border-[#ff542f]/40 text-[#ff542f] shadow-[0_0_12px_rgba(255,84,47,0.3)]";
  };

  // Generate calendar days
  const calendarCells = React.useMemo(() => {
    const cells = [];
    
    // Fill empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    // Fill days of the month
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      const dateKey = cellDate.toISOString().split("T")[0];
      const activity = activityMap.get(dateKey) || { solvedCount: 0, submissionCount: 0 };
      
      cells.push({
        day,
        date: cellDate,
        dateKey,
        solved: activity.solvedCount,
        submissions: activity.submissionCount,
      });
    }

    return cells;
  }, [year, month, firstDayIndex, totalDays, activityMap]);

  const selectDay = (dayData: any) => {
    if (!dayData) return;
    setSelectedDayInfo(dayData);
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid card */}
      <GlassCard className="col-span-1 lg:col-span-2" glassClassName="glass-2 border-white/8 p-5 relative overflow-hidden shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-sm text-white">{monthName} {year}</h3>
            <span className="text-[10px] text-zinc-550 uppercase tracking-widest font-semibold">Coding activity calendar</span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handlePrevMonth}
              className="bg-white/4 border border-white/8 hover:bg-white/6 hover:text-white rounded-lg h-8 px-2.5"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDayInfo(null);
              }}
              className="bg-white/4 border border-white/8 hover:bg-white/6 hover:text-white rounded-lg text-xs font-semibold h-8 px-3"
            >
              Today
            </Button>
            <Button
              size="sm"
              onClick={handleNextMonth}
              className="bg-white/4 border border-white/8 hover:bg-white/6 hover:text-white rounded-lg h-8 px-2.5"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Days labels */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2 border-b border-white/5">
            {daysOfWeek.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-2 pt-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="aspect-square bg-transparent" />;
              
              const isSelected = selectedDayInfo?.dateKey === cell.dateKey;
              const hasSolves = cell.solved > 0;
              const isToday = new Date().toISOString().split("T")[0] === cell.dateKey;

              return (
                <button
                  key={cell.dateKey}
                  onClick={() => selectDay(cell)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col justify-between p-2 text-left border relative transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer",
                    getSolveIntensityClass(cell.solved),
                    isSelected ? "ring-2 ring-white/30 border-white/30" : "",
                    isToday ? "border-[#ffbe3c]/50" : ""
                  )}
                >
                  <span className="text-[10px] font-bold text-zinc-350">{cell.day}</span>
                  {hasSolves && (
                    <span className="h-1.5 w-1.5 rounded-full self-end bg-current mt-1" />
                  )}
                  {isToday && !hasSolves && (
                    <span className="text-[8px] font-bold text-[#ffbe3c] absolute bottom-1.5 right-2 uppercase tracking-wide">now</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Day details Sidebar Card */}
      <GlassCard className="col-span-1" glassClassName="glass-2 border-white/8 p-5 relative overflow-hidden shadow-lg">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-[#5b8cff]" />
          Practice Details
        </h3>

        <AnimatePresence mode="wait">
          {selectedDayInfo ? (
            <motion.div
              key={selectedDayInfo.dateKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-xs"
            >
              <div className="pb-3 border-b border-white/5">
                <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-widest block">Date selected</span>
                <span className="text-zinc-200 font-bold block mt-1">
                  {new Date(selectedDayInfo.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                  <span className="text-zinc-400 font-medium">Problems Solved</span>
                  <span className="font-extrabold text-[#ffbe3c] text-sm">{selectedDayInfo.solved} problems</span>
                </div>

                <div className="flex justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                  <span className="text-zinc-400 font-medium">Submissions Sent</span>
                  <span className="font-extrabold text-[#5b8cff] text-sm">{selectedDayInfo.submissions} attempts</span>
                </div>

                <div className="flex justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                  <span className="text-zinc-400 font-medium">First Solve Status</span>
                  <span className="font-semibold text-zinc-350">
                    {selectedDayInfo.solved > 0 ? "✓ Solves logged" : "No solved problems"}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-550 text-xs">
              <CheckCircle className="h-6 w-6 mb-2 text-zinc-600" />
              Select a date on the calendar grid to reveal practice details.
            </div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
export default CalendarClient;
