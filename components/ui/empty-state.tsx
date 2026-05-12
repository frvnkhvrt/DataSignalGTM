import * as React from "react";

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
  return (
    <Card
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center border-dashed bg-card/60 px-6 py-10 text-center",
        className
      )}
    >
      <div className="ds-empty-orb mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border text-primary shadow-soft">
        {icon}
      </div>
      <h3 className="ds-heading text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export { EmptyState };
