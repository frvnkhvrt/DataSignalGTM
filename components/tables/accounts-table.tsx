"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DataIssuesPanel } from "@/components/panels/data-issues-panel";
import { ReceiptPanel } from "@/components/panels/receipt-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "motion/react";
import {
  MotionListItem,
  transitionTableContentFade,
  transitionTableSkeletonFade,
} from "@/components/ui/motion";
import { isRecentlyUpdated } from "@/lib/realtime-glow";
import { SortButton, tableCheckboxClassName } from "@/components/tables/table-primitives";
import { TableColumnsMenu } from "@/components/tables/table-columns-menu";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  dqStatusLabel,
  dqTone,
  type AccountRow,
  type DataIssueCount,
  type Tone,
} from "@/lib/gtm-queries";

type AccountFilter = "all" | "healthy" | "held" | "critical";
type Density = "comfortable" | "compact";

function accountBucket(account: AccountRow): AccountFilter {
  const score = account.data_quality_score ?? 0;
  if (score >= 90) return "healthy";
  if (score >= 75) return "held";
  return "critical";
}

function StatusChip({ tone, label }: { tone: Tone; label: string }) {
  const variant = tone === "good" ? "success" : tone === "warn" ? "warning" : "destructive";
  const Icon = tone === "good" ? ShieldCheck : AlertTriangle;
  return (
    <Badge variant={variant} shape="square" className="uppercase">
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </Badge>
  );
}

