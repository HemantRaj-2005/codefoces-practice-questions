import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-250 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
          // Variants
          variant === "default" && "glass-btn-primary",
          variant === "destructive" && "bg-red-500/15 border border-red-500/25 text-red-200 hover:bg-red-500/25 hover:border-red-500/35 shadow-[0_4px_16px_rgba(239,68,68,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_rgba(239,68,68,0.25)] hover:-translate-y-0.5",
          variant === "outline" && "glass-btn-secondary",
          variant === "secondary" && "bg-white/4 border border-white/8 text-zinc-300 hover:bg-white/7 hover:text-white hover:border-white/12 shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5",
          variant === "ghost" && "text-zinc-400 hover:bg-white/5 hover:text-white",
          variant === "link" && "text-zinc-400 underline-offset-4 hover:underline hover:text-white",
          // Sizes
          size === "default" && "h-10 px-5 py-2",
          size === "sm" && "h-8 rounded-lg px-3.5 text-xs",
          size === "lg" && "h-11 rounded-xl px-8",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
