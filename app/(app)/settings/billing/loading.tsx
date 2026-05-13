import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Hero card */}
      <div className="rounded-2xl border border-border bg-card/70 p-5">
        <Skeleton className="mb-3 h-5 w-16" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 pt-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
