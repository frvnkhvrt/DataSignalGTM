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
import {
  dqStatusLabel,
  dqTone,
  type AccountRow,
  type DataIssueCount,
  type Tone,
} from "@/lib/gtm-queries";

type AccountFilter = "all" | "healthy" | "held" | "critical";

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
      className="inline-flex items-center gap-1 font-medium hover:text-zinc-200"
    >
      {children}
      <ChevronsUpDown className="h-3 w-3" />
    </button>
  );
}

function StatusChip({ tone, label }: { tone: Tone; label: string }) {
  const styles =
    tone === "good"
      ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
      : tone === "warn"
        ? "border-amber-500/40 text-amber-200 bg-amber-500/10"
        : "border-red-500/40 text-red-300 bg-red-500/10";
  const Icon = tone === "good" ? ShieldCheck : AlertTriangle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium uppercase ${styles}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

export function AccountsTable({
  accounts,
  issueCounts,
  isLoading,
}: {
  accounts: AccountRow[];
  issueCounts: DataIssueCount[];
  isLoading: boolean;
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
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onClick={(event) => event.stopPropagation()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
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
              <div className="font-medium text-zinc-100 hover:text-emerald-300">
                {row.original.name}
              </div>
              {meta && (
                <div className="mt-0.5 max-w-[220px] truncate text-[11px] text-zinc-500">
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
          <span className="text-zinc-400">{row.original.industry ?? "-"}</span>
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
              ? "bg-emerald-500"
              : tone === "warn"
                ? "bg-amber-500"
                : "bg-red-500";
          const text =
            tone === "good"
              ? "text-emerald-400"
              : tone === "warn"
                ? "text-amber-400"
                : "text-red-400";
          return (
            <div className="flex min-w-40 items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
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
          <span className="font-mono tabular-nums text-zinc-300">
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
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-amber-300">
                  {gaps}
                </span>
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
              <button
                type="button"
                onClick={() => openAccount(account)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                  healthy
                    ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
                    : "border border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                }`}
              >
                {healthy ? (
                  <ShieldCheck className="h-3.5 w-3.5" />
                ) : (
                  <Wrench className="h-3.5 w-3.5" />
                )}
                {healthy ? "Playbook" : "Review gaps"}
              </button>
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <label htmlFor="account-search" className="sr-only">
            Search accounts
          </label>
          <input
            id="account-search"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            placeholder="Search accounts..."
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none sm:max-w-xs"
          />
          <select
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
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All accounts</option>
            <option value="healthy">Healthy</option>
            <option value="held">Held</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{selectedCount} selected</span>
          <details className="relative">
            <summary className="cursor-pointer rounded-md border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800">
              Columns
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-zinc-800 bg-zinc-950 p-2 shadow-xl">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
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
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="text-left text-[11px] uppercase tracking-wide text-zinc-500"
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
            <tbody className="divide-y divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 7 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-3">
                        <div className="h-4 rounded bg-zinc-800/80 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-800/40 data-[selected=true]:bg-zinc-800/70"
                    data-selected={row.getIsSelected()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={table.getVisibleLeafColumns().length}
                    className="px-4 py-10 text-center text-xs text-zinc-500"
                  >
                    <Building2 className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                    No accounts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <DataIssuesPanel account={gapsFor} onClose={() => setGapsFor(null)} />
      <ReceiptPanel account={receiptFor} onClose={() => setReceiptFor(null)} />
    </div>
  );
}
