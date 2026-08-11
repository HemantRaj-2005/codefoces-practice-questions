import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "rating" | "topic" | "pattern";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-250",
        variant === "default" && "border-transparent bg-zinc-100 text-zinc-950 hover:bg-zinc-200",
        variant === "secondary" && "border-white/8 bg-white/5 text-zinc-300",
        variant === "destructive" && "border-red-500/20 bg-red-500/10 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.08)]",
        variant === "outline" && "border-white/10 text-zinc-300 bg-transparent",
        // Glowing glass badges
        variant === "rating" && "border-blue-400/20 bg-blue-500/8 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.10),inset_0_1px_0_rgba(255,255,255,0.04)]",
        variant === "topic" && "border-purple-400/20 bg-purple-500/8 text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.10),inset_0_1px_0_rgba(255,255,255,0.04)]",
        variant === "pattern" && "border-emerald-400/20 bg-emerald-500/8 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.10),inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
