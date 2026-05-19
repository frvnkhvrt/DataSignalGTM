import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

type TablePageSkeletonProps = {
  titleWidth?: string;
  descriptionWidth?: string;
  actionWidth?: string;
  columns?: number;
  rows?: number;
  showKpiRow?: boolean;
};

export function TablePageSkeleton({
  titleWidth = "w-36",
  descriptionWidth = "w-72",
  actionWidth = "w-48",
  columns = 8,
  rows = 8,
  showKpiRow = false,
}: TablePageSkeletonProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className={`h-8 ${titleWidth}`} />
          <Skeleton className={`h-4 ${descriptionWidth}`} />
        </div>
        <Skeleton className={`h-8 ${actionWidth}`} />
      </div>

      {showKpiRow ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-32" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/80">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background/60">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-3 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <TableSkeleton rows={rows} columns={columns} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
