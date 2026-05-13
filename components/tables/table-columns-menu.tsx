"use client";

import type { Table } from "@tanstack/react-table";
import { Columns3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function TableColumnsMenu<TData>({
  table,
  className,
}: {
  table: Table<TData>;
  className?: string;
}) {
  const hideable = table.getAllLeafColumns().filter((column) => column.getCanHide());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 border-border bg-background/50 px-2.5 text-xs font-medium text-muted-foreground ds-inset-top-soft transition-[background-color,border-color,color,box-shadow] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none hover:border-border/90 hover:bg-surface-elevated hover:text-foreground data-[state=open]:border-primary/28 data-[state=open]:bg-surface-elevated/90 data-[state=open]:text-foreground data-[state=open]:shadow-soft",
            className
          )}
        >
          <Columns3 className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideable.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="text-xs capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
          >
            {column.id.replace(/_/g, " ")}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
