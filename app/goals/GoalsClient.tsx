"use client";

import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, Target, Trash, RefreshCw, BookOpen, AlertTriangle, ExternalLink, Calendar } from "lucide-react";
import { createGoal, deleteGoal, toggleRevision } from "@/actions/platform";
import { useRouter } from "next/navigation";

interface GoalsClientProps {
  goals: any[];
  revisions: any[];
}

export function GoalsClient({ goals, revisions }: GoalsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Create Goal form state
  const [newGoalTitle, setNewGoalTitle] = React.useState("");
  const [newGoalTarget, setNewGoalTarget] = React.useState(10);
  const [newGoalType, setNewGoalType] = React.useState("SOLVED_WEEKLY");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // Goal creation handler
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || newGoalTarget <= 0) return;
    setCreating(true);

    try {
      await createGoal(newGoalTitle, newGoalTarget, newGoalType);
      toast({ type: "success", description: "Practice goal created successfully." });
      setNewGoalTitle("");
      setNewGoalTarget(10);
      setDialogOpen(false);
      router.refresh();
    } catch (e: any) {
      toast({ type: "error", description: "Failed to create practice goal." });
    } finally {
      setCreating(false);
    }
  };

  // Goal deletion handler
  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      toast({ type: "success", description: "Goal deleted." });
      router.refresh();
    } catch (e: any) {
      toast({ type: "error", description: "Failed to delete goal." });
    }
  };

  // Revision completion handler
  const handleRemoveRevision = async (probId: string) => {
    try {
      await toggleRevision(probId, ""); // Clears revision status
      toast({ type: "success", description: "Problem removed from revision queue." });
      router.refresh();
    } catch (e: any) {
      toast({ type: "error", description: "Failed to remove problem from revision queue." });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Active Goals Column */}
      <div className="col-span-1 lg:col-span-1 space-y-6">
        <GlassCard glassClassName="glass-2 p-5 border-white/8 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Target className="h-4.5 w-4.5 text-[#ffbe3c]" />
              Active Goals
            </h3>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="glass-btn-primary h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" /> Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-4 border-white/10 text-zinc-100 max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold text-white uppercase tracking-wider">Create Practice Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                      Goal Title
                    </label>
                    <Input
                      placeholder="E.g. Solve 30 DP problems"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                        Target Count
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block pl-1">
                        Goal Type
                      </label>
                      <select
                        value={newGoalType}
                        onChange={(e) => setNewGoalType(e.target.value)}
                        className="bg-[#0f1220] border border-white/8 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-white/20 w-full h-10 appearance-none cursor-pointer"
                      >
                        <option value="SOLVED_WEEKLY">Weekly Solves</option>
                        <option value="SOLVED_MONTHLY">Monthly Solves</option>
                        <option value="RATING">Rating Milestones</option>
                        <option value="TOPIC">Topic Solves</option>
                      </select>
                    </div>
                  </div>

                  <Button type="submit" disabled={creating} className="w-full h-10 glass-btn-primary text-xs">
                    {creating ? "Creating..." : "Save Goal"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {goals.length > 0 ? (
              goals.map((g) => {
                const percentage = Math.min(100, Math.round((g.current / g.target) * 100));
                return (
                  <div key={g.id} className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">{g.type.replace("_", " ")}</span>
                        <h4 className="font-bold text-xs text-white mt-1 leading-snug">{g.title}</h4>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                        <span>{g.current} / {g.target} solves</span>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-1.5" indicatorClassName="bg-gradient-to-r from-[#ffbe3c] to-[#ff542f]" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-zinc-550 text-xs">
                No active targets set. Click Add Goal to create practice metrics.
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Revision Queue Column */}
      <div className="col-span-1 lg:col-span-2 space-y-6">
        <GlassCard glassClassName="glass-2 border-white/6 overflow-hidden shadow-md">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-[#9b6dff]" />
              Revision Queue
            </h3>
            <Badge variant="outline">{revisions.length} Problems</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/1 text-zinc-450 font-bold uppercase tracking-wider text-[9px]">
                  <th className="px-5 py-3">Problem</th>
                  <th className="px-5 py-3">Topic</th>
                  <th className="px-5 py-3 text-center">Difficulty</th>
                  <th className="px-5 py-3 text-center">Last Revision</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {revisions.length > 0 ? (
                  revisions.map((rev) => {
                    return (
                      <tr key={rev.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-zinc-200">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px]" title={rev.problem.problem}>{rev.problem.problem}</span>
                            <Badge variant="rating">{rev.problem.rating}</Badge>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-450">{rev.problem.mainTopic}</td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge
                            className={cn(
                              rev.difficulty === "HARD" && "bg-red-500/10 text-red-400 border-red-500/20",
                              rev.difficulty === "MEDIUM" && "bg-amber-500/10 text-amber-450 border-amber-500/20",
                              rev.difficulty === "EASY" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}
                          >
                            {rev.difficulty}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center text-zinc-400">
                          {formatDate(rev.lastRevisionDate) || "Never"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex gap-2 justify-end">
                            <a
                              href={rev.problem.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/3 border border-white/6 text-zinc-450 hover:text-white transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={() => handleRemoveRevision(rev.problemId)}
                              title="Clear from queue"
                              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-zinc-550">
                      Your revision queue is empty. Mark problems for revision in the catalog!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
export default GoalsClient;
