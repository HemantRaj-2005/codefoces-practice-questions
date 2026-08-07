import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "rating" | "topic" | "pattern";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
        variant === "default" && "border-transparent bg-zinc-100 text-zinc-950 hover:bg-zinc-200",
        variant === "secondary" && "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800",
        variant === "destructive" && "border-red-900 bg-red-950/60 text-red-200 hover:bg-red-900/40",
        variant === "outline" && "border-zinc-700 text-zinc-300 hover:bg-zinc-900",
        // Custom Codeforces rating/topic badges
        variant === "rating" && "border-blue-900/50 bg-blue-950/40 text-blue-300",
        variant === "topic" && "border-purple-900/50 bg-purple-950/40 text-purple-300",
        variant === "pattern" && "border-emerald-900/50 bg-emerald-950/40 text-emerald-300",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
