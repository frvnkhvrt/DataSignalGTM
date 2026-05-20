import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Shared page-level heading used across all product surfaces.
 * Provides consistent typographic hierarchy, rhythm, and an optional
 * actions slot that right-aligns on ≥sm viewports.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const routeKey = pathname ? pathname.replace(/\//g, "-") : "shared";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="ds-eyebrow mb-2 text-primary">{eyebrow}</p>}
        <motion.h1
          layoutId={`${routeKey}-page-header-title`}
          className="ds-heading text-2xl font-semibold text-foreground sm:text-3xl"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            layoutId={`${routeKey}-page-header-description`}
            className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </motion.p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
