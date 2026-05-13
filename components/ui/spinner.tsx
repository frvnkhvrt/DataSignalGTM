"use client";

import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { dur, ease } from "@/components/ui/motion";

const sizeClass = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  default: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

/**
 * Branded loading glyph. Spin is near-static under `prefers-reduced-motion`
 * (global CSS). Optional opacity breathing only when motion is allowed.
 */
export function Spinner({
  className,
  size = "default",
  muted,
}: {
  className?: string;
  size?: keyof typeof sizeClass;
  /** Muted tone for inline secondary busy states */
  muted?: boolean;
}) {
  const reduced = useReducedMotion();

  const icon = (
    <Loader2
      aria-hidden
      className={cn(
        "shrink-0 animate-spin",
        sizeClass[size],
        muted ? "text-muted-foreground" : "text-primary/90",
        className
      )}
    />
  );

  if (reduced) {
    return <span className="inline-flex">{icon}</span>;
  }

  return (
    <motion.span
      className="inline-flex"
      animate={{ opacity: [0.82, 1, 0.82] }}
      transition={{
        duration: dur.slow * 1.4,
        ease: ease.inOut,
        repeat: Infinity,
      }}
    >
      {icon}
    </motion.span>
  );
}
