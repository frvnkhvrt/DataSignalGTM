import { Skeleton } from "@/components/ui/skeleton";

/** Dashboard-shaped skeleton — matches the hero + metrics + charts layout. */
export default function AppLoading() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Hero section */}
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <Skeleton className="mb-3 h-5 w-28" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-2 h-4 w-96" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>

      {/* Charts */}
      <Skeleton className="h-[22rem] rounded-xl" />

      {/* Bottom panels */}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
