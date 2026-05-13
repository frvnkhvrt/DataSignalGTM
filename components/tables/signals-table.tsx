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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AnimatedDialog } from "@/components/ui/animated-dialog";
import type { SignalStatus } from "@/types/signal";
import { canTransition } from "@/types/signal";
import { DemoLimitedAction } from "@/components/demo/demo-limited-action";
import { AnimatePresence, motion } from "motion/react";
import {
  MotionListItem,
  transitionTableContentFade,
  transitionTableSkeletonFade,
} from "@/components/ui/motion";
import { isRecentlyUpdated } from "@/lib/realtime-glow";
import { SortButton, tableCheckboxClassName } from "@/components/tables/table-primitives";

type BulkAction = "approve" | "reject";
type Density = "comfortable" | "compact";

function signalStatus(value: string | null): SignalStatus {
  return (value ?? "pending") as SignalStatus;
}

function StatusBadge({ status }: { status: SignalStatus }) {
  if (status === "approved") {
    return (
      <Badge variant="success" shape="square">
        <CheckCircle2 className="h-3 w-3 shrink-0" /> Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge variant="destructive" shape="square">
        <XCircle className="h-3 w-3 shrink-0" /> Rejected
      </Badge>
    );
  }
  if (status === "held") {
    return (
      <Badge variant="warning" shape="square">
        <AlertTriangle className="h-3 w-3 shrink-0" /> Held
      </Badge>
    );
  }
  return (
    <Badge variant="muted" shape="square">
      <Clock className="h-3 w-3 shrink-0" /> Pending
    </Badge>
  );
}

function PlaybookState({ signal }: { signal: SignalRow }) {
  if (signal.playbook) {
    return <span className="text-[11px] font-medium text-success">Ready</span>;
  }
  if (
    signal.playbook_status === "queued" ||
    signal.playbook_status === "generating"
  ) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-primary">
        <Loader2 className="h-3 w-3 animate-spin" />
        Generating
      </span>
    );
  }
  if (signal.playbook_status === "failed") {
    return (
      <span
        className="text-[11px] text-destructive"
        title={signal.playbook_error ?? "Generation failed"}
      >
        Failed
      </span>
    );
  }
  return <span className="text-[11px] text-muted-foreground">—</span>;
}

