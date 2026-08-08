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
          "flex h-10 w-full rounded-lg border border-white/8 bg-black/25 px-3 py-2 text-sm text-zinc-150 placeholder:text-zinc-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus-visible:outline-none focus:border-[#ff542f] focus:ring-1 focus:ring-[#ff542f]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
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
