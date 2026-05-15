"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  density = "comfortable",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  /** `compact` — nested cards/tables: tighter rhythm, smaller orb, full-width friendly. */
  density?: "comfortable" | "compact";
}) {
  const reduced = useReducedMotion();
  const compact = density === "compact";

  return (
    <Card
      className={cn(
        "mx-auto flex w-full flex-col border-border/55 bg-card/55 shadow-soft backdrop-blur-md",
        "ds-inset-top-soft ds-card-inner-glow",
        "[background-image:radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_5%,transparent),transparent)]",
        compact ? "max-w-md" : "max-w-lg",
        className
      )}
    >
      <CardHeader
        className={cn(
          "items-center space-y-0 text-center",
          compact
            ? cn("px-5 pb-0", action ? "pt-8" : "py-8")
            : cn("px-6 pb-0", action ? "pt-10" : "py-10")
        )}
      >
        <motion.div
          className={cn(
            "ds-empty-orb ds-empty-orb-glow mx-auto flex items-center justify-center border border-primary/20 text-primary",
            compact
              ? "mb-3 h-11 w-11 rounded-xl"
              : "mb-4 h-14 w-14 rounded-2xl"
          )}
          initial={reduced ? {} : { scale: 0.55, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduced ? { duration: 0 } : spring.bouncy}
        >
          {compact ? (
            <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
          ) : (
            icon
          )}
        </motion.div>

        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : transitionEmptyStateText}
          className={cn("space-y-2", compact && "space-y-1.5")}
        >
          <CardTitle
            className={cn(
              "ds-heading font-semibold text-foreground",
              compact ? "text-base" : "text-lg"
            )}
          >
            {title}
          </CardTitle>
          <CardDescription
            className={cn(
              "text-muted-foreground",
              compact ? "text-xs leading-5" : "text-sm leading-6"
            )}
          >
            {description}
          </CardDescription>
        </motion.div>
      </CardHeader>

      {action && (
        <CardFooter
          className={cn("flex justify-center", compact ? "px-5 pb-8 pt-2" : "px-6 pb-10 pt-2")}
        >
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : transitionEmptyStateAction}
          >
            {action}
          </motion.div>
        </CardFooter>
      )}
    </Card>
  );
}

export { EmptyState };
