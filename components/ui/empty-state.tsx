"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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
        "mx-auto flex max-w-lg flex-col items-center border-dashed bg-card/60 px-6 py-10 text-center",
        className
      )}
    >
      <motion.div
        className="ds-empty-orb mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border text-primary shadow-soft"
        initial={reduced ? {} : { scale: 0.55, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 26, mass: 0.8 }
        }
      >
        {icon}
      </motion.div>

      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 7 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.1 }
        }
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
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.22, ease: [0.16, 1, 0.3, 1], delay: 0.2 }
          }
        >
          {action}
        </motion.div>
      )}
    </Card>
  );
}

export { EmptyState };
