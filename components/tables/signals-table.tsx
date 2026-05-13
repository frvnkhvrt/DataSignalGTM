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
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
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
import { TableColumnsMenu } from "@/components/tables/table-columns-menu";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <Spinner size="sm" />
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
        cell: ({ row }) => {
          const name = row.original.account_name ?? "-";
          return (
            <button
              type="button"
              onClick={() =>
                row.original.account_name &&
                setReceiptFor({ name: row.original.account_name })
              }
              className="ds-focus-ring min-w-0 max-w-[12rem] truncate rounded-md text-left text-sm font-medium text-foreground transition-[color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] hover:text-primary sm:max-w-[16rem]"
              title={name}
            >
              {name}
            </button>
          );
        },
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
          <span
            className="line-clamp-2 min-w-0 max-w-[12rem] text-muted-foreground sm:max-w-[16rem]"
            title={row.original.why_now ?? undefined}
          >
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
                      <Spinner size="md" />
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
    <div className="min-w-0 space-y-4">
      <div role="status" aria-live="polite" className="sr-only">
        {isRefetching
          ? "Refreshing signals."
          : `${visibleRowCount} signals shown. ${selectedSignals.length} selected.`}
      </div>
      <Card className="relative flex min-w-0 flex-col gap-3 overflow-hidden bg-card/80 p-3 ds-card-inner-glow md:flex-row md:items-center md:justify-between md:gap-4">
        {isRefetching && (
          <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
            <div className="ds-refetch-stripe" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
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
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => table.getColumn("status")?.setFilterValue(value)}
          >
            <SelectTrigger
              aria-label="Filter signal status"
              className="w-full min-w-0 sm:max-w-[200px]"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6}>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="held">Held</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
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
              <span className="rounded-full border border-border/80 bg-background/45 px-2 py-1 text-xs tabular-nums text-muted-foreground transition-[border-color,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] ds-inset-top-mid">
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
          <TableColumnsMenu table={table} />
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden bg-card/80 p-0 ds-card-inner-glow" aria-busy={isLoading || isRefetching}>
        <div className="min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <Table className="min-w-[820px]">
            <TableHeader className="sticky top-0 z-10 isolate border-b border-border/70 bg-background/[0.96] shadow-[0_6px_16px_-8px_rgb(0_0_0/0.28)] ring-1 ring-border/15 backdrop-blur-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-0 text-left text-[11px] uppercase tracking-wide text-muted-foreground hover:bg-transparent data-[state=selected]:bg-transparent ds-chrome-divider"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-3 py-3",
                        header.column.id === "select" && "w-12",
                        header.column.id === "actions" && "w-[1%] whitespace-nowrap text-right"
                      )}
                    >
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
                  <TableSkeleton rows={6} columns={8} />
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
                          isRecentlyUpdated("signals", row.original.id) ? "ds-row-updated" : "",
                        ].join(" ")}
                        data-selected={row.getIsSelected()}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={cn(rowPadding, "align-middle")}>
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
                      className="min-w-0 px-4 py-10"
                    >
                      <EmptyState
                        density="compact"
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
                    </TableCell>
                  </TableRow>
                </motion.tbody>
              )}
            </AnimatePresence>
          </Table>
        </div>
      </Card>

      <div className="flex min-w-0 flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2">
        <span className="inline-flex min-w-0 items-center rounded-full border border-border bg-background/40 px-3 py-1 text-[11px] font-medium tabular-nums ds-inset-top-mid">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
        </span>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
