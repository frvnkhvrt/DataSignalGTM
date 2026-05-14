import { Badge } from "@/components/ui/badge";

export function SourceBadge({ source }: { source: string | null }) {
  if (!source) return <span className="text-muted-foreground">—</span>;
  const label = source.replace(/_/g, " ");
  return (
    <Badge
      variant="muted"
      shape="square"
      className="max-w-[min(200px,42vw)] truncate sm:max-w-[200px]"
      title={label}
    >
      {label}
    </Badge>
  );
}
