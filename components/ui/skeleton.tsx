import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("ds-shimmer rounded-md", className)} />;
}

function TableSkeleton({
  rows = 6,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-3 py-3">
              <Skeleton
                className={cn(
                  "h-4",
                  cellIndex === 0 && "w-5",
                  cellIndex === 1 && "w-36",
                  cellIndex > 1 && cellIndex < columns - 1 && "w-full",
                  cellIndex === columns - 1 && "ml-auto w-20"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export { Skeleton, TableSkeleton };
