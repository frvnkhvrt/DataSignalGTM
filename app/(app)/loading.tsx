import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="ds-page flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-4 rounded-xl border border-border bg-card/70 p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-52" />
      </div>
    </div>
  );
}
