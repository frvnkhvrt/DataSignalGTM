import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/** Dashboard-shaped skeleton — matches the hero + metrics + charts layout. */
export default function AppLoading() {
  return (
    <div className="min-w-0 space-y-6 overflow-x-clip p-4 sm:space-y-8 sm:p-6 lg:p-8">
      <Card variant="translucent" className="p-5">
        <Skeleton className="mb-3 h-5 w-28 max-w-full" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
        <div className="mt-4 flex min-w-0 flex-wrap gap-2">
          <Skeleton className="h-9 w-32 shrink-0" />
          <Skeleton className="h-9 w-28 shrink-0" />
        </div>
      </Card>

      <div className="grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="translucent" className="p-4">
            <Skeleton className="h-full min-h-36 w-full min-w-0 rounded-lg" />
          </Card>
        ))}
      </div>

      <Card variant="translucent" className="p-4 sm:p-5">
        <Skeleton className="min-h-[20rem] w-full min-w-0 rounded-xl sm:min-h-[21rem]" />
      </Card>

      <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:gap-5 xl:gap-6">
        <Card variant="translucent" className="p-4">
          <Skeleton className="h-64 w-full min-w-0 rounded-lg" />
        </Card>
        <Card variant="translucent" className="p-4">
          <Skeleton className="h-64 w-full min-w-0 rounded-lg" />
        </Card>
      </div>
    </div>
  );
}
