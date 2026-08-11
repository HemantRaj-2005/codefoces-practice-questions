"use client";

import * as React from "react";
import { cn, formatDate, extractProblemId } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Circle,
  Bookmark,
  BookOpen,
  Calendar,
  ExternalLink,
  ChevronDown,
  Trash,
  Sparkles,
  Clipboard,
  FileText
} from "lucide-react";
import { toggleBookmark, toggleRevision, updateProblemNote } from "@/actions/platform";
import { motion, AnimatePresence } from "motion/react";

const CodeforcesIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-3.5 w-3.5 inline-block shrink-0"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red/brown bar */}
    <rect x="2" y="10" width="4" height="12" rx="1" fill="#b13333" />
    {/* Blue bar */}
    <rect x="8" y="2" width="4" height="20" rx="1" fill="#3b5998" />
    {/* Yellow/gold bar */}
    <rect x="14" y="6" width="4" height="16" rx="1" fill="#f4a261" />
  </svg>
);

interface ProblemsClientProps {
  topics: any[];
  userProgress: any[];
  userBookmarks: any[];
  userRevisions: any[];
  userNotes: any[];
}

export function ProblemsClient({
  topics,
  userProgress,
  userBookmarks,
  userRevisions,
  userNotes,
}: ProblemsClientProps) {
  const { toast } = useToast();
  
  // State for filtering
  const [search, setSearch] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState("all");
  const [selectedRating, setSelectedRating] = React.useState("all");
  const [selectedStatus, setSelectedStatus] = React.useState("all");

  // Selected Problem details modal state
  const [selectedProblem, setSelectedProblem] = React.useState<any | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Notes editor local state (bound to selectedProblem details)
  const [noteContent, setNoteContent] = React.useState("");
  const [noteObservations, setNoteObservations] = React.useState("");
  const [noteMistakes, setNoteMistakes] = React.useState("");
  const [noteApproach, setNoteApproach] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);

  // Revision state
  const [revisionDifficulty, setRevisionDifficulty] = React.useState("");
  
  // Connect Bookmarks / Revisions local state cache
  const [bookmarksCache, setBookmarksCache] = React.useState<Record<string, boolean>>(() => {
    const cache: Record<string, boolean> = {};
    userBookmarks.forEach(b => { cache[b.problemId] = true; });
    return cache;
  });

  const [revisionsCache, setRevisionsCache] = React.useState<Record<string, string>>(() => {
    const cache: Record<string, string> = {};
    userRevisions.forEach(r => { cache[r.problemId] = r.difficulty; });
    return cache;
  });

  const [notesCache, setNotesCache] = React.useState<Record<string, any>>(() => {
    const cache: Record<string, any> = {};
    userNotes.forEach(n => { cache[n.problemId] = n; });
    return cache;
  });

  // Maps problem id to progress object
  const progressMap = React.useMemo(() => {
    const map = new Map<string, any>();
    userProgress.forEach((p) => map.set(p.problemId, p));
    return map;
  }, [userProgress]);

  // Open problem details modal
  const openProblemDetails = (prob: any) => {
    setSelectedProblem(prob);
    
    // Load notes from cache or defaults
    const savedNote = notesCache[prob.id] || { content: "", keyObservations: "", mistakes: "", approach: "" };
    setNoteContent(savedNote.content || "");
    setNoteObservations(savedNote.keyObservations || "");
    setNoteMistakes(savedNote.mistakes || "");
    setNoteApproach(savedNote.approach || "");

    // Load revision level from cache
    setRevisionDifficulty(revisionsCache[prob.id] || "");

    setModalOpen(true);
  };

  const handleBookmarkToggle = async (probId: string) => {
    try {
      const res = await toggleBookmark(probId);
      setBookmarksCache(prev => ({ ...prev, [probId]: res.bookmarked }));
      toast({ 
        type: "success", 
        description: res.bookmarked ? "Problem bookmarked successfully." : "Bookmark removed." 
      });
    } catch (e: any) {
      toast({ type: "error", description: "Failed to toggle bookmark." });
    }
  };

  const handleRevisionToggle = async (level: string) => {
    if (!selectedProblem) return;
    try {
      const res = await toggleRevision(selectedProblem.id, level);
      setRevisionsCache(prev => ({ ...prev, [selectedProblem.id]: level }));
      setRevisionDifficulty(level);
      toast({ 
        type: "success", 
        description: level ? `Marked for revision: ${level}` : "Removed from revision queue." 
      });
    } catch (e: any) {
      toast({ type: "error", description: "Failed to update revision status." });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedProblem) return;
    setSavingNotes(true);
    try {
      const res = await updateProblemNote(
        selectedProblem.id,
        noteContent,
        noteObservations,
        noteMistakes,
        noteApproach
      );
      setNotesCache(prev => ({ ...prev, [selectedProblem.id]: res }));
      toast({ type: "success", description: "Personal notes saved successfully." });
    } catch (e: any) {
      toast({ type: "error", description: "Failed to save notes." });
    } finally {
      setSavingNotes(false);
    }
  };

  // Filter nested topics/subtopics hierarchy
  const processedTopics = React.useMemo(() => {
    return topics
      .map((topic) => {
        const subTopics = topic.subTopics
          .map((sub: any) => {
            let filteredProblems = [...sub.problems];

            // 1. Search Query
            if (search.trim()) {
              const query = search.toLowerCase().trim();
              filteredProblems = filteredProblems.filter(
                (p) =>
                  p.problem.toLowerCase().includes(query) ||
                  p.mainTopic.toLowerCase().includes(query)
              );
            }

            // 2. Rating Range Filter
            if (selectedRating !== "all") {
              filteredProblems = filteredProblems.filter((p) => {
                const ratingNum = p.rating;
                if (selectedRating === "easy") return ratingNum <= 1100;
                if (selectedRating === "medium") return ratingNum > 1100 && ratingNum <= 1500;
                if (selectedRating === "hard") return ratingNum > 1500;
                return true;
              });
            }

            // 3. Status Filter
            if (selectedStatus !== "all") {
              filteredProblems = filteredProblems.filter((p) => {
                const prog = progressMap.get(p.id);
                const isBookmarked = bookmarksCache[p.id];
                const isRevision = revisionsCache[p.id];

                if (selectedStatus === "solved") return prog?.status === "SOLVED";
                if (selectedStatus === "attempted") return prog?.status === "ATTEMPTED";
                if (selectedStatus === "unsolved") return !prog || prog.status !== "SOLVED";
                if (selectedStatus === "bookmarked") return !!isBookmarked;
                if (selectedStatus === "revisit") return !!isRevision;
                return true;
              });
            }

            return { ...sub, problems: filteredProblems };
          })
          .filter((sub: any) => {
            const hasFilterActive = search || selectedTopic !== "all" || selectedRating !== "all" || selectedStatus !== "all";
            return !hasFilterActive || sub.problems.length > 0;
          });

        return { ...topic, subTopics };
      })
      .filter((topic: any) => {
        if (selectedTopic !== "all" && topic.id !== selectedTopic) {
          return false;
        }
        const hasFilterActive = search || selectedTopic !== "all" || selectedRating !== "all" || selectedStatus !== "all";
        return !hasFilterActive || topic.subTopics.length > 0;
      });
  }, [topics, search, selectedTopic, selectedRating, selectedStatus, progressMap, bookmarksCache, revisionsCache]);

  return (
    <div className="space-y-6">
      {/* Filtering Toolbar */}
      <GlassCard glassClassName="glass-2 p-4 border-white/6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-md">
        <div className="relative w-full md:max-w-xs">
          <span className="absolute left-3 top-3 text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <Input
            placeholder="Search syllabus catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Topic filter */}
          <div className="relative">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-[#0f1220]/60 border border-white/8 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-white/20 appearance-none pr-8 cursor-pointer h-10"
            >
              <option value="all">All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 absolute right-3 top-3.5 text-zinc-500 pointer-events-none" />
          </div>

          {/* Rating filter */}
          <div className="relative">
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="bg-[#0f1220]/60 border border-white/8 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-white/20 appearance-none pr-8 cursor-pointer h-10"
            >
              <option value="all">All Ratings</option>
              <option value="easy">Easy (≤ 1100)</option>
              <option value="medium">Medium (1200 - 1500)</option>
              <option value="hard">Hard (≥ 1600)</option>
            </select>
            <ChevronDown className="h-3 w-3 absolute right-3 top-3.5 text-zinc-500 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0f1220]/60 border border-white/8 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-white/20 appearance-none pr-8 cursor-pointer h-10"
            >
              <option value="all">All Statuses</option>
              <option value="solved">Solved</option>
              <option value="attempted">Attempted</option>
              <option value="unsolved">Unsolved</option>
              <option value="bookmarked">Bookmarked</option>
              <option value="revisit">Revisit Queue</option>
            </select>
            <ChevronDown className="h-3 w-3 absolute right-3 top-3.5 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </GlassCard>

      {/* Collapsible Nested Topics Display */}
      {processedTopics.length > 0 ? (
        <Accordion type="multiple" defaultValue={processedTopics.map((t) => t.id)} className="space-y-4">
          {processedTopics.map((topic) => {
            const topicProblems = topic.subTopics.flatMap((st: any) => st.problems);
            const topicTotal = topicProblems.length;
            const topicCompleted = topicProblems.filter((p: any) => progressMap.get(p.id)?.status === "SOLVED").length;
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
                          <div className="flex justify-between text-[10px] font-bold text-zinc-450 mb-1">
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
                       {topic.subTopics.map((sub: any) => {
                        const subTotal = sub.problems.length;
                        const subCompleted = sub.problems.filter((p: any) => progressMap.get(p.id)?.status === "SOLVED").length;
                        const subPercentage = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

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
                                <Table wrapperClassName="bg-[#070913] border border-white/5 shadow-2xl">
                                  <TableHeader className="bg-[#05060b] border-b border-white/5">
                                    <TableRow>
                                      <TableHead className="w-16 text-center">Status</TableHead>
                                      <TableHead>Problem</TableHead>
                                      <TableHead className="w-24">Rating</TableHead>
                                      <TableHead className="w-32">Main Topic</TableHead>
                                      <TableHead className="w-44">Hidden Pattern</TableHead>
                                      <TableHead className="w-32">Codeforces</TableHead>
                                      <TableHead className="w-20 text-center">Bookmarked</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sub.problems.map((prob: any) => {
                                      const prog = progressMap.get(prob.id);
                                      const isSolved = prog?.status === "SOLVED";
                                      const isAttempted = prog?.status === "ATTEMPTED";
                                      const isBookmarked = bookmarksCache[prob.id];

                                      return (
                                        <TableRow
                                          key={prob.id}
                                          onClick={() => openProblemDetails(prob)}
                                          className={cn(
                                            "transition-colors duration-250 cursor-pointer",
                                            isSolved
                                              ? "bg-[#081e14] hover:bg-[#0c2a1c] border-b border-emerald-500/10 text-emerald-300/90"
                                              : isAttempted
                                              ? "bg-[#201407] hover:bg-[#2e1d0a] border-b border-amber-500/10 text-amber-300/90"
                                              : "bg-[#0c0e18] hover:bg-[#111422] border-b border-white/5 text-zinc-350"
                                          )}
                                        >
                                            <TableCell className="text-center align-middle">
                                              {isSolved ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)] m-auto" />
                                              ) : isAttempted ? (
                                                <AlertCircle className="h-5 w-5 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.3)] m-auto" />
                                              ) : (
                                                <Circle className="h-5 w-5 text-zinc-650 m-auto" />
                                              )}
                                            </TableCell>
                                            <TableCell className="font-bold text-inherit align-middle">
                                              <span className={cn(isSolved && "line-through opacity-60 text-zinc-550")}>
                                                {prob.problem}
                                              </span>
                                            </TableCell>
                                            <TableCell className="align-middle">
                                              <Badge variant="rating">{prob.rating}</Badge>
                                            </TableCell>
                                            <TableCell className="align-middle">
                                              <Badge variant="topic">{prob.mainTopic}</Badge>
                                            </TableCell>
                                            <TableCell className="align-middle text-xs">
                                              {prob.hiddenPattern ? (
                                                <Badge variant="pattern">{prob.hiddenPattern}</Badge>
                                              ) : (
                                                <span className="text-zinc-650">-</span>
                                              )}
                                            </TableCell>
                                            <TableCell className="align-middle" onClick={(e) => e.stopPropagation()}>
                                              <a
                                                href={prob.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/6 bg-white/4 text-xs font-bold text-zinc-350 hover:bg-white/8 hover:text-white transition-all duration-200"
                                                title="Open on Codeforces"
                                              >
                                                <CodeforcesIcon />
                                                <span className="font-mono text-[10px] tracking-wider">{extractProblemId(prob.link)}</span>
                                              </a>
                                            </TableCell>
                                            <TableCell className="text-center align-middle" onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(prob.id); }}>
                                              <button className="text-zinc-555 hover:text-[#ff542f] transition-colors focus:outline-none cursor-pointer m-auto">
                                                {isBookmarked ? (
                                                  <Bookmark className="h-4 w-4 fill-[#ff542f] text-[#ff542f]" />
                                                ) : (
                                                  <Bookmark className="h-4 w-4 text-zinc-600 hover:text-zinc-450" />
                                                )}
                                              </button>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                              ) : (
                                <div className="text-center py-6 text-zinc-500 text-xs font-medium">
                                  No problems in this subtopic matching current filters.
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 text-xs font-medium">
                      No subtopics in this topic.
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="text-center py-12 text-zinc-550 text-xs">
          No topics or problems matching current filters found.
        </div>
      )}

      {/* Selected Problem detail dialog modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-4 max-w-2xl border-white/10 text-zinc-100 max-h-[90vh] overflow-y-auto">
          {selectedProblem && (
            <>
              <DialogHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-base font-extrabold text-white">{selectedProblem.problem}</DialogTitle>
                    <Badge variant="rating">{selectedProblem.rating}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleBookmarkToggle(selectedProblem.id)}
                      className={cn(
                        "h-8 px-2.5 rounded-lg border",
                        bookmarksCache[selectedProblem.id] 
                          ? "bg-[#ff542f]/10 border-[#ff542f]/30 text-[#ff542f]"
                          : "bg-white/4 border-white/8 text-zinc-400 hover:text-white"
                      )}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <a
                      href={selectedProblem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-2.5 rounded-lg border border-white/8 bg-white/4 hover:bg-white/6 hover:text-white flex items-center justify-center gap-1 text-xs font-semibold text-zinc-400 transition-colors"
                    >
                      Codeforces <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <DialogDescription className="text-zinc-400 text-xs mt-1.5 flex gap-4">
                  <span>Topic: {selectedProblem.mainTopic}</span>
                  {selectedProblem.hiddenPattern && <span>Pattern: {selectedProblem.hiddenPattern}</span>}
                </DialogDescription>
              </DialogHeader>

              {/* Progress & Revision actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#ffbe3c]" /> Progress Metrics
                  </h4>
                  
                  <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-2.5 text-xs text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Status</span>
                      <span className="font-bold text-[#ffbe3c]">
                        {progressMap.get(selectedProblem.id)?.status || "NOT STARTED"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Attempts</span>
                      <span className="font-bold">{progressMap.get(selectedProblem.id)?.attempts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">First Solved</span>
                      <span className="font-bold">
                        {formatDate(progressMap.get(selectedProblem.id)?.firstSolvedAt) || "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-550">Last Attempted</span>
                      <span className="font-bold">
                        {formatDate(progressMap.get(selectedProblem.id)?.lastAttemptedAt) || "Never"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-[#9b6dff]" /> Revision Queue
                  </h4>
                  
                  <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-3">
                    <p className="text-[11px] text-zinc-400">
                      Mark this problem for your revision queue to keep practice routines refreshed.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["EASY", "MEDIUM", "HARD"].map((level) => {
                        const active = revisionDifficulty === level;
                        return (
                          <Button
                            key={level}
                            size="sm"
                            onClick={() => handleRevisionToggle(active ? "" : level)}
                            className={cn(
                              "h-8 text-xs font-bold rounded-lg border",
                              active
                                ? "bg-[#9b6dff]/10 border-[#9b6dff]/30 text-[#9b6dff]"
                                : "bg-white/3 border-white/6 text-zinc-400 hover:text-white"
                            )}
                          >
                            {level}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Glass Personal Notes Editor */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#5b8cff]" /> Personal Practice Notes
                </h4>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
                      Observation Summary
                    </label>
                    <Textarea
                      placeholder="E.g. Important DFS + DP on tree..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
                        Key Observations
                      </label>
                      <Textarea
                        placeholder="Double-pass tree diameters..."
                        value={noteObservations}
                        onChange={(e) => setNoteObservations(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#ff542f] uppercase tracking-widest block pl-1">
                        Common Mistakes
                      </label>
                      <Textarea
                        placeholder="Forgetting off-by-one bounds..."
                        value={noteMistakes}
                        onChange={(e) => setNoteMistakes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-widest block pl-1">
                      Algorithmic Approach
                    </label>
                    <Textarea
                      placeholder="Use dynamic programming to cache depth values..."
                      value={noteApproach}
                      onChange={(e) => setNoteApproach(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1.5">
                    <Button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="glass-btn-primary h-9 px-4 rounded-xl text-xs"
                    >
                      {savingNotes ? "Saving Notes..." : "Save Notes"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ProblemsClient;
