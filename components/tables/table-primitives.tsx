import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared table / toolbar checkbox — matches ds-focus-ring cadence */
export const tableCheckboxClassName =
  "ds-focus-ring h-4 w-4 shrink-0 cursor-pointer rounded border-input bg-background accent-primary transition-[border-color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:border-primary/35";

export function SortButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ds-focus-ring inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-1 py-0.5 -mx-1 text-left font-medium text-muted-foreground",
        "transition-[color,transform] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-[color] motion-reduce:duration-[var(--ds-duration-tactile)]",
        "hover:text-foreground active:scale-[0.98] active:text-foreground motion-reduce:active:scale-100"
      )}
    >
      {children}
      <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-70" />
    </button>
  );
}
