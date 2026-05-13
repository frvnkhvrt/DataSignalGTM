import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function UsageLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/80">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background/60">
            <tr>
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <TableSkeleton rows={6} columns={5} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
