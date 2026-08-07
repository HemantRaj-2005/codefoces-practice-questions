"use client";

import * as React from "react";
import SidebarLayout from "@/components/Layout";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toggleProblemCompletion, updateProblemNotes } from "@/actions/problems";
import { ExternalLink, Search, SlidersHorizontal, BookOpen, CheckCircle2, Circle, AlertCircle, RefreshCw } from "lucide-react";

interface Problem {
  id: string;
  subTopicId: string;
  problem: string;
  rating: number;
  mainTopic: string;
  hiddenPattern: string | null;
  link: string;
  completed: boolean;
  completedAt: Date | null;
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
                  completedAt: newCompleted ? new Date() : null,
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
                    completedAt: currentCompleted ? new Date() : null,
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
        <Card className="col-span-1 border-zinc-800 bg-zinc-950/20">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Problems</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-white">{currentStats.total}</span>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-zinc-800 bg-zinc-950/20">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Completed</span>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{currentStats.completed}</span>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-zinc-800 bg-zinc-950/20">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Remaining</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-amber-500">{currentStats.remaining}</span>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-zinc-800 bg-zinc-950/20">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Topics</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-indigo-400">{currentStats.topicsCount}</span>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-zinc-800 bg-zinc-950/20">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subtopics</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-purple-400">{currentStats.subtopicsCount}</span>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-zinc-800 bg-zinc-950/20">
          <CardHeader className="p-4 pb-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Completion %</span>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-2xl font-bold text-blue-400">{currentStats.percentage}%</span>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="border-zinc-800 bg-zinc-950/30 p-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search problems, main topics, hidden patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
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
              className="h-9 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 text-xs text-zinc-300 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-900/60 animate-in slide-in-from-top-2 duration-200">
            {/* Completion Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Status</label>
              <select
                value={completedFilter}
                onChange={(e: any) => setCompletedFilter(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-300 focus-visible:outline-none"
              >
                <option value="all">All Problems</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>

            {/* Main Topic Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Main Topic</label>
              <select
                value={selectedMainTopic}
                onChange={(e) => setSelectedMainTopic(e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-300 focus-visible:outline-none"
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
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Rating Range</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min Rating"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="h-10"
                />
                <span className="text-zinc-600 text-xs">to</span>
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
      </Card>

      {/* Dynamic Topics Display */}
      {processedTopics.length > 0 ? (
        <div className="space-y-8">
          {processedTopics.map((topic) => {
            // Count total and completed in this topic
            const topicProblems = topic.subTopics.flatMap((st) => st.problems);
            const topicTotal = topicProblems.length;
            const topicCompleted = topicProblems.filter((p) => p.completed).length;
            const topicPercentage = topicTotal > 0 ? Math.round((topicCompleted / topicTotal) * 100) : 0;

            return (
              <Card key={topic.id} className="border-zinc-800 bg-zinc-950/15 overflow-hidden">
                <CardHeader className="border-b border-zinc-900 bg-zinc-950/20 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                        <BookOpen className="h-4 w-4 text-indigo-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">{topic.name}</CardTitle>
                    </div>
                    {topicTotal > 0 && (
                      <div className="flex items-center gap-4 min-w-[200px] sm:min-w-[250px]">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] font-semibold text-zinc-505 mb-1">
                            <span>{topicCompleted} / {topicTotal} Solved</span>
                            <span>{topicPercentage}%</span>
                          </div>
                          <Progress value={topicPercentage} className="h-1.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {topic.subTopics.length > 0 ? (
                    <Accordion type="multiple">
                      {topic.subTopics.map((sub) => {
                        const subTotal = sub.problems.length;
                        const subCompleted = sub.problems.filter((p) => p.completed).length;
                        const subPercentage = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

                        return (
                          <AccordionItem key={sub.id} value={sub.id}>
                            <AccordionTrigger className="hover:bg-zinc-900/10">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 pr-4 gap-2">
                                <span className="text-sm font-semibold text-zinc-200">{sub.name}</span>
                                {subTotal > 0 && (
                                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                                    <span>{subCompleted}/{subTotal} Solved</span>
                                    <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
                                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${subPercentage}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {sub.problems.length > 0 ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                  {sub.problems.map((problem) => (
                                    <div
                                      key={problem.id}
                                      className={cn(
                                        "relative flex flex-col p-5 rounded-xl border transition-all duration-300",
                                        problem.completed
                                          ? "bg-emerald-950/5 border-emerald-900/30 shadow-sm"
                                          : "bg-zinc-900/20 border-zinc-800/80 hover:border-zinc-700/60"
                                      )}
                                    >
                                      {/* Top Row: Completed & Title & Badges */}
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                          {/* Completed Checkbox */}
                                          <button
                                            type="button"
                                            onClick={() => handleToggleCompletion(problem.id, problem.completed)}
                                            className="mt-1 flex-shrink-0 text-zinc-500 hover:text-white transition-colors focus:outline-none"
                                          >
                                            {problem.completed ? (
                                              <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-950/20" />
                                            ) : (
                                              <Circle className="h-5 w-5 text-zinc-600" />
                                            )}
                                          </button>
                                          
                                          {/* Problem info */}
                                          <div>
                                            <h4 className={cn("font-bold text-sm leading-snug tracking-tight text-zinc-100", problem.completed && "line-through text-zinc-500")}>
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

                                        {/* External link button */}
                                        <a
                                          href={problem.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title="Open Problem"
                                          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 border border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:bg-zinc-900 hover:text-white h-8 w-8 rounded-lg shrink-0"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                      </div>

                                      {/* Bottom Row: Optional notes */}
                                      <div className="mt-4 pt-3 border-t border-zinc-850">
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                                          Notes
                                        </label>
                                        <Textarea
                                          placeholder="Type notes here... autosaves instantly"
                                          value={notesState[problem.id] ?? ""}
                                          onChange={(e) => handleNoteChange(problem.id, e.target.value)}
                                          className="bg-transparent border-0 hover:bg-zinc-950/20 focus:bg-zinc-950/30 p-2 min-h-[45px] text-xs text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-800 focus-visible:border-zinc-800 focus:outline-none transition-all rounded-md"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
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
                    <div className="text-center py-8 text-zinc-500 text-sm">
                      No subtopics created for this topic.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-zinc-800 bg-zinc-950/20 border-dashed py-16 px-4 text-center">
          <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 bg-zinc-950/40">
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
                className="mt-2 text-zinc-300 border-zinc-850 hover:bg-zinc-900"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      )}
    </SidebarLayout>
  );
}
