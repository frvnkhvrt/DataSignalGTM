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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { StatusPill } from "@/components/ui/status-pill";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Dialog, DialogDescription, DialogMotionContent, DialogTitle } from "@/components/ui/dialog";
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
import { SortButton } from "@/components/tables/table-primitives";
import { Checkbox } from "@/components/ui/checkbox";
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

async function runWithConcurrency<T, R>(
  items: readonly T[],
  worker: (item: T) => Promise<R>,
  concurrency = 5
): Promise<{ ok: R[]; failed: { item: T; error: unknown }[] }> {
  const ok: R[] = [];
  const failed: { item: T; error: unknown }[] = [];
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const item = items[cursor++];
        try {
          ok.push(await worker(item));
        } catch (error) {
          failed.push({ item, error });
        }
      }
    }
  );
  await Promise.all(runners);
  return { ok, failed };
}

function signalStatus(value: string | null): SignalStatus {
  return (value ?? "pending") as SignalStatus;
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
    mutationFn: (signalId: string) => approveSignal(org.id, signalId),
    onSuccess: ({ accountName }) => {
      invalidateSignals();
      toast.success("Signal approved", {
        description: accountName,
        action: {
          label: "View",
          onClick: () => setReceiptFor({ name: accountName }),
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
    mutationFn: (signalId: string) => rejectSignal(org.id, signalId),
    onSuccess: ({ accountName }) => {
      invalidateSignals();
      toast.success("Signal rejected", { description: accountName });
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
      signalIds,
    }: {
      action: BulkAction;
      signalIds: string[];
    }) => {
      const fn = action === "approve" ? approveSignal : rejectSignal;
      const { ok, failed } = await runWithConcurrency(
        signalIds,
        (id) => fn(org.id, id),
        5
      );
      return { action, ok: ok.length, failed: failed.length };
    },
    onSuccess: ({ action, ok, failed }) => {
      setRowSelection({});
      setBulkAction(null);
      invalidateSignals();
      const verb = action === "approve" ? "Approved" : "Rejected";
      if (failed === 0) {
        toast.success(`${verb} ${ok} signal(s)`, {
          description:
            action === "approve"
              ? "Approved signals are ready for follow-up."
              : "Rejected signals were removed from the active queue.",
        });
      } else {
        toast.warning(`${verb} ${ok} of ${ok + failed} signal(s)`, {
          description: `${failed} could not be ${action === "approve" ? "approved" : "rejected"} — open one to see the reason.`,
        });
      }
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
          <Checkbox
            aria-label="Select all visible signals"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.account_name ?? "signal"}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      },
      {
        accessorKey: "account_name",
        header: ({ column }) => (
          <SortButton
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
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
          <SortButton
            sorted={column.getIsSorted()}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
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
        cell: ({ row }) => (
          <StatusPill status={signalStatus(row.original.status)} showIcon />
        ),
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
              {canApprove && (
                <DemoLimitedAction action="approve_signal" surface="signals_table">
                  <Button
                    type="button"
                    onClick={() => approve.mutate(signal.id)}
                    disabled={approve.isPending && approve.variables === signal.id}
                    aria-label={`Approve signal for ${name || "signal"}`}
                    size="sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                </DemoLimitedAction>
              )}
              {canReject && (
                <DemoLimitedAction action="reject_signal" surface="signals_table">
                  <Button
                    type="button"
                    onClick={() => reject.mutate(signal.id)}
                    disabled={reject.isPending && reject.variables === signal.id}
                    aria-label={`Reject signal for ${name || "signal"}`}
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
    .rows.map((row) => row.original);
  const selectedIds = selectedSignals.map((signal) => signal.id);
  const selectedNames = selectedSignals.map(
    (signal) => signal.account_name ?? "(unnamed)"
  );
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
        <ButtonGroup className="min-h-9 w-full min-w-0 flex-1 gap-0 overflow-hidden rounded-xl border border-border/80 bg-background/45 p-0.5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition-[border-color,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none sm:w-auto sm:max-w-xl">
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
            className="h-9 min-h-9 border-0 bg-transparent shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0 sm:max-w-[14rem]"
          />
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => table.getColumn("status")?.setFilterValue(value)}
          >
            <SelectTrigger
              aria-label="Filter signal status"
              className="h-9 min-h-9 w-full min-w-[9.5rem] shrink-0 rounded-none border-0 border-l border-border/55 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0 data-[state=open]:border-border/55 sm:min-w-[11rem] sm:max-w-[200px]"
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
        </ButtonGroup>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={density}
            onValueChange={(value) => {
              if (!value) return;
              const next = value as Density;
              setDensity(next);
              table.setPageSize(next === "compact" ? 12 : 8);
            }}
            size="sm"
            spacing={0}
            className="rounded-xl border border-border/80 bg-background/45 p-0.5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition-[border-color,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none"
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
          <AnimatePresence>
            {flags.enable_bulk_actions && selectedSignals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.95, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex"
              >
                <ButtonGroup className="min-w-0 gap-0 overflow-hidden rounded-xl border border-border/80 bg-background/45 p-0.5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] transition-[border-color,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] motion-reduce:transition-none">
                  <ButtonGroupText className="shrink-0 rounded-none border-0 bg-transparent px-2 py-1.5 text-[11px] tabular-nums text-muted-foreground shadow-none">
                    {selectedSignals.length} selected
                  </ButtonGroupText>
                  <ButtonGroupSeparator className="bg-border/55" />
                  <DemoLimitedAction action="bulk_approve" surface="signals_table">
                    <Button
                      type="button"
                      onClick={() => setBulkAction("approve")}
                      size="sm"
                      className="rounded-none border-0 shadow-none"
                    >
                      Bulk approve
                    </Button>
                  </DemoLimitedAction>
                  <DemoLimitedAction action="bulk_reject" surface="signals_table">
                    <Button
                      type="button"
                      onClick={() => setBulkAction("reject")}
                      variant="destructive"
                      size="sm"
                      className="rounded-none border-0 shadow-none"
                    >
                      Bulk reject
                    </Button>
                  </DemoLimitedAction>
                </ButtonGroup>
              </motion.div>
            )}
          </AnimatePresence>
          <TableColumnsMenu table={table} />
        </div>
      </Card>

      <Card className="min-w-0 bg-card/80 p-0 ds-card-inner-glow" aria-busy={isLoading || isRefetching}>
        <div className="min-w-0 overflow-x-auto overscroll-x-contain overscroll-y-contain touch-pan-x [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] max-lg:max-h-[min(70vh,28rem)] max-lg:overflow-y-auto max-lg:rounded-b-xl">
          <Table className="min-w-[min(100%,52rem)]">
            <TableHeader className="sticky top-0 z-20 isolate border-b border-border/70 bg-background/[0.97] shadow-[0_6px_16px_-8px_rgb(0_0_0/0.28)] ring-1 ring-border/15 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 dark:supports-[backdrop-filter]:bg-background/70">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-0 text-left text-xs uppercase tracking-wide text-muted-foreground hover:bg-transparent data-[state=selected]:bg-transparent ds-chrome-divider"
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
                        className={cn(
                          "ds-row hover:bg-surface-elevated/70",
                          isRecentlyUpdated("signals", row.original.id) &&
                            "ds-row-updated"
                        )}
                        data-selected={row.getIsSelected()}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const colId = cell.column.id;
                          return (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                rowPadding,
                                "align-middle",
                                colId === "account_name" && "min-w-0",
                                (colId === "why_now" || colId === "playbook_status") &&
                                  "whitespace-normal",
                                colId === "status" && "whitespace-normal"
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          );
                        })}
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
          Showing {table.getFilteredRowModel().rows.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length}
        </span>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <ButtonGroup className="gap-0 overflow-hidden rounded-xl border border-border/80 bg-background/45 p-0.5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]">
            <Button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              size="sm"
              className="rounded-none border-0 shadow-none"
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
              className="rounded-none border-0 shadow-none"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <Dialog
        open={!!bulkAction}
        onOpenChange={(next) => {
          if (!next && !bulk.isPending) setBulkAction(null);
        }}
      >
        <DialogMotionContent
          open={!!bulkAction}
          align="center"
          showCloseButton={false}
          className="max-w-md gap-0 p-5 shadow-none"
        >
          {bulkAction && (
            <>
              <DialogTitle id="bulk-action-title" className="text-base font-semibold text-foreground">
                Confirm bulk {bulkAction}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                This will {bulkAction} {selectedNames.length} selected signal(s).
              </DialogDescription>
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
                    onClick={() => bulk.mutate({ action: bulkAction, signalIds: selectedIds })}
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
        </DialogMotionContent>
      </Dialog>

      <ReceiptPanel account={receiptFor} onClose={() => setReceiptFor(null)} />
    </div>
  );
}
