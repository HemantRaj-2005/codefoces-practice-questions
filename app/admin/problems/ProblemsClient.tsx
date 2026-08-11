"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  createProblem,
  updateProblem,
  deleteProblem,
  bulkDeleteProblems,
  uploadCSV,
} from "@/actions/problems";
import { Edit2, Trash2, Plus, Upload, ChevronLeft, ChevronRight, Search, Check, AlertTriangle, Info } from "lucide-react";

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
  subTopic: {
    name: string;
    topic: {
      name: string;
    };
  };
}

interface SubTopic {
  id: string;
  topicId: string;
  name: string;
  order: number;
}

interface Topic {
  id: string;
  name: string;
  order: number;
  subTopics: SubTopic[];
}

interface ProblemsClientProps {
  problems: Problem[];
  topics: Topic[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  filters: {
    search: string;
    subtopicId: string;
    topicId: string;
  };
}

export default function ProblemsClient({
  problems,
  topics,
  pagination,
  filters,
}: ProblemsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Selected problems for bulk actions
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Modal open states
  const [formOpen, setFormOpen] = React.useState(false);
  const [csvOpen, setCsvOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);

  // Form mode & Active items
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [activeProblem, setActiveProblem] = React.useState<Problem | null>(null);
  const [deleteProblemId, setDeleteProblemId] = React.useState<string | null>(null);

  // Problem Form Fields
  const [subTopicId, setSubTopicId] = React.useState("");
  const [problemName, setProblemName] = React.useState("");
  const [rating, setRating] = React.useState("800");
  const [mainTopic, setMainTopic] = React.useState("");
  const [hiddenPattern, setHiddenPattern] = React.useState("");
  const [link, setLink] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // CSV Import State
  const [csvSubTopicId, setCsvSubTopicId] = React.useState("");
  const [csvFileString, setCsvFileString] = React.useState("");
  const [uploadResults, setUploadResults] = React.useState<any | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // Local Search Input (debounced / on-demand)
  const [searchInput, setSearchInput] = React.useState(filters.search);

  // Update query parameters in URL
  const updateQuery = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset page on filter changes unless specifying page directly
    if (!newParams.page) {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchInput });
  };

  // Bulk actions toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === problems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(problems.map((p) => p.id));
    }
  };

  const toggleSelectProblem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  // CREATE / EDIT FORM HANDLERS

  const openCreateProblem = () => {
    setFormMode("create");
    setActiveProblem(null);
    setProblemName("");
    setRating("800");
    setMainTopic("");
    setHiddenPattern("");
    setLink("");
    setNotes("");
    
    // Auto-select first subtopic if available
    const firstTopic = topics[0];
    const firstSub = firstTopic?.subTopics[0];
    setSubTopicId(firstSub?.id || "");
    
    setFormOpen(true);
  };

  const openEditProblem = (prob: Problem) => {
    setFormMode("edit");
    setActiveProblem(prob);
    setSubTopicId(prob.subTopicId);
    setProblemName(prob.problem);
    setRating(String(prob.rating));
    setMainTopic(prob.mainTopic);
    setHiddenPattern(prob.hiddenPattern || "");
    setLink(prob.link);
    setNotes(prob.notes || "");
    setFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subTopicId) {
      toast({ type: "error", description: "Subtopic assignment is required." });
      return;
    }
    if (!problemName.trim()) {
      toast({ type: "error", description: "Problem name is required." });
      return;
    }
    if (!link.trim().startsWith("http")) {
      toast({ type: "error", description: "Valid URL is required." });
      return;
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum)) {
      toast({ type: "error", description: "Rating must be a valid integer." });
      return;
    }

    const problemData = {
      subTopicId,
      problem: problemName.trim(),
      rating: ratingNum,
      mainTopic: mainTopic.trim(),
      hiddenPattern: hiddenPattern.trim() || null,
      link: link.trim(),
      notes: notes.trim() || null,
    };

    try {
      if (formMode === "create") {
        await createProblem(problemData);
        toast({ type: "success", description: "Problem created successfully." });
      } else if (formMode === "edit" && activeProblem) {
        await updateProblem(activeProblem.id, problemData);
        toast({ type: "success", description: "Problem updated successfully." });
      }
      setFormOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({ type: "error", description: err.message || "Failed to save problem." });
    }
  };

  // DELETE SINGLE RECORD

  const confirmDeleteProblem = (id: string) => {
    setDeleteProblemId(id);
    setDeleteOpen(true);
  };

  const handleDeleteExecute = async () => {
    if (!deleteProblemId) return;

    try {
      await deleteProblem(deleteProblemId);
      toast({ type: "success", description: "Problem deleted successfully." });
      setSelectedIds((prev) => prev.filter((id) => id !== deleteProblemId));
      setDeleteOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({ type: "error", description: err.message || "Failed to delete problem." });
    }
  };

  // BULK DELETE RECORDS

  const handleBulkDeleteExecute = async () => {
    if (selectedIds.length === 0) return;

    try {
      const result = await bulkDeleteProblems(selectedIds);
      toast({
        type: "success",
        description: `Successfully deleted ${result.count} problem(s).`,
      });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({ type: "error", description: err.message || "Failed to execute bulk deletion." });
    }
  };

  // CSV UPLOAD & PARSE HANDLERS

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvFileString(text);
    };
    reader.readAsText(file);
  };

  const handleCSVUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvSubTopicId) {
      toast({ type: "error", description: "Target subtopic is required." });
      return;
    }
    if (!csvFileString) {
      toast({ type: "error", description: "Please upload or select a CSV file." });
      return;
    }

    setUploading(true);
    setUploadResults(null);

    try {
      const result = await uploadCSV(csvSubTopicId, csvFileString);
      if (result.error) {
        toast({ type: "error", description: result.error });
      } else {
        setUploadResults(result);
        toast({ type: "success", description: "CSV upload completed." });
        router.refresh();
      }
    } catch (err: any) {
      toast({ type: "error", description: err.message || "CSV processing failed." });
    } finally {
      setUploading(false);
    }
  };

