"use client";

import * as React from "react";
import SidebarLayout from "@/components/Layout";
import { cn, extractProblemId } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toggleProblemCompletion, updateProblemNotes } from "@/actions/problems";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "motion/react";
import { ExternalLink, Search, SlidersHorizontal, BookOpen, CheckCircle2, Circle, AlertCircle, RefreshCw, LayoutGrid, List } from "lucide-react";

// Inline Codeforces Logo SVG component
const CodeforcesIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    className="inline-block shrink-0"
    fill="currentColor"
  >
    {/* Red/brown bar */}
    <rect x="2" y="10" width="4" height="12" rx="1" fill="#b13333" />
    {/* Blue bar */}
    <rect x="8" y="2" width="4" height="20" rx="1" fill="#3b5998" />
    {/* Yellow/gold bar */}
    <rect x="14" y="6" width="4" height="16" rx="1" fill="#f4a261" />
  </svg>
);

interface Problem {
  id: string;
  subTopicId: string;
  problem: string;
  rating: number;
  mainTopic: string;
  hiddenPattern: string | null;
  link: string;
  completed: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SubTopic {
  id: string;
  topicId: string;
  name: string;
  order: number;
  problems: Problem[];
  createdAt: Date;
  updatedAt: Date;
}

interface Topic {
  id: string;
  name: string;
  order: number;
  subTopics: SubTopic[];
  createdAt: Date;
  updatedAt: Date;
}

interface HomePageClientProps {
  initialTopics: Topic[];
  stats: {
    total: number;
    completed: number;
    remaining: number;
    topicsCount: number;
    subtopicsCount: number;
    percentage: number;
  };
  adminEmail: string | null;
}

export default function HomePageClient({
  initialTopics,
  stats: initialStats,
  adminEmail,
}: HomePageClientProps) {
  const { toast } = useToast();
  const [topics, setTopics] = React.useState<Topic[]>(initialTopics);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [completedFilter, setCompletedFilter] = React.useState<"all" | "completed" | "incomplete">("all");
  const [minRating, setMinRating] = React.useState<string>("");
  const [maxRating, setMaxRating] = React.useState<string>("");
  const [selectedMainTopic, setSelectedMainTopic] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<"rating-asc" | "rating-desc" | "name" | "newest" | "oldest" | "completed">("rating-asc");
  const [showFilters, setShowFilters] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");

  // Notes Autosave Local State
  const [notesState, setNotesState] = React.useState<Record<string, string>>({});
  const debounceTimers = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Sync initial note values
  React.useEffect(() => {
    const notesMap: Record<string, string> = {};
    initialTopics.forEach((t) => {
      t.subTopics.forEach((st) => {
        st.problems.forEach((p) => {
          notesMap[p.id] = p.notes || "";
        });
      });
    });
    setNotesState(notesMap);
  }, [initialTopics]);

  // Extract unique main topics
  const uniqueMainTopics = React.useMemo(() => {
    const topicsSet = new Set<string>();
    initialTopics.forEach((t) => {
      t.subTopics.forEach((st) => {
        st.problems.forEach((p) => {
          if (p.mainTopic) topicsSet.add(p.mainTopic);
        });
      });
    });
    return Array.from(topicsSet).sort();
  }, [initialTopics]);

  // Handle Note Changes with Debounce
  const handleNoteChange = (problemId: string, value: string) => {
    setNotesState((prev) => ({ ...prev, [problemId]: value }));

    if (debounceTimers.current[problemId]) {
      clearTimeout(debounceTimers.current[problemId]);
    }

    debounceTimers.current[problemId] = setTimeout(async () => {
      try {
        await updateProblemNotes(problemId, value);
        toast({
          type: "success",
          description: "Note autosaved successfully.",
          duration: 1000,
        });
      } catch (err) {
        toast({
          type: "error",
          description: "Failed to autosave note.",
        });
      }
    }, 1000);
  };

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Handle Optimistic Completed Toggling
  const handleToggleCompletion = async (problemId: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;

    // Optimistically update UI
    setTopics((prevTopics) =>
      prevTopics.map((topic) => ({
        ...topic,
        subTopics: topic.subTopics.map((sub) => ({
          ...sub,
          problems: sub.problems.map((prob) =>
            prob.id === problemId
              ? {
                  ...prob,
                  completed: newCompleted,
                }
              : prob
          ),
        })),
      }))
    );

    try {
      await toggleProblemCompletion(problemId, newCompleted);
      toast({
        type: "success",
        description: `Problem marked as ${newCompleted ? "completed" : "incomplete"}.`,
        duration: 2000,
      });
    } catch (err) {
      // Revert state on error
      setTopics((prevTopics) =>
        prevTopics.map((topic) => ({
          ...topic,
          subTopics: topic.subTopics.map((sub) => ({
            ...sub,
            problems: sub.problems.map((prob) =>
              prob.id === problemId
                ? {
                    ...prob,
                    completed: currentCompleted,
                  }
                : prob
            ),
          })),
        }))
      );
      toast({
        type: "error",
        description: "Failed to update problem completion state.",
      });
    }
  };

  // Process and Filter Data
  const processedTopics = React.useMemo(() => {
    return topics
      .map((topic) => {
        const subTopics = topic.subTopics
          .map((sub) => {
            let filteredProblems = [...sub.problems];

            // 1. Search Query (Name, mainTopic, hiddenPattern)
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase().trim();
              filteredProblems = filteredProblems.filter(
                (p) =>
                  p.problem.toLowerCase().includes(query) ||
                  p.mainTopic.toLowerCase().includes(query) ||
                  (p.hiddenPattern && p.hiddenPattern.toLowerCase().includes(query))
              );
            }

            // 2. Completed Status Filter
            if (completedFilter === "completed") {
              filteredProblems = filteredProblems.filter((p) => p.completed);
            } else if (completedFilter === "incomplete") {
              filteredProblems = filteredProblems.filter((p) => !p.completed);
            }

            // 3. Rating Range Filter
            if (minRating) {
              const minVal = parseInt(minRating, 10);
              if (!isNaN(minVal)) {
                filteredProblems = filteredProblems.filter((p) => p.rating >= minVal);
              }
            }
            if (maxRating) {
              const maxVal = parseInt(maxRating, 10);
              if (!isNaN(maxVal)) {
                filteredProblems = filteredProblems.filter((p) => p.rating <= maxVal);
              }
            }

            // 4. Main Topic Filter
            if (selectedMainTopic !== "all") {
              filteredProblems = filteredProblems.filter((p) => p.mainTopic === selectedMainTopic);
            }

            // 5. Sorting
            filteredProblems.sort((a, b) => {
              if (sortBy === "rating-asc") return a.rating - b.rating;
              if (sortBy === "rating-desc") return b.rating - a.rating;
              if (sortBy === "name") return a.problem.localeCompare(b.problem);
              if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              if (sortBy === "completed") return (b.completed ? 1 : 0) - (a.completed ? 1 : 0);
              return 0;
            });

            return { ...sub, problems: filteredProblems };
          })
          // Filter out subtopics that have no matching problems (only if search/filters are active)
          .filter((sub) => {
            const hasFilterActive = searchQuery || completedFilter !== "all" || minRating || maxRating || selectedMainTopic !== "all";
            return !hasFilterActive || sub.problems.length > 0;
          });

        return { ...topic, subTopics };
      })
      .filter((topic) => {
        const hasFilterActive = searchQuery || completedFilter !== "all" || minRating || maxRating || selectedMainTopic !== "all";
        return !hasFilterActive || topic.subTopics.length > 0;
      });
  }, [topics, searchQuery, completedFilter, minRating, maxRating, selectedMainTopic, sortBy]);