export function AccountsTable({
  accounts,
  issueCounts,
  isLoading,
  isRefetching = false,
}: {
  accounts: AccountRow[];
  issueCounts: DataIssueCount[];
  isLoading: boolean;
  isRefetching?: boolean;
}) {
  const [gapsFor, setGapsFor] = useState<AccountRow | null>(null);
  const [receiptFor, setReceiptFor] = useState<{
    name: string;
    dq: number;
    icp?: number;
    industry?: string | null;
  } | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "data_quality_score", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [density, setDensity] = useState<Density>("comfortable");

  const issueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const count of issueCounts) {
      map.set(count.account_id, count.count);
    }
    return map;
  }, [issueCounts]);

  function openAccount(account: AccountRow) {
    const dq = account.data_quality_score ?? 0;
    if (dq >= 90) {
      setReceiptFor({
        name: account.name,
        dq,
        icp: account.icp_fit_score ?? 0,
        industry: account.industry,
      });
    } else {
      setGapsFor(account);
    }
  }

  const columns = useMemo<ColumnDef<AccountRow>[]>(
    () => [
      {
        id: "select",
        enableHiding: false,
        enableSorting: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all visible accounts"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className={tableCheckboxClassName}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onClick={(event) => event.stopPropagation()}
            onChange={row.getToggleSelectedHandler()}
            className={tableCheckboxClassName}
          />
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Account
          </SortButton>
        ),
        cell: ({ row }) => {
          const meta = [
            row.original.domain,
            row.original.employee_count != null
              ? `${row.original.employee_count.toLocaleString()} employees`
              : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <button
              type="button"
              onClick={() => openAccount(row.original)}
              className="ds-focus-ring min-w-0 max-w-[14rem] rounded-md text-left transition-[color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] sm:max-w-[18rem]"
              title={row.original.name}
            >
              <div className="truncate font-medium text-foreground hover:text-primary">
                {row.original.name}
              </div>
              {meta && (
                <div
                  className="mt-0.5 truncate text-[11px] text-muted-foreground"
                  title={meta}
                >
                  {meta}
                </div>
              )}
            </button>
          );
        },
      },
      {
        accessorKey: "industry",
        header: "Industry",
        cell: ({ row }) => {
          const industry = row.original.industry ?? "-";
          return (
            <span className="block max-w-[6.5rem] truncate text-muted-foreground sm:max-w-[9rem]" title={industry}>
              {industry}
            </span>
          );
        },
      },
      {
        accessorKey: "data_quality_score",
        header: ({ column }) => (
          <SortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            DQ
          </SortButton>
        ),
        filterFn: (row, _id, value: AccountFilter) =>
          value === "all" ? true : accountBucket(row.original) === value,
        cell: ({ row }) => {
          const score = row.original.data_quality_score ?? 0;
          const tone = dqTone(score);
          const bar =
            tone === "good"
              ? "bg-success"
              : tone === "warn"
                ? "bg-warning"
                : "bg-destructive";
          const text =
            tone === "good"
              ? "text-success"
              : tone === "warn"
                ? "text-warning"
                : "text-destructive";
          return (
            <div className="flex min-w-0 max-w-[10rem] items-center gap-2 sm:max-w-[12rem] sm:gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${bar}`}
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
              <span className={`w-7 text-right font-mono text-xs ${text}`}>
                {score}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "icp_fit_score",
        header: ({ column }) => (
          <SortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            ICP
          </SortButton>
        ),
        cell: ({ row }) => (
          <span className="font-mono tabular-nums text-muted-foreground">
            {row.original.icp_fit_score ?? 0}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (row) => accountBucket(row),
        header: "Status",
        cell: ({ row }) => {
          const score = row.original.data_quality_score ?? 0;
          const tone = dqTone(score);
          const gaps = issueMap.get(row.original.id) ?? 0;
          return (
            <div className="flex items-center gap-2">
              <StatusChip tone={tone} label={dqStatusLabel(score)} />
              {gaps > 0 && (
                <Badge variant="warning" className="px-1.5 py-0 text-[10px] tabular-nums">
                  {gaps}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const account = row.original;
          const healthy = (account.data_quality_score ?? 0) >= 90;
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => openAccount(account)}
                variant={healthy ? "default" : "warning"}
                size="sm"
                className="shrink-0 whitespace-nowrap"
                aria-label={`${healthy ? "Open playbook for" : "Review data gaps for"} ${account.name}`}
              >
                {healthy ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <Wrench className="h-3.5 w-3.5" />
                )}
                {healthy ? "Playbook" : "Review gaps"}
              </Button>
            </div>
          );
        },
      },
    ],
    [issueMap]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: accounts,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const rowPadding = density === "compact" ? "px-3 py-2" : "px-3 py-3";
  const visibleRowCount = table.getRowModel().rows.length;

  return (
    <div className="min-w-0 space-y-4">
      <div role="status" aria-live="polite" className="sr-only">
        {isRefetching
          ? "Refreshing accounts."
          : `${visibleRowCount} accounts shown. ${selectedCount} selected.`}
      </div>
      <Card className="relative flex min-w-0 flex-col gap-3 overflow-hidden bg-card/80 p-3 ds-card-inner-glow md:flex-row md:items-center md:justify-between md:gap-4">
        {isRefetching && (
          <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
            <div className="ds-refetch-stripe" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          <label htmlFor="account-search" className="sr-only">
            Search accounts
          </label>
          <Input
            id="account-search"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            placeholder="Search accounts..."
            className="sm:max-w-xs"
          />
          <Select
            value={
              (table.getColumn("data_quality_score")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table.getColumn("data_quality_score")?.setFilterValue(value)
            }
          >
            <SelectTrigger
              aria-label="Filter account health"
              className="w-full min-w-0 sm:max-w-[200px]"
            >
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6}>
              <SelectItem value="all">All accounts</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="held">Held</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
          <div className="inline-flex rounded-lg border border-border/80 bg-background/45 p-1 ds-inset-top-soft shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition-[border-color,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none">
            {(["comfortable", "compact"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={density === value ? "secondary" : "ghost"}
                size="xs"
                aria-pressed={density === value}
                onClick={() => {
                  setDensity(value);
                  table.setPageSize(value === "compact" ? 14 : 10);
                }}
                className={
                  density === value
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : ""
                }
              >
                {value === "comfortable" ? "Comfort" : "Compact"}
              </Button>
            ))}
          </div>
          <span className="rounded-full border border-border/80 bg-background/45 px-2 py-1 text-xs tabular-nums text-muted-foreground transition-[border-color,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] ds-inset-top-mid">
            {selectedCount} selected
          </span>
          <TableColumnsMenu table={table} />
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden bg-card/80 p-0 ds-card-inner-glow" aria-busy={isLoading || isRefetching}>
        <div className="overflow-x-auto overscroll-x-contain">
          <Table className="min-w-[800px]">
            <TableHeader className="sticky top-0 z-10 border-b border-border/70 bg-background/[0.96] shadow-[0_6px_16px_-8px_rgb(0_0_0/0.28)] backdrop-blur-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-0 text-left text-[11px] uppercase tracking-wide text-muted-foreground hover:bg-transparent data-[state=selected]:bg-transparent ds-chrome-divider"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-3 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.tbody
                  key="skeleton"
                  className={cn(
                    "[&_tr:last-child]:border-0",
                    "divide-y divide-border"
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitionTableSkeletonFade}
                >
                  <TableSkeleton rows={7} columns={7} />
                </motion.tbody>
              ) : table.getRowModel().rows.length > 0 ? (
                <motion.tbody
                  key="content"
                  className={cn(
                    "[&_tr:last-child]:border-0",
                    "divide-y divide-border"
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitionTableContentFade}
                >
                  <AnimatePresence initial={false}>
                    {table.getRowModel().rows.map((row) => (
                      <MotionListItem
                        key={row.id}
                        as="tr"
                        className={[
                          "ds-row hover:bg-surface-elevated/70",
                          "data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-primary/12 data-[selected=true]:to-primary/4",
                          "data-[selected=true]:shadow-[inset_2px_0_0_var(--color-primary)]",
                          isRecentlyUpdated("accounts", row.original.id) ? "ds-row-updated" : "",
                        ].join(" ")}
                        data-selected={row.getIsSelected()}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={rowPadding}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </MotionListItem>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              ) : (
                <motion.tbody
                  key="empty"
                  className="[&_tr:last-child]:border-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitionTableSkeletonFade}
                >
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableCell
                      colSpan={table.getVisibleLeafColumns().length}
                      className="px-4 py-10"
                    >
                      <EmptyState
                        icon={<Building2 className="h-6 w-6" />}
                        title="No accounts in this view"
                        description="Clear the current filters or review a broader health segment to find matching accounts."
                        action={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              table.getColumn("name")?.setFilterValue("");
                              table.getColumn("data_quality_score")?.setFilterValue("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                </motion.tbody>
              )}
            </AnimatePresence>
          </Table>
        </div>
      </Card>

      <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center rounded-full border border-border bg-background/40 px-3 py-1 text-[11px] font-medium tabular-nums ds-inset-top-mid">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <Button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <DataIssuesPanel account={gapsFor} onClose={() => setGapsFor(null)} />
      <ReceiptPanel account={receiptFor} onClose={() => setReceiptFor(null)} />
    </div>
  );
}
