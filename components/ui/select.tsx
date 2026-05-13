import * as React from "react";

import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "ds-focus-ring ds-input-well flex h-9 appearance-none rounded-md border border-input bg-background/60 bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_0.65rem_center] bg-no-repeat pr-8 pl-3 py-2 text-sm text-foreground transition-[border-color,box-shadow,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:border-primary/30 focus-visible:border-ring/60 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
