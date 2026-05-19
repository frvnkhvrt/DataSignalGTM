"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const TABLE_TOOLBAR_INSET =
  "rounded-xl border border-border/80 bg-background/45 p-0.5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition-[border-color,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none";

export const TABLE_STICKY_HEADER_CLASS =
  "sticky top-0 z-10 bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80";

export type TableDensity = "comfortable" | "compact";

export function TableLiveRegion({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}

export function TableToolbarCard({
  isRefetching,
  toolbar,
  trailing,
}: {
  isRefetching?: boolean;
  toolbar: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <Card className="relative flex min-w-0 flex-col gap-3 overflow-hidden bg-card/80 p-3 ds-card-inner-glow md:flex-row md:items-center md:justify-between md:gap-4">
      {isRefetching ? (
        <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="ds-refetch-stripe" />
        </div>
      ) : null}
      {toolbar}
      {trailing}
    </Card>
  );
}

export function TableDensityToggle({
  density,
  onDensityChange,
}: {
  density: TableDensity;
  onDensityChange: (density: TableDensity) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={density}
      onValueChange={(value) => {
        if (!value) return;
        onDensityChange(value as TableDensity);
      }}
      size="sm"
      spacing={0}
      className={TABLE_TOOLBAR_INSET}
    >
      <ToggleGroupItem
        value="comfortable"
        aria-label="Comfortable density"
        className="text-xs text-muted-foreground data-[state=on]:bg-foreground data-[state=on]:text-background hover:data-[state=on]:bg-foreground/90"
      >
        Comfort
      </ToggleGroupItem>
      <ToggleGroupItem
        value="compact"
        aria-label="Compact density"
        className="text-xs text-muted-foreground data-[state=on]:bg-foreground data-[state=on]:text-background hover:data-[state=on]:bg-foreground/90"
      >
        Compact
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export function TablePaginationFooter<T>({ table }: { table: Table<T> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-col gap-2 border-t border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function TableStickyHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TableHeader className={TABLE_STICKY_HEADER_CLASS}>
      <TableRow>{children}</TableRow>
    </TableHeader>
  );
}

export function TableStickyHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <TableHead className={className}>{children}</TableHead>;
}
