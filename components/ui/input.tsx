import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl bg-black/25 px-3.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-500/80 transition-all duration-250",
          "border border-white/7",
          "shadow-[inset_0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(0,0,0,0.20),0_1px_0_rgba(255,255,255,0.03)]",
          "focus-visible:outline-none focus:border-[#ff6a3d]/50 focus:ring-2 focus:ring-[#ff6a3d]/15 focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.35),0_0_20px_rgba(255,106,61,0.08)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
