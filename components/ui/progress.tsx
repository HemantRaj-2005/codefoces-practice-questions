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

    // Glow color matching progress state
    let glowColor = "rgba(239, 68, 68, 0.3)";
    if (boundedValue > 40 && boundedValue <= 80) glowColor = "rgba(250, 204, 21, 0.25)";
    if (boundedValue > 80) glowColor = "rgba(16, 185, 129, 0.25)";

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full",
          "bg-white/5 border border-white/6",
          "shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 bg-gradient-to-r transition-all duration-700 ease-out rounded-full",
            gradientClass,
            indicatorClassName
          )}
          style={{
            transform: `translateX(-${100 - boundedValue}%)`,
            boxShadow: boundedValue > 0 ? `0 0 12px ${glowColor}` : "none",
          }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
