import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    const boundedValue = Math.min(100, Math.max(0, value || 0));

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-zinc-800/80 border border-zinc-700/30",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out",
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - boundedValue}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
