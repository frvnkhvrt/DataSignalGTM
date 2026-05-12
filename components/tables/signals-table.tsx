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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  approveSignal,
  generatePlaybookForSignal,
  isApproveRequiresPlaybookError,
  isTransitionError,
  rejectSignal,
  type SignalRow,
} from "@/lib/gtm-queries";
import { useCurrentOrg } from "@/lib/auth-context";
import { useFlags } from "@/lib/use-flags";
import { SourceBadge } from "@/components/source-badge";
import { ReceiptPanel } from "@/components/panels/receipt-panel";
import type { SignalStatus } from "@/types/signal";
import { canTransition } from "@/types/signal";

type BulkAction = "approve" | "reject";

function signalStatus(value: string | null): SignalStatus {
  return (value ?? "pending") as SignalStatus;
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
      className="inline-flex items-center gap-1 text-left font-medium hover:text-zinc-200"
    >
      {children}
      <ChevronsUpDown className="h-3 w-3" />
    </button>
  );
}

function StatusBadge({ status }: { status: SignalStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
        <CheckCircle2 className="h-3 w-3 shrink-0" /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
        <XCircle className="h-3 w-3 shrink-0" /> Rejected
      </span>
    );
  }
  if (status === "held") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
        <AlertTriangle className="h-3 w-3 shrink-0" /> Held
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
      <Clock className="h-3 w-3 shrink-0" /> Pending
    </span>
  );
}

function PlaybookState({ signal }: { signal: SignalRow }) {
  if (signal.playbook) {
    return <span className="text-[11px] text-emerald-400">Ready</span>;
  }
  if (
    signal.playbook_status === "queued" ||
    signal.playbook_status === "generating"
  ) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Generating
      </span>
    );
  }
  if (signal.playbook_status === "failed") {
    return (
      <span
        className="text-[11px] text-red-300"
        title={signal.playbook_error ?? "Generation failed"}
      >
        Failed
      </span>
    );
  }
  return <span className="text-[11px] text-zinc-500">-</span>;
}