  // Recalculate stats based on current database state (takes optimistic states into account)
  const currentStats = React.useMemo(() => {
    const all = topics.flatMap((t) => t.subTopics.flatMap((st) => st.problems));
    const total = all.length;
    const completed = all.filter((p) => p.completed).length;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      remaining,
      topicsCount: topics.length,
      subtopicsCount: topics.reduce((acc, t) => acc + t.subTopics.length, 0),
      percentage,
    };
  }, [topics]);

  return (
    <SidebarLayout
      adminEmail={adminEmail}
      overallProgress={{
        total: currentStats.total,
        completed: currentStats.completed,
        percentage: currentStats.percentage,
      }}
    >
      {/* Homepage Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <GlassCard className="col-span-1" glassClassName="glass-blue relative overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Problems</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-extrabold text-[#716bff] drop-shadow-[0_0_8px_rgba(113,107,255,0.2)]">{currentStats.total}</span>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-1" glassClassName="glass-yellow relative overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Completed</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-extrabold text-[#ffbe3c] drop-shadow-[0_0_8px_rgba(255,190,60,0.2)]">{currentStats.completed}</span>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-1" glassClassName="glass-red relative overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Remaining</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-extrabold text-[#ff4646] drop-shadow-[0_0_8px_rgba(255,70,70,0.2)]">{currentStats.remaining}</span>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-1" glassClassName="glass-purple relative overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Topics</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-extrabold text-[#8c5aff] drop-shadow-[0_0_8px_rgba(140,90,255,0.2)]">{currentStats.topicsCount}</span>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-1" glassClassName="glass-blue relative overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subtopics</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-extrabold text-[#4c6fff] drop-shadow-[0_0_8px_rgba(76,111,255,0.2)]">{currentStats.subtopicsCount}</span>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-1" glassClassName="glass-orange relative overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Completion %</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-extrabold text-[#ff542f] drop-shadow-[0_0_8px_rgba(255,84,47,0.2)]">{currentStats.percentage}%</span>
          </CardContent>
        </GlassCard>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-2 p-4 rounded-2xl border border-white/8 shadow-lg relative overflow-hidden glass-reflect">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search problems, main topics, hidden patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-white/6 bg-black/25 rounded-xl p-0.5 shrink-0 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
                  viewMode === "grid"
                    ? "bg-white/10 text-white shadow-md border border-white/5"
                    : "text-zinc-550 hover:text-zinc-300 border border-transparent"
                )}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
                  viewMode === "table"
                    ? "bg-white/10 text-white shadow-md border border-white/5"
                    : "text-zinc-550 hover:text-zinc-300 border border-transparent"
                )}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            
            {/* Quick Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-9 rounded-xl border border-white/8 bg-black/25 px-3 text-xs text-zinc-300 focus-visible:outline-none focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/15 shadow-inner transition-all duration-200 cursor-pointer"
            >
              <option value="rating-asc">Sort: Rating (Low to High)</option>
              <option value="rating-desc">Sort: Rating (High to Low)</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="newest">Sort: Newest Added</option>
              <option value="oldest">Sort: Oldest Added</option>
              <option value="completed">Sort: Completed First</option>
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/6 animate-in slide-in-from-top-2 duration-300">
            {/* Completion Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block pl-1">Status</label>
              <select
                value={completedFilter}
                onChange={(e: any) => setCompletedFilter(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/8 bg-black/25 px-3 text-sm text-zinc-300 focus-visible:outline-none focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/15 transition-all duration-200 cursor-pointer"
              >
                <option value="all">All Problems</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>

            {/* Main Topic Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block pl-1">Main Topic</label>
              <select
                value={selectedMainTopic}
                onChange={(e) => setSelectedMainTopic(e.target.value)}
                className="w-full h-10 rounded-xl border border-white/8 bg-black/25 px-3 text-sm text-zinc-300 focus-visible:outline-none focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/15 transition-all duration-200 cursor-pointer"
              >
                <option value="all">All Topics</option>
                {uniqueMainTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating range */}
            <div className="space-y-1 col-span-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block pl-1">Rating Range</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min Rating"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="h-10"
                />
                <span className="text-zinc-500 text-xs">to</span>
                <Input
                  type="number"
                  placeholder="Max Rating"
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Topics Display */}
      {processedTopics.length > 0 ? (
        <Accordion type="multiple" defaultValue={processedTopics.map((t) => t.id)} className="space-y-4">
          {processedTopics.map((topic) => {
            const topicProblems = topic.subTopics.flatMap((st) => st.problems);
            const topicTotal = topicProblems.length;
            const topicCompleted = topicProblems.filter((p) => p.completed).length;
            const finalPercentage = topicTotal > 0 ? Math.round((topicCompleted / topicTotal) * 100) : 0;

            return (
              <AccordionItem
                key={topic.id}
                value={topic.id}
                className="border border-white/6 bg-white/1 rounded-2xl overflow-hidden px-4 md:px-6 shadow-md"
              >
                <AccordionTrigger className="hover:no-underline py-5 hover:bg-transparent">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/4 border border-white/8 shadow-sm">
                        <BookOpen className="h-4.5 w-4.5 text-[#9b6dff]" />
                      </div>
                      <span className="text-base font-bold text-white text-left">{topic.name}</span>
                    </div>
                    {topicTotal > 0 && (
                      <div className="flex items-center gap-4 min-w-[200px] sm:min-w-[250px] w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1">
                            <span>{topicCompleted} / {topicTotal} Solved</span>
                            <span className="text-[#ffbe3c]">{finalPercentage}%</span>
                          </div>
                          <Progress value={finalPercentage} className="h-1.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 border-t border-white/5 bg-transparent">
                  {topic.subTopics.length > 0 ? (
                    <Accordion type="multiple">
                       {topic.subTopics.map((sub) => {
                        const subTotal = sub.problems.length;
                        const subCompleted = sub.problems.filter((p) => p.completed).length;
                        const subPercentage = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

                        // Dynamic gradient based on percentage solved
                        let subGradientClass = "from-red-500 to-red-500";
                        if (subPercentage > 40 && subPercentage <= 80) {
                          subGradientClass = "from-red-500 via-red-400 to-yellow-400";
                        } else if (subPercentage > 80) {
                          subGradientClass = "from-red-500 via-yellow-400 to-emerald-500";
                        }

                        return (
                          <AccordionItem key={sub.id} value={sub.id} className="border border-white/5 bg-white/1 shadow-sm mt-3 first:mt-0">
                            <AccordionTrigger className="hover:bg-white/3 py-3.5 px-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 pr-4 gap-2">
                                <span className="text-sm font-bold text-zinc-200">{sub.name}</span>
                                {subTotal > 0 && (
                                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-semibold">
                                    <span>{subCompleted}/{subTotal} Solved</span>
                                    <div className="w-16 h-1 rounded-full bg-black/35 border border-white/5 overflow-hidden">
                                      <div className={cn("h-full bg-gradient-to-r", subGradientClass)} style={{ width: `${subPercentage}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 py-4 border-t border-white/5 bg-black/10">
                              {sub.problems.length > 0 ? (
                                viewMode === "grid" ? (
                                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {sub.problems.map((problem) => (
                                      <div
                                        key={problem.id}
                                        className={cn(
                                          "relative flex flex-col p-5 rounded-2xl border transition-all duration-300 float-card shadow-lg",
                                          problem.completed
                                            ? "bg-emerald-950/10 border-emerald-500/20 shadow-[0_4px_16px_rgba(16,185,129,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]"
                                            : "glass-2 border-white/8 hover:border-white/15"
                                        )}
                                      >
                                        {/* Completed Glow Effect */}
                                        {problem.completed && (
                                          <div className="absolute inset-0 bg-emerald-500/[0.01] rounded-2xl pointer-events-none" />
                                        )}

                                        {/* Top Row */}
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex items-start gap-3">
                                            {/* Completed Checkbox */}
                                            <button
                                              type="button"
                                              onClick={() => handleToggleCompletion(problem.id, problem.completed)}
                                              className="mt-1 flex-shrink-0 text-zinc-550 hover:text-white transition-colors focus:outline-none cursor-pointer"
                                            >
                                              {problem.completed ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" />
                                              ) : (
                                                <Circle className="h-5 w-5 text-zinc-600 hover:text-zinc-400" />
                                              )}
                                            </button>
                                            
                                            {/* Problem Info */}
                                            <div>
                                              <h4 className={cn("font-bold text-sm leading-snug tracking-tight text-zinc-150", problem.completed && "line-through text-zinc-500")}>
                                                {problem.problem}
                                              </h4>
                                              
                                              {/* Badges */}
                                              <div className="flex flex-wrap gap-2 mt-2">
                                                <Badge variant="rating">{problem.rating}</Badge>
                                                <Badge variant="topic">{problem.mainTopic}</Badge>
                                                {problem.hiddenPattern && (
                                                  <Badge variant="pattern">{problem.hiddenPattern}</Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Codeforces Link */}
                                          <a
                                            href={problem.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/6 bg-white/4 text-xs font-bold text-zinc-300 hover:bg-white/8 hover:text-white hover:border-white/10 transition-all duration-250 shrink-0 self-start mt-0.5 shadow-sm"
                                            title="Open on Codeforces"
                                          >
                                            <CodeforcesIcon />
                                            <span className="font-mono text-[10px] tracking-wider">{extractProblemId(problem.link)}</span>
                                          </a>
                                        </div>

                                        {/* Notes Section */}
                                        <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
                                          <label className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block mb-1">
                                            Notes
                                          </label>
                                          <textarea
                                            placeholder="Type notes here... autosaves instantly"
                                            value={notesState[problem.id] ?? ""}
                                            onChange={(e) => handleNoteChange(problem.id, e.target.value)}
                                            className="w-full bg-transparent border-0 hover:bg-white/3 focus:bg-white/5 p-2 min-h-[45px] text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none transition-all rounded-xl focus:ring-1 focus:ring-white/8"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-2xl border border-white/6 shadow-lg">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-12 text-center">Solved</TableHead>
                                          <TableHead>Problem</TableHead>
                                          <TableHead className="w-24">Rating</TableHead>
                                          <TableHead className="w-32">Main Topic</TableHead>
                                          <TableHead className="w-44">Hidden Pattern</TableHead>
                                          <TableHead className="w-32">Codeforces</TableHead>
                                          <TableHead className="max-w-sm">Notes</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {sub.problems.map((problem) => (
                                          <TableRow
                                            key={problem.id}
                                            className={cn(
                                              "transition-colors duration-250",
                                              problem.completed
                                                ? "bg-emerald-950/10 hover:bg-emerald-950/15 border-b border-emerald-500/10 text-emerald-300/90"
                                                : "bg-white/2 hover:bg-white/4 border-b border-white/5 text-zinc-350"
                                            )}
                                          >
                                            {/* Completed Checkbox */}
                                            <TableCell className="text-center align-middle">
                                              <button
                                                type="button"
                                                onClick={() => handleToggleCompletion(problem.id, problem.completed)}
                                                className="text-inherit hover:text-white transition-colors focus:outline-none cursor-pointer"
                                              >
                                                {problem.completed ? (
                                                  <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" />
                                                ) : (
                                                  <Circle className="h-5 w-5 text-zinc-600 hover:text-zinc-450" />
                                                )}
                                              </button>
                                            </TableCell>

                                            {/* Problem Name */}
                                            <TableCell className="font-bold text-inherit align-middle">
                                              <span className={cn(problem.completed && "line-through opacity-60 text-zinc-550")}>
                                                {problem.problem}
                                              </span>
                                            </TableCell>

                                            {/* Rating Badge */}
                                            <TableCell className="align-middle">
                                              <Badge variant="rating">{problem.rating}</Badge>
                                            </TableCell>

                                            {/* Main Topic Badge */}
                                            <TableCell className="align-middle">
                                              <Badge variant="topic">{problem.mainTopic}</Badge>
                                            </TableCell>

                                            {/* Hidden Pattern Badge */}
                                            <TableCell className="align-middle text-xs">
                                              {problem.hiddenPattern ? (
                                                <Badge variant="pattern">{problem.hiddenPattern}</Badge>
                                              ) : (
                                                <span className="text-zinc-600">-</span>
                                              )}
                                            </TableCell>

                                            {/* Codeforces Link */}
                                            <TableCell className="align-middle">
                                              <a
                                                href={problem.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/6 bg-white/4 text-xs font-bold text-zinc-350 hover:bg-white/8 hover:text-white transition-all duration-200"
                                                title="Open on Codeforces"
                                              >
                                                <CodeforcesIcon />
                                                <span className="font-mono text-[10px] tracking-wider">{extractProblemId(problem.link)}</span>
                                              </a>
                                            </TableCell>

                                            {/* Notes Inline Input Field */}
                                            <TableCell className="align-middle max-w-sm">
                                              <input
                                                type="text"
                                                placeholder="Type notes here... autosaves"
                                                value={notesState[problem.id] ?? ""}
                                                onChange={(e) => handleNoteChange(problem.id, e.target.value)}
                                                className="w-full bg-transparent border-0 hover:bg-white/4 focus:bg-white/8 px-2 py-1 text-xs text-inherit placeholder:text-zinc-600 focus:outline-none transition-all rounded-lg"
                                              />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )
                              ) : (
                                <div className="text-center py-6 text-zinc-500 text-xs font-medium">
                                  No problems in this subtopic.
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8 text-zinc-550 text-sm">
                      No subtopics created for this topic.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="glass-2 border-dashed border-white/8 py-16 px-4 text-center rounded-2xl relative overflow-hidden glass-reflect shadow-md">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full border border-white/8 flex items-center justify-center text-zinc-550 bg-white/3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">No Problems Found</h3>
              <p className="text-zinc-500 text-xs mt-1">
                We couldn&apos;t find any problems matching your filters. Try adjusting your query or upload problems in the admin panel.
              </p>
            </div>
            {(searchQuery || completedFilter !== "all" || minRating || maxRating || selectedMainTopic !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCompletedFilter("all");
                  setMinRating("");
                  setMaxRating("");
                  setSelectedMainTopic("all");
                }}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
