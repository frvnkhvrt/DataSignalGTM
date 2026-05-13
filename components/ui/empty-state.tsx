"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  spring,
  transitionEmptyStateAction,
  transitionEmptyStateText,
} from "@/components/ui/motion";

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <Card
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center border-border/55 bg-card/55 px-6 py-10 text-center shadow-soft backdrop-blur-md",
        "ds-inset-top-soft",
        "[background-image:radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_5%,transparent),transparent)]",
        className
      )}
    >
      <motion.div
        className="ds-empty-orb ds-empty-orb-glow mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 text-primary"
        initial={reduced ? {} : { scale: 0.55, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduced ? { duration: 0 } : spring.bouncy}
      >
        {icon}
      </motion.div>

      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : transitionEmptyStateText}
        className="space-y-2"
      >
        <h3 className="ds-heading text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </motion.div>

      {action && (
        <motion.div
          className="mt-5"
          initial={reduced ? {} : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : transitionEmptyStateAction}
        >
          {action}
        </motion.div>
      )}
    </Card>
  );
}

export { EmptyState };
