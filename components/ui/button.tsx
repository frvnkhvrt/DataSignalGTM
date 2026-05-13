import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ds-focus-ring ds-pressable inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-shadow disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-primary/88 text-primary-foreground shadow-glow shadow-[inset_0_1px_0_rgb(255_255_255_/_0.15)] hover:from-primary/95 hover:to-primary/80 hover:shadow-glow-strong",
        secondary:
          "border border-border bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:bg-secondary/80",
        outline:
          "border border-border bg-background/40 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:border-border/80 hover:bg-surface-elevated hover:shadow-soft",
        ghost:
          "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
        destructive:
          "border border-destructive/40 bg-destructive/10 text-destructive shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:bg-destructive/15",
        success:
          "border border-success/40 bg-success/10 text-success shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:bg-success/15",
        warning:
          "border border-warning/40 bg-warning/10 text-warning shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:bg-warning/15",
      },
      size: {
        xs: "h-7 rounded-sm px-2 text-xs",
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-10 rounded-lg px-5",
        icon: "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
