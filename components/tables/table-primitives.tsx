import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function SortButton({
  children,
  onClick,
  sorted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  /** TanStack `column.getIsSorted()` return value */
  sorted?: false | "asc" | "desc";
}) {
  const Icon =
    sorted === "asc" ? ChevronUp : sorted === "desc" ? ChevronDown : ChevronsUpDown;
  const active = sorted === "asc" || sorted === "desc";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        sorted === "asc"
          ? "Sorted ascending — click to sort descending"
          : sorted === "desc"
            ? "Sorted descending — click to clear sort"
            : "Click to sort ascending"
      }
      className={cn(
        "ds-focus-ring inline-flex items-center gap-1 rounded-md px-1 py-0.5 -mx-1 text-left font-medium",
        "transition-[color,transform] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)]",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        "active:scale-[0.98] active:text-foreground"
      )}
    >
      {children}
      <Icon
        className={cn(
          "h-3 w-3 transition-opacity duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)]",
          active ? "opacity-100" : "opacity-60"
        )}
        aria-hidden
      />
    </button>
  );
}