return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Manage Problems</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manual problem cataloging, metadata editing, and CSV ingestion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setCsvOpen(true);
              setUploadResults(null);
              setCsvFileString("");
              const firstSub = topics[0]?.subTopics[0];
              setCsvSubTopicId(firstSub?.id || "");
            }}
            className="flex items-center gap-2 text-zinc-300"
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </Button>
          <Button
            onClick={openCreateProblem}
            className="glass-btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Problem
          </Button>
        </div>
      </div>

      {/* Toolbar Search / Topic Filters */}
      <div className="glass-2 p-4 rounded-2xl border border-white/8 shadow-lg relative overflow-hidden glass-reflect">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full lg:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-555" />
              <Input
                type="text"
                placeholder="Search name, topic, patterns..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary" className="px-4">
              Search
            </Button>
          </form>

          {/* Filters & Bulk Delete buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Topic Filter */}
            <select
              value={filters.topicId}
              onChange={(e) => updateQuery({ topic: e.target.value, subtopic: "" })}
              className="h-10 rounded-xl border border-white/8 bg-black/25 px-3 text-xs text-zinc-300 focus-visible:outline-none focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/15 shadow-inner transition-all duration-200 cursor-pointer"
            >
              <option value="">Filter by Topic (All)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Subtopic Filter */}
            <select
              value={filters.subtopicId}
              onChange={(e) => updateQuery({ subtopic: e.target.value })}
              className="h-10 rounded-xl border border-white/8 bg-black/25 px-3 text-xs text-zinc-300 focus-visible:outline-none focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/15 shadow-inner transition-all duration-200 cursor-pointer"
              disabled={!filters.topicId}
            >
              <option value="">Filter by Subtopic (All)</option>
              {topics
                .find((t) => t.id === filters.topicId)
                ?.subTopics.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>

            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteOpen(true)}
                className="flex items-center gap-2 h-10 hover:-translate-y-0.5 transition-transform"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Problems Table */}
      <div className="rounded-2xl border border-white/6 overflow-hidden shadow-lg">
        {problems.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <input
                      type="checkbox"
                      checked={problems.length > 0 && selectedIds.length === problems.length}
                      onChange={toggleSelectAll}
                      className="rounded border-white/10 bg-black/40 text-[#ff6a3d] focus:ring-[#ff6a3d]/30 h-4 w-4 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead className="w-24">Rating</TableHead>
                  <TableHead>Main Topic</TableHead>
                  <TableHead>Hidden Pattern</TableHead>
                  <TableHead>Syllabus Path</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((p) => (
                  <TableRow
                    key={p.id}
                    className={cn(
                      "transition-colors duration-250",
                      p.completed
                        ? "bg-emerald-950/10 hover:bg-emerald-950/15 border-b border-emerald-500/10 text-emerald-300/90"
                        : "bg-white/2 hover:bg-white/4 border-b border-white/5 text-zinc-350"
                    )}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectProblem(p.id)}
                        className="rounded border-white/10 bg-black/40 text-[#ff6a3d] focus:ring-[#ff6a3d]/30 h-4 w-4 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-bold text-inherit max-w-xs truncate">
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1.5 text-inherit hover:text-white"
                      >
                        {p.problem}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="rating">{p.rating}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="topic">{p.mainTopic}</Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {p.hiddenPattern ? <Badge variant="pattern">{p.hiddenPattern}</Badge> : <span className="text-zinc-600">-</span>}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider">{p.subTopic?.topic?.name}</span>
                      {" → "}
                      <span className="text-zinc-300 font-medium">{p.subTopic?.name}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditProblem(p)}
                          className="h-8 w-8 text-zinc-450 hover:text-white hover:bg-white/5"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteProblem(p.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-350 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-500 text-sm font-semibold bg-white/1">
            No problems match your current criteria. Create or upload some problems.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-zinc-400 font-medium">
            Showing <strong className="text-zinc-200">{problems.length}</strong> of{" "}
            <strong className="text-zinc-200">{pagination.totalItems}</strong> problems
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuery({ page: String(pagination.page - 1) })}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center justify-center px-4 rounded-xl border border-white/6 text-xs font-bold bg-black/25 text-zinc-300 shadow-inner">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuery({ page: String(pagination.page + 1) })}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM DIALOG */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "Add Problem Record" : "Edit Problem Record"}
            </DialogTitle>
            <DialogDescription>
              Provide catalog details. Duplicates by Codeforces link are ignored in validation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1" htmlFor="pname">
                  Problem Name
                </label>
                <Input
                  id="pname"
                  type="text"
                  placeholder="E.g. Fedor and New Game"
                  value={problemName}
                  onChange={(e) => setProblemName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                  Syllabus Parent Topic
                </label>
                <select
                  value={filters.topicId}
                  onChange={(e) => { /* Helper logic for parent topic selection */ }}
                  className="w-full h-10 rounded-xl border border-white/8 bg-black/25 px-3 text-sm text-zinc-300 focus-visible:outline-none focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/15 transition-all duration-200 cursor-pointer"
                  required
                >
                  <option value="">Select Parent Topic...</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                  Syllabus Subtopic
                </label>
                <select
                  value={subTopicId}
                  onChange={(e) => setSubTopicId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/8 bg-black/25 px-3 text-sm text-zinc-300 focus-visible:outline-none focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/15 transition-all duration-200 cursor-pointer"
                  required
                >
                  <option value="">Select Subtopic...</option>
                  {topics.map((t) => (
                    <optgroup key={t.id} label={t.name}>
                      {t.subTopics.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1" htmlFor="prating">
                  Codeforces Rating
                </label>
                <Input
                  id="prating"
                  type="number"
                  placeholder="1200"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1" htmlFor="ptopic">
                  Main Topic
                </label>
                <Input
                  id="ptopic"
                  type="text"
                  placeholder="E.g. Bitmask DP"
                  value={mainTopic}
                  onChange={(e) => setMainTopic(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1" htmlFor="ppattern">
                  Hidden Pattern (Optional)
                </label>
                <Input
                  id="ppattern"
                  type="text"
                  placeholder="E.g. Bitwise XOR submask propagation state"
                  value={hiddenPattern}
                  onChange={(e) => setHiddenPattern(e.target.value)}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1" htmlFor="plink">
                  Codeforces Problem Link
                </label>
                <Input
                  id="plink"
                  type="url"
                  placeholder="https://codeforces.com/problemset/problem/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1" htmlFor="pnotes">
                  Problem Notes (Optional)
                </label>
                <Textarea
                  id="pnotes"
                  placeholder="Key concepts, tricks, complexity analysis..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="glass-btn-primary">
                {formMode === "create" ? "Add Problem" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV UPLOAD MODAL */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#5b8cff]" />
              Upload Problems CSV
            </DialogTitle>
            <DialogDescription>
              Select syllabus node destination and parse columns from Codeforces template.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCSVUploadSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                  Destination Subtopic
                </label>
                <select
                  value={csvSubTopicId}
                  onChange={(e) => setCsvSubTopicId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-white/8 bg-black/25 px-3 text-sm text-zinc-300 focus-visible:outline-none focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/15 transition-all duration-200 cursor-pointer"
                  required
                >
                  <option value="">Select Subtopic...</option>
                  {topics.map((t) => (
                    <optgroup key={t.id} label={t.name}>
                      {t.subTopics.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-white/8 rounded-2xl p-6 bg-black/25 hover:bg-black/35 hover:border-[#ff6a3d]/30 transition-all duration-200 text-center relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="space-y-1.5 pointer-events-none">
                    <Upload className="h-8 w-8 text-zinc-555 mx-auto" />
                    <div className="text-xs font-bold text-zinc-200">
                      Click to browse or drop CSV here
                    </div>
                  </div>
                </div>
              </div>

              {uploadResults && (
                <div className="rounded-2xl border border-white/6 bg-black/35 p-4 space-y-3 animate-in fade-in-50">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Upload Results Summary</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white/3 p-2.5 rounded-xl border border-white/5">
                      <div className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Added</div>
                      <div className="text-base font-extrabold text-emerald-400 mt-0.5">{uploadResults.added}</div>
                    </div>
                    <div className="bg-white/3 p-2.5 rounded-xl border border-white/5">
                      <div className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Skipped</div>
                      <div className="text-base font-extrabold text-amber-450 mt-0.5">{uploadResults.skipped}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCsvOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="glass-btn-primary">
                {uploading ? "Parsing & Importing..." : "Start Import"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE SINGLE CONFIRM */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Problem</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteExecute}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE BULK CONFIRM */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400">Bulk Delete</DialogTitle>
            <DialogDescription>
              Delete <strong>{selectedIds.length}</strong> items?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDeleteExecute}>Delete All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
