"use client";

import * as React from "react";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  createTopic,
  updateTopic,
  deleteTopic,
  createSubTopic,
  updateSubTopic,
  deleteSubTopic,
} from "@/actions/topics";
import { Edit2, Trash2, Plus, ArrowUpDown, BookOpen, Layers } from "lucide-react";

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

interface TopicsClientProps {
  initialTopics: Topic[];
}

export default function TopicsClient({ initialTopics }: TopicsClientProps) {
  const { toast } = useToast();
  const [topics, setTopics] = React.useState<Topic[]>(initialTopics);

  // Modals state
  const [topicModalOpen, setTopicModalOpen] = React.useState(false);
  const [subTopicModalOpen, setSubTopicModalOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  // Edit/Create item state helpers
  const [modalMode, setModalMode] = React.useState<"create" | "edit">("create");
  const [deleteType, setDeleteType] = React.useState<"topic" | "subtopic">("topic");
  const [selectedTopic, setSelectedTopic] = React.useState<Topic | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = React.useState<SubTopic | null>(null);

  // Form states
  const [topicName, setTopicName] = React.useState("");
  const [topicOrder, setTopicOrder] = React.useState("0");
  const [subTopicName, setSubTopicName] = React.useState("");
  const [subTopicOrder, setSubTopicOrder] = React.useState("0");

  // Sync state if initialTopics changes
  React.useEffect(() => {
    setTopics(initialTopics);
  }, [initialTopics]);

  // TOPIC CRUD OPERATIONS

  const openCreateTopic = () => {
    setModalMode("create");
    setTopicName("");
    setTopicOrder(String(topics.length + 1));
    setTopicModalOpen(true);
  };

  const openEditTopic = (topic: Topic) => {
    setModalMode("edit");
    setSelectedTopic(topic);
    setTopicName(topic.name);
    setTopicOrder(String(topic.order));
    setTopicModalOpen(true);
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topicName.trim()) {
      toast({ type: "error", description: "Topic name is required." });
      return;
    }

    const orderNum = parseInt(topicOrder, 10);
    if (isNaN(orderNum) || orderNum < 0) {
      toast({ type: "error", description: "Order must be a valid positive integer." });
      return;
    }

    try {
      if (modalMode === "create") {
        const newTopic = await createTopic(topicName, orderNum);
        setTopics((prev) =>
          [...prev, { ...newTopic, subTopics: [] }].sort((a, b) => a.order - b.order)
        );
        toast({ type: "success", description: "Topic created successfully." });
      } else if (modalMode === "edit" && selectedTopic) {
        const updated = await updateTopic(selectedTopic.id, topicName, orderNum);
        setTopics((prev) =>
          prev
            .map((t) => (t.id === selectedTopic.id ? { ...t, ...updated } : t))
            .sort((a, b) => a.order - b.order)
        );
        toast({ type: "success", description: "Topic updated successfully." });
      }
      setTopicModalOpen(false);
    } catch (err: any) {
      toast({ type: "error", description: err.message || "Failed to save topic." });
    }
  };

  // SUBTOPIC CRUD OPERATIONS

  const openCreateSubTopic = (topic: Topic) => {
    setModalMode("create");
    setSelectedTopic(topic);
    setSubTopicName("");
    setSubTopicOrder(String(topic.subTopics.length + 1));
    setSubTopicModalOpen(true);
  };

  const openEditSubTopic = (topic: Topic, subTopic: SubTopic) => {
    setModalMode("edit");
    setSelectedTopic(topic);
    setSelectedSubTopic(subTopic);
    setSubTopicName(subTopic.name);
    setSubTopicOrder(String(subTopic.order));
    setSubTopicModalOpen(true);
  };

  const handleSubTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subTopicName.trim()) {
      toast({ type: "error", description: "Subtopic name is required." });
      return;
    }

    const orderNum = parseInt(subTopicOrder, 10);
    if (isNaN(orderNum) || orderNum < 0) {
      toast({ type: "error", description: "Order must be a valid positive integer." });
      return;
    }

    try {
      if (modalMode === "create" && selectedTopic) {
        const newSub = await createSubTopic(selectedTopic.id, subTopicName, orderNum);
        setTopics((prev) =>
          prev.map((t) => {
            if (t.id === selectedTopic.id) {
              return {
                ...t,
                subTopics: [...t.subTopics, newSub].sort((a, b) => a.order - b.order),
              };
            }
            return t;
          })
        );
        toast({ type: "success", description: "Subtopic created successfully." });
      } else if (modalMode === "edit" && selectedTopic && selectedSubTopic) {
        const updated = await updateSubTopic(selectedSubTopic.id, subTopicName, orderNum);
        setTopics((prev) =>
          prev.map((t) => {
            if (t.id === selectedTopic.id) {
              return {
                ...t,
                subTopics: t.subTopics
                  .map((s) => (s.id === selectedSubTopic.id ? { ...s, ...updated } : s))
                  .sort((a, b) => a.order - b.order),
              };
            }
            return t;
          })
        );
        toast({ type: "success", description: "Subtopic updated successfully." });
      }
      setSubTopicModalOpen(false);
    } catch (err: any) {
      toast({ type: "error", description: err.message || "Failed to save subtopic." });
    }
  };

  // DELETE CONFIRMATION HANDLERS

  const confirmDeleteTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setDeleteType("topic");
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSubTopic = (topic: Topic, subTopic: SubTopic) => {
    setSelectedTopic(topic);
    setSelectedSubTopic(subTopic);
    setDeleteType("subtopic");
    setDeleteConfirmOpen(true);
  };

  const handleDeleteExecute = async () => {
    try {
      if (deleteType === "topic" && selectedTopic) {
        await deleteTopic(selectedTopic.id);
        setTopics((prev) => prev.filter((t) => t.id !== selectedTopic.id));
        toast({ type: "success", description: "Topic deleted successfully." });
      } else if (deleteType === "subtopic" && selectedTopic && selectedSubTopic) {
        await deleteSubTopic(selectedSubTopic.id);
        setTopics((prev) =>
          prev.map((t) => {
            if (t.id === selectedTopic.id) {
              return {
                ...t,
                subTopics: t.subTopics.filter((s) => s.id !== selectedSubTopic.id),
              };
            }
            return t;
          })
        );
        toast({ type: "success", description: "Subtopic deleted successfully." });
      }
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      toast({ type: "error", description: err.message || "Failed to delete item." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Topics &amp; Subtopics</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build and order the training blueprint manual structures.
          </p>
        </div>
        <Button
          onClick={openCreateTopic}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Topic
        </Button>
      </div>

      {topics.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {topics.map((topic) => (
            <Card key={topic.id}>
              <CardHeader className="border-b border-white/5 p-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/8">
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white">{topic.name}</CardTitle>
                    <span className="text-[10px] text-zinc-500 font-semibold mt-1 block">Order: {topic.order}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateSubTopic(topic)}
                    className="flex items-center gap-1 text-zinc-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Subtopic
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditTopic(topic)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => confirmDeleteTopic(topic)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {topic.subTopics.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <Layers className="h-3 w-3" />
                      Subtopics
                    </div>
                    {topic.subTopics.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-200 font-medium">{sub.name}</span>
                          <span className="text-[9px] bg-white/5 border border-white/8 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                            Order {sub.order}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditSubTopic(topic, sub)}
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDeleteSubTopic(topic, sub)}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-white/5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-white/8 rounded-xl bg-white/1 text-zinc-500 text-xs">
                    No subtopics added yet. Click &quot;Add Subtopic&quot; to populate.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-zinc-800 bg-zinc-950/20 border-dashed py-16 text-center">
          <div className="max-w-xs mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full border border-zinc-850 flex items-center justify-center text-zinc-500 mx-auto">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">No Topics Configured</h3>
              <p className="text-zinc-500 text-xs mt-1">
                Configure your practice syllabus. Create a topic card above to get started.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* TOPIC CREATE/EDIT MODAL */}
      <Dialog open={topicModalOpen} onOpenChange={setTopicModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalMode === "create" ? "Create Topic" : "Edit Topic"}</DialogTitle>
            <DialogDescription>
              Enter the topic details. Order determines sorting layout.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTopicSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="tname">
                  Topic Name
                </label>
                <Input
                  id="tname"
                  type="text"
                  placeholder="Graphs, Dynamic Programming, Greedy..."
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="torder">
                  Order Index
                </label>
                <Input
                  id="torder"
                  type="number"
                  placeholder="1, 2, 3..."
                  value={topicOrder}
                  onChange={(e) => setTopicOrder(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTopicModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-650 hover:bg-indigo-700 text-white">
                {modalMode === "create" ? "Create Topic" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SUBTOPIC CREATE/EDIT MODAL */}
      <Dialog open={subTopicModalOpen} onOpenChange={setSubTopicModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create" ? "Add Subtopic" : "Edit Subtopic"}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "create"
                ? `Adding subtopic inside "${selectedTopic?.name}"`
                : `Editing subtopic in "${selectedTopic?.name}"`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubTopicSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="stname">
                  Subtopic Name
                </label>
                <Input
                  id="stname"
                  type="text"
                  placeholder="DSU, DFS &amp; BFS, Knapsack..."
                  value={subTopicName}
                  onChange={(e) => setSubTopicName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="storder">
                  Order Index
                </label>
                <Input
                  id="storder"
                  type="number"
                  placeholder="1, 2, 3..."
                  value={subTopicOrder}
                  onChange={(e) => setSubTopicOrder(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubTopicModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-650 hover:bg-indigo-700 text-white">
                {modalMode === "create" ? "Add Subtopic" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5 shrink-0" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-2">
              {deleteType === "topic" ? (
                <span>
                  Are you sure you want to delete topic <strong>{selectedTopic?.name}</strong>?
                  This action will permanently delete all associated subtopics and problems.
                </span>
              ) : (
                <span>
                  Are you sure you want to delete subtopic <strong>{selectedSubTopic?.name}</strong>?
                  This action will permanently delete all associated problems.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteExecute}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
