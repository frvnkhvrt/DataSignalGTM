import { Skeleton } from "@/components/ui/skeleton";

/** Admin-shaped skeleton — matches the single card + reset form layout. */
export default function AdminLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Admin card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card/80">
        <div className="border-b border-border p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <div className="space-y-3 p-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}
