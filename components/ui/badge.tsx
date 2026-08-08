import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "rating" | "topic" | "pattern";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
        variant === "default" && "border-transparent bg-zinc-100 text-zinc-950 hover:bg-zinc-200",
        variant === "secondary" && "border-white/8 bg-white/5 text-zinc-300",
        variant === "destructive" && "border-red-500/25 bg-red-500/10 text-red-300",
        variant === "outline" && "border-white/12 text-zinc-300 bg-transparent",
        // Glass themed ratings, topics and patterns
        variant === "rating" && "border-blue-500/20 bg-blue-500/10 text-blue-300 shadow-[0_2px_8px_rgba(59,130,246,0.08)]",
        variant === "topic" && "border-purple-500/20 bg-purple-500/10 text-purple-300 shadow-[0_2px_8px_rgba(168,85,247,0.08)]",
        variant === "pattern" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_2px_8px_rgba(16,185,129,0.08)]",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
