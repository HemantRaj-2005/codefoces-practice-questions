"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glassClassName?: string;
  enableTilt?: boolean;
  enableLight?: boolean;
  intensity?: number; // 1-3, controls effect strength
}

export function GlassCard({
  children,
  className,
  glassClassName,
  enableTilt = true,
  enableLight = true,
  intensity = 2,
}: GlassCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Mouse position within card (0-1)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth spring values for 3D rotation
  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [intensity, -intensity]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-intensity, intensity]), springConfig);

  // CSS variable values for cursor light (percentage-based)
  const lightX = useMotionValue("50%");
  const lightY = useMotionValue("50%");

  const [isHovered, setIsHovered] = React.useState(false);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || prefersReducedMotion) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      mouseX.set(x);
      mouseY.set(y);
      lightX.set(`${x * 100}%`);
      lightY.set(`${y * 100}%`);
    },
    [mouseX, mouseY, lightX, lightY, prefersReducedMotion]
  );

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
    lightX.set("50%");
    lightY.set("50%");
  }, [mouseX, mouseY, lightX, lightY]);

  const shouldAnimate = !prefersReducedMotion;

  return (
    <motion.div
      ref={cardRef}
      className={cn("relative group", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={
        shouldAnimate && enableTilt
          ? {
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              perspective: "800px",
            }
          : undefined
      }
      whileHover={shouldAnimate ? { scale: 1.01 } : undefined}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      {/* Glass surface */}
      <div
        className={cn(
          "relative rounded-2xl glass-reflect overflow-hidden",
          glassClassName
        )}
      >
        {/* Cursor-following light overlay */}
        {shouldAnimate && enableLight && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
            style={{
              background: isHovered
                ? `radial-gradient(circle 180px at var(--light-x, 50%) var(--light-y, 50%), rgba(255,255,255,0.07), transparent 50%)`
                : "none",
              // @ts-ignore custom CSS properties
              "--light-x": lightX,
              "--light-y": lightY,
            } as React.CSSProperties}
          />
        )}

        {/* Content */}
        <div className="relative z-[2]">{children}</div>
      </div>
    </motion.div>
  );
}