export function SignalsTable({
  signals,
  isLoading,
}: {
  signals: SignalRow[];
  isLoading: boolean;
}) {
  const org = useCurrentOrg();
  const qc = useQueryClient();
  const flags = useFlags();
  const [receiptFor, setReceiptFor] = useState<{ name: string } | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);

  const invalidateSignals = () => {
    qc.invalidateQueries({ queryKey: ["org", org.id, "signals"] });
    qc.invalidateQueries({ queryKey: ["org", org.id, "accounts"] });
  };

  const approve = useMutation({
    mutationFn: (name: string) => approveSignal(org.id, name),
    onSuccess: invalidateSignals,
    onError: (error) => {
      if (isApproveRequiresPlaybookError(error)) toast.error(error.message);
      else if (isTransitionError(error)) toast.info(error.message);
      else toast.error(error instanceof Error ? error.message : "Approve failed");
    },
  });

  const reject = useMutation({
    mutationFn: (name: string) => rejectSignal(org.id, name),
    onSuccess: invalidateSignals,
    onError: (error) =>
      isTransitionError(error)
        ? toast.info(error.message)
        : toast.error(error instanceof Error ? error.message : "Reject failed"),
  });

  const generate = useMutation({
    mutationFn: (signalId: string) => generatePlaybookForSignal(org.id, signalId),
    onSuccess: () => {
      invalidateSignals();
      toast.success("Playbook job queued");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Generation failed"),
  });

  const bulk = useMutation({
    mutationFn: async ({
      action,
      names,
    }: {
      action: BulkAction;
      names: string[];
    }) => {
      for (const name of names) {
        if (action === "approve") {
          await approveSignal(org.id, name);
        } else {
          await rejectSignal(org.id, name);
        }
      }
      return { action, count: names.length };
    },
    onSuccess: ({ action, count }) => {
      setRowSelection({});
      setBulkAction(null);
      invalidateSignals();
      toast.success(`${action === "approve" ? "Approved" : "Rejected"} ${count} signal(s)`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Bulk action failed");
    },
  });

  const columns = useMemo<ColumnDef<SignalRow>[]>(
    () => [
      {
        id: "select",
        enableHiding: false,
        enableSorting: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all visible signals"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.account_name ?? "signal"}`}
            checked={row.getIsSelected()}
            onClick={(event) => event.stopPropagation()}
            onChange={row.getToggleSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950"
          />
        ),
      },
      {
        accessorKey: "account_name",
        header: ({ column }) => (
          <SortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Account
          </SortButton>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() =>
              row.original.account_name &&
              setReceiptFor({ name: row.original.account_name })
            }
            className="text-left font-medium text-zinc-100 hover:text-emerald-300"
          >
            {row.original.account_name ?? "-"}
          </button>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => <SourceBadge source={row.original.source} />,
      },
      {
        accessorKey: "why_now",
        header: "Why now",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-zinc-400">
            {row.original.why_now ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "velocity_score",
        header: ({ column }) => (
          <SortButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Velocity
          </SortButton>
        ),
        cell: ({ row }) => (
          <span className="font-mono tabular-nums text-zinc-100">
            {row.original.velocity_score ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: (row, id, value) =>
          value === "all" ? true : row.getValue(id) === value,
        cell: ({ row }) => <StatusBadge status={signalStatus(row.original.status)} />,
      },
      {
        accessorKey: "playbook_status",
        header: "Playbook",
        cell: ({ row }) => <PlaybookState signal={row.original} />,
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const signal = row.original;
          const name = signal.account_name ?? "";
          const status = signalStatus(signal.status);
          const canApprove = canTransition(status, "approved");
          const canReject = canTransition(status, "rejected");
          const busyPlaybook =
            signal.playbook_status === "queued" ||
            signal.playbook_status === "generating";

          return (
            <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              {!signal.playbook && signal.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => generate.mutate(signal.id)}
                  disabled={
                    busyPlaybook ||
                    (generate.isPending && generate.variables === signal.id)
                  }
                  title="Generate playbook"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                >
                  {busyPlaybook ||
                  (generate.isPending && generate.variables === signal.id) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
              {canApprove && name && (
                <button
                  type="button"
                  onClick={() => approve.mutate(name)}
                  disabled={approve.isPending && approve.variables === name}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-400 px-2.5 py-1.5 text-xs font-medium text-zinc-950 hover:bg-emerald-300 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
              )}
              {canReject && name && (
                <button
                  type="button"
                  onClick={() => reject.mutate(name)}
                  disabled={reject.isPending && reject.variables === name}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [approve, generate, reject]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: signals,
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
      pagination: {
        pageSize: 8,
      },
    },
  });

  const selectedSignals = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)
    .filter((signal) => signal.account_name);
  const selectedNames = selectedSignals.map((signal) => signal.account_name!);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="signal-search">
            Search signals
          </label>
          <input
            id="signal-search"
            value={(table.getColumn("account_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("account_name")?.setFilterValue(event.target.value)
            }
            placeholder="Search accounts..."
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none sm:max-w-xs"
          />
          <select
            aria-label="Filter signal status"
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
            onChange={(event) =>
              table.getColumn("status")?.setFilterValue(event.target.value)
            }
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="held">Held</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {flags.enable_bulk_actions && (
            <>
              <span className="text-xs text-zinc-500">
                {selectedSignals.length} selected
              </span>
              <button
                type="button"
                onClick={() => setBulkAction("approve")}
                disabled={selectedSignals.length === 0}
                className="rounded-md bg-emerald-400 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-emerald-300 disabled:opacity-40"
              >
                Bulk approve
              </button>
              <button
                type="button"
                onClick={() => setBulkAction("reject")}
                disabled={selectedSignals.length === 0}
                className="rounded-md border border-red-500/40 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-40"
              >
                Bulk reject
              </button>
            </>
          )}
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
          <table className="w-full min-w-[980px] text-sm">
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
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
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
                    No signals match the current filters.
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

      {bulkAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => setBulkAction(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-action-title"
            className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="bulk-action-title" className="text-base font-semibold text-zinc-100">
              Confirm bulk {bulkAction}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              This will {bulkAction} {selectedNames.length} selected signal(s).
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkAction(null)}
                disabled={bulk.isPending}
                className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => bulk.mutate({ action: bulkAction, names: selectedNames })}
                disabled={bulk.isPending}
                className="rounded-md bg-emerald-400 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-emerald-300 disabled:opacity-50"
              >
                {bulk.isPending ? "Working..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptPanel account={receiptFor} onClose={() => setReceiptFor(null)} />
    </div>
  );
}
