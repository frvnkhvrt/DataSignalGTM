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
  ChevronsUpDown,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { DataIssuesPanel } from "@/components/panels/data-issues-panel";
import { ReceiptPanel } from "@/components/panels/receipt-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
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

function SortButton({
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
      className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
    >
      {children}
      <ChevronsUpDown className="h-3 w-3" />
    </button>
  );
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
            className="h-4 w-4 rounded border-input bg-background"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onClick={(event) => event.stopPropagation()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-input bg-background"
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
              className="text-left"
            >
              <div className="font-medium text-foreground hover:text-primary">
                {row.original.name}
              </div>
              {meta && (
                <div className="mt-0.5 max-w-[220px] truncate text-[11px] text-muted-foreground">
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
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.industry ?? "-"}</span>
        ),
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
            <div className="flex min-w-40 items-center gap-3">
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
    <div className="space-y-4">
      <div role="status" aria-live="polite" className="sr-only">
        {isRefetching
          ? "Refreshing accounts."
          : `${visibleRowCount} accounts shown. ${selectedCount} selected.`}
      </div>
      <Card className="relative flex flex-col gap-3 overflow-hidden bg-card/80 p-3 md:flex-row md:items-center md:justify-between">
        {isRefetching && (
          <div className="absolute inset-x-0 top-0 h-px overflow-hidden bg-primary/10">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary shadow-glow" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
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
            aria-label="Filter account health"
            value={
              (table.getColumn("data_quality_score")?.getFilterValue() as string) ??
              "all"
            }
            onChange={(event) =>
              table
                .getColumn("data_quality_score")
                ?.setFilterValue(event.target.value)
            }
          >
            <option value="all">All accounts</option>
            <option value="healthy">Healthy</option>
            <option value="held">Held</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-background/40 p-1">
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
          <span className="rounded-full border border-border bg-background/40 px-2 py-1 text-xs text-muted-foreground">
            {selectedCount} selected
          </span>
          <details className="relative">
            <summary className="ds-focus-ring cursor-pointer rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-elevated hover:text-foreground">
              Columns<span className="sr-only"> visibility controls</span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-border bg-popover p-2 shadow-elevated">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                    {column.id.replace(/_/g, " ")}
                  </label>
                ))}
            </div>
          </details>
        </div>
      </Card>

      <Card className="overflow-hidden bg-card/80 p-0" aria-busy={isLoading || isRefetching}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-border bg-background/60">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="text-left text-[11px] uppercase tracking-wide text-muted-foreground"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-3 font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <TableSkeleton rows={7} columns={7} />
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="ds-row transition-colors hover:bg-surface-elevated/70 data-[selected=true]:bg-primary/10 data-[selected=true]:shadow-[inset_3px_0_0_var(--color-primary)]"
                    data-selected={row.getIsSelected()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={`${rowPadding} align-middle`}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={table.getVisibleLeafColumns().length} className="px-4 py-10">
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
                            table
                              .getColumn("data_quality_score")
                              ?.setFilterValue("all");
                          }}
                        >
                          Clear filters
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex items-center gap-2">
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
