import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function SignalsLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-32" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/80">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background/60">
            <tr>
              {Array.from({ length: 8 }).map((_, i) => (
                <th key={i} className="px-3 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <TableSkeleton rows={8} columns={8} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