export function SignalsTable({
  signals,
  isLoading,
  isRefetching = false,
}: {
  signals: SignalRow[];
  isLoading: boolean;
  isRefetching?: boolean;
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
  const [density, setDensity] = useState<Density>("comfortable");

  const invalidateSignals = () => {
    qc.invalidateQueries({ queryKey: ["org", org.id, "signals"] });
    qc.invalidateQueries({ queryKey: ["org", org.id, "accounts"] });
  };

  const approve = useMutation({
    mutationFn: (name: string) => approveSignal(org.id, name),
    onSuccess: (_data, name) => {
      invalidateSignals();
      toast.success("Signal approved", {
        description: name,
        action: {
          label: "View",
          onClick: () => setReceiptFor({ name }),
        },
      });
    },
    onError: (error) => {
      if (isApproveRequiresPlaybookError(error)) toast.error(error.message);
      else if (isTransitionError(error)) toast.info(error.message);
      else toast.error(error instanceof Error ? error.message : "Approve failed");
    },
  });

  const reject = useMutation({
    mutationFn: (name: string) => rejectSignal(org.id, name),
    onSuccess: (_data, name) => {
      invalidateSignals();
      toast.success("Signal rejected", { description: name });
    },
    onError: (error) =>
      isTransitionError(error)
        ? toast.info(error.message)
        : toast.error(error instanceof Error ? error.message : "Reject failed"),
  });

  const generate = useMutation({
    mutationFn: (signalId: string) => generatePlaybookForSignal(org.id, signalId),
    onSuccess: () => {
      invalidateSignals();
      toast.success("Playbook generation queued", {
        description: "We will update the table when the playbook is ready.",
      });
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
      toast.success(
        `${action === "approve" ? "Approved" : "Rejected"} ${count} signal(s)`,
        {
          description:
            action === "approve"
              ? "Approved signals are ready for follow-up."
              : "Rejected signals were removed from the active queue.",
        }
      );
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
            className={tableCheckboxClassName}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.account_name ?? "signal"}`}
            checked={row.getIsSelected()}
            onClick={(event) => event.stopPropagation()}
            onChange={row.getToggleSelectedHandler()}
            className={tableCheckboxClassName}
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
            className="ds-focus-ring rounded-md text-left font-medium text-foreground transition-[color] duration-[160ms] ease-[var(--ease-premium)] hover:text-primary"
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
          <span className="line-clamp-2 text-muted-foreground">
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
          <span className="font-mono tabular-nums text-foreground">
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
                <DemoLimitedAction action="generate_playbook" surface="signals_table">
                  <Button
                    type="button"
                    onClick={() => generate.mutate(signal.id)}
                    disabled={
                      busyPlaybook ||
                      (generate.isPending && generate.variables === signal.id)
                    }
                    title="Generate playbook"
                    aria-label={`Generate playbook for ${name || "signal"}`}
                    variant="success"
                    size="icon"
                  >
                    {busyPlaybook ||
                    (generate.isPending && generate.variables === signal.id) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </DemoLimitedAction>
              )}
              {canApprove && name && (
                <DemoLimitedAction action="approve_signal" surface="signals_table">
                  <Button
                    type="button"
                    onClick={() => approve.mutate(name)}
                    disabled={approve.isPending && approve.variables === name}
                    aria-label={`Approve signal for ${name}`}
                    size="sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                </DemoLimitedAction>
              )}
              {canReject && name && (
                <DemoLimitedAction action="reject_signal" surface="signals_table">
                  <Button
                    type="button"
                    onClick={() => reject.mutate(name)}
                    disabled={reject.isPending && reject.variables === name}
                    aria-label={`Reject signal for ${name}`}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </DemoLimitedAction>
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
  const rowPadding = density === "compact" ? "px-3 py-2" : "px-3 py-3";
  const visibleRowCount = table.getRowModel().rows.length;

  return (
    <div className="space-y-4">
      <div role="status" aria-live="polite" className="sr-only">
        {isRefetching
          ? "Refreshing signals."
          : `${visibleRowCount} signals shown. ${selectedSignals.length} selected.`}
      </div>
      <Card className="relative flex flex-col gap-3 overflow-hidden bg-card/80 p-3 ds-card-inner-glow md:flex-row md:items-center md:justify-between">
        {isRefetching && (
          <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
            <div className="ds-refetch-stripe" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="signal-search">
            Search signals
          </label>
          <Input
            id="signal-search"
            value={(table.getColumn("account_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("account_name")?.setFilterValue(event.target.value)
            }
            placeholder="Search accounts..."
            className="sm:max-w-xs"
          />
          <Select
            aria-label="Filter signal status"
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
            onChange={(event) =>
              table.getColumn("status")?.setFilterValue(event.target.value)
            }
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="held">Held</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
                  table.setPageSize(value === "compact" ? 12 : 8);
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
          {flags.enable_bulk_actions && (
            <>
              <span className="rounded-full border border-border bg-background/40 px-2 py-1 text-xs text-muted-foreground">
                {selectedSignals.length} selected
              </span>
              <DemoLimitedAction action="bulk_approve" surface="signals_table">
                <Button
                  type="button"
                  onClick={() => setBulkAction("approve")}
                  disabled={selectedSignals.length === 0}
                  size="sm"
                >
                  Bulk approve
                </Button>
              </DemoLimitedAction>
              <DemoLimitedAction action="bulk_reject" surface="signals_table">
                <Button
                  type="button"
                  onClick={() => setBulkAction("reject")}
                  disabled={selectedSignals.length === 0}
                  variant="destructive"
                  size="sm"
                >
                  Bulk reject
                </Button>
              </DemoLimitedAction>
            </>
          )}
          <details className="relative">
            <summary className="ds-focus-ring cursor-pointer rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] transition-[background-color,color] duration-[160ms] ease-[var(--ease-premium)] hover:bg-surface-elevated hover:text-foreground">
              Columns<span className="sr-only"> visibility controls</span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-border bg-popover p-2 shadow-elevated">
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <input
                      type="checkbox"
                      className={tableCheckboxClassName}
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

      <Card className="overflow-hidden bg-card/80 p-0 ds-card-inner-glow" aria-busy={isLoading || isRefetching}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="text-left text-[11px] uppercase tracking-wide text-muted-foreground"
                  style={{ boxShadow: "inset 0 -1px 0 0 var(--color-border), inset 0 1px 0 rgb(255 255 255 / 0.03)" }}
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
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.tbody
                  key="skeleton"
                  className="divide-y divide-border"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitionTableSkeletonFade}
                >
                  <TableSkeleton rows={6} columns={8} />
                </motion.tbody>
              ) : table.getRowModel().rows.length > 0 ? (
                <motion.tbody
                  key="content"
                  className="divide-y divide-border"
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
                          "ds-row transition-colors hover:bg-surface-elevated/70",
                          "data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-primary/12 data-[selected=true]:to-primary/4",
                          "data-[selected=true]:shadow-[inset_2px_0_0_var(--color-primary)]",
                          isRecentlyUpdated("signals", row.original.id) ? "ds-row-updated" : "",
                        ].join(" ")}
                        data-selected={row.getIsSelected()}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className={`${rowPadding} align-middle`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </MotionListItem>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              ) : (
                <motion.tbody
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transitionTableSkeletonFade}
                >
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length} className="px-4 py-10">
                      <EmptyState
                        icon={<Sparkles className="h-6 w-6" />}
                        title="No signals in this view"
                        description="Try clearing filters, widening the status selection, or queueing playbooks for fresh buying signals."
                        action={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              table.getColumn("account_name")?.setFilterValue("");
                              table.getColumn("status")?.setFilterValue("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                </motion.tbody>
              )}
            </AnimatePresence>
          </table>
        </div>
      </Card>

      <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center rounded-full border border-border bg-background/40 px-3 py-1 text-[11px] font-medium tabular-nums shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05)]">
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

      <AnimatedDialog
        open={!!bulkAction}
        onClose={() => {
          if (!bulk.isPending) setBulkAction(null);
        }}
        labelledBy="bulk-action-title"
        className="max-w-md p-5"
      >
        {bulkAction && (
          <>
            <h2 id="bulk-action-title" className="text-base font-semibold text-foreground">
              Confirm bulk {bulkAction}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will {bulkAction} {selectedNames.length} selected signal(s).
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setBulkAction(null)}
                disabled={bulk.isPending}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <DemoLimitedAction action={`bulk_${bulkAction}`} surface="signals_table">
                <Button
                  type="button"
                  onClick={() => bulk.mutate({ action: bulkAction, names: selectedNames })}
                  disabled={bulk.isPending}
                  size="sm"
                  aria-live="polite"
                >
                  {bulk.isPending ? "Working..." : "Confirm"}
                </Button>
              </DemoLimitedAction>
            </div>
          </>
        )}
      </AnimatedDialog>

      <ReceiptPanel account={receiptFor} onClose={() => setReceiptFor(null)} />
    </div>
  );
}
