import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-secondary-foreground",
        muted: "border-border bg-muted text-muted-foreground",
        success: "border-success/40 bg-success/10 text-success",
        warning: "border-warning/40 bg-warning/10 text-warning",
        destructive:
          "border-destructive/40 bg-destructive/10 text-destructive",
        info: "border-info/40 bg-info/10 text-info",
        brand: "border-primary/40 bg-primary/10 text-primary",
      },
      shape: {
        pill: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "pill",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, shape, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, shape }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
