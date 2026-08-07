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
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          // Variants
          variant === "default" && "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border border-transparent shadow",
          variant === "destructive" && "bg-red-950/60 text-red-200 border border-red-900/50 hover:bg-red-900/60",
          variant === "outline" && "border border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:bg-zinc-900 hover:text-white",
          variant === "secondary" && "bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/80 border border-zinc-700/50",
          variant === "ghost" && "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
          variant === "link" && "text-zinc-300 underline-offset-4 hover:underline",
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
