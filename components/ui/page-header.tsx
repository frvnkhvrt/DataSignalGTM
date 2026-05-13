import * as React from "react";
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
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="ds-eyebrow mb-2 text-primary">{eyebrow}</p>}
        <h1 className="ds-heading text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
