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
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          // Variants
          variant === "default" && "glass-btn-primary",
          variant === "destructive" && "bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 hover:border-red-500/40 shadow-[0_4px_12px_rgba(239,68,68,0.15)]",
          variant === "outline" && "glass-btn-secondary",
          variant === "secondary" && "bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white",
          variant === "ghost" && "text-zinc-400 hover:bg-white/5 hover:text-white",
          variant === "link" && "text-zinc-400 underline-offset-4 hover:underline hover:text-white",
          // Sizes
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-8 rounded-md px-3 text-xs",
          size === "lg" && "h-11 rounded-md px-8",
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
