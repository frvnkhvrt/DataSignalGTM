import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "ds-focus-ring ds-input-well flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm text-foreground transition-[border-color,box-shadow,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] outline-none placeholder:text-muted-foreground hover:border-border/90 focus-visible:border-ring/60 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
