"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { searchGlobal } from "@/actions/platform";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, CheckSquare, Award, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{
    problems: any[];
    topics: any[];
    contests: any[];
  }>({ problems: [], topics: [], contests: [] });
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Toggle Command Palette on Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Run search when query changes (with debouncing)
  React.useEffect(() => {
    if (!query.trim()) {
      setResults({ problems: [], topics: [], contests: [] });
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await searchGlobal(query);
        setResults(res);
        setSelectedIndex(0);
      } catch (err) {
        // Ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const flatResults = React.useMemo(() => {
    const items: any[] = [];
    
    results.topics.forEach((t) => {
      items.push({ type: "topic", id: t.id, name: t.name, url: `/problems` }); // Redirect to problems
    });

    results.problems.forEach((p) => {
      items.push({ type: "problem", id: p.id, name: p.problem, sub: `${p.mainTopic} • Rating ${p.rating}`, url: `/problems` });
    });

    results.contests.forEach((c) => {
      items.push({ type: "contest", id: c.id, name: c.name, sub: `Rank ${c.rank}`, url: `/contests` });
    });

    return items;
  }, [results]);

  // Handle arrow key selections
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % Math.max(1, flatResults.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const activeItem = flatResults[selectedIndex];
      if (activeItem) {
        setOpen(false);
        setQuery("");
        router.push(activeItem.url);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-4 max-w-lg border-white/10 p-0 overflow-hidden text-zinc-200">
        <div className="flex items-center border-b border-white/5 px-4 h-12 relative">
          <Search className="h-4 w-4 text-zinc-550 shrink-0 mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a topic, problem, or contest... (Esc to exit)"
            className="border-0 bg-transparent focus:ring-0 focus:outline-none placeholder-zinc-550 w-full pl-0 text-xs text-white"
          />
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {flatResults.length > 0 ? (
            flatResults.map((item, idx) => {
              const active = idx === selectedIndex;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(item.url);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border border-transparent",
                    active 
                      ? "bg-white/5 border-white/8 text-white shadow-sm"
                      : "text-zinc-400 hover:bg-white/2 hover:text-zinc-250"
                  )}
                >
                  {item.type === "topic" && <BookOpen className="h-4 w-4 text-[#9b6dff]" />}
                  {item.type === "problem" && <CheckSquare className="h-4 w-4 text-[#ffbe3c]" />}
                  {item.type === "contest" && <Award className="h-4 w-4 text-[#5b8cff]" />}
                  
                  <div className="overflow-hidden">
                    <span className="font-semibold block truncate">{item.name}</span>
                    {item.sub && (
                      <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">{item.sub}</span>
                    )}
                  </div>
                </button>
              );
            })
          ) : query.trim() && !loading ? (
            <div className="text-center py-8 text-zinc-550 text-xs">No matching results found.</div>
          ) : (
            <div className="text-center py-6 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
              Search CP Platform OS
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default CommandPalette;
