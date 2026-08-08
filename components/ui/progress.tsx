import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    const boundedValue = Math.min(100, Math.max(0, value || 0));

    // Dynamic gradient based on percentage solved
    let gradientClass = "from-red-500 to-red-500"; // Low progress (<= 40%): completely red
    if (boundedValue > 40 && boundedValue <= 80) {
      gradientClass = "from-red-500 via-red-400 to-yellow-400"; // Medium progress (40% - 80%): red & yellow
    } else if (boundedValue > 80) {
      gradientClass = "from-red-500 via-yellow-400 to-emerald-500"; // High progress (> 80%): red, yellow & green
    }

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
            "h-full w-full flex-1 bg-gradient-to-r transition-all duration-500 ease-out",
            gradientClass,
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
