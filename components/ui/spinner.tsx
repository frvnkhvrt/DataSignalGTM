"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { dur, ease } from "@/components/ui/motion";

const sizeClass = {
  sm: "size-3",
  md: "size-3.5",
  default: "size-4",
  lg: "size-5",
} as const;

type SpinnerProps = Omit<React.ComponentProps<typeof Loader2>, "size"> & {
  size?: keyof typeof sizeClass;
  /** Muted tone for inline secondary busy states */
  muted?: boolean;
};

/**
 * Loading glyph aligned with shadcn Spinner (Loader2) plus product motion:
 * near-static spin under `prefers-reduced-motion`; optional opacity pulse when allowed.
 */
function Spinner({ className, size = "default", muted, ...props }: SpinnerProps) {
  const reduced = useReducedMotion();

  const icon = (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn(
        "shrink-0 animate-spin",
        sizeClass[size],
        muted ? "text-muted-foreground" : "text-primary/90",
        className
      )}
      {...props}
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

export { Spinner };
