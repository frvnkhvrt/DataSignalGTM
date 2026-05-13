import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5 backdrop-blur-sm transition-[color,background-color,border-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)]",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary/90 text-secondary-foreground ds-card-inner-glow",
        muted: "border-border bg-muted/90 text-muted-foreground ds-inset-top-soft",
        success: "border-success/40 bg-success/10 text-success ds-card-inner-glow",
        warning: "border-warning/40 bg-warning/10 text-warning ds-card-inner-glow",
        destructive:
          "border-destructive/40 bg-destructive/10 text-destructive ds-card-inner-glow",
        info: "border-info/40 bg-info/10 text-info ds-card-inner-glow",
        brand: "border-primary/40 bg-primary/10 text-primary ds-card-inner-glow",
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
