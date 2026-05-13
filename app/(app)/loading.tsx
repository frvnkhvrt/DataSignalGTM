import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/** Dashboard-shaped skeleton — matches the hero + metrics + charts layout. */
export default function AppLoading() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <Card variant="translucent" className="p-5">
        <Skeleton className="mb-3 h-5 w-28" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-2 h-4 w-96" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="translucent" className="p-4">
            <Skeleton className="h-28 w-full rounded-lg" />
          </Card>
        ))}
      </div>

      <Card variant="translucent" className="p-4">
        <Skeleton className="h-[22rem] w-full rounded-lg" />
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card variant="translucent" className="p-4">
          <Skeleton className="h-64 w-full rounded-lg" />
        </Card>
        <Card variant="translucent" className="p-4">
          <Skeleton className="h-64 w-full rounded-lg" />
        </Card>
      </div>
    </div>
  );
}
