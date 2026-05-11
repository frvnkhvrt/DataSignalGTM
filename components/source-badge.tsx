export function SourceBadge({ source }: { source: string | null }) {
  if (!source) return <span className="text-zinc-600">—</span>;
  const label = source.replace(/_/g, " ");
  return (
    <span
      className="inline-flex items-center rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300 max-w-[200px] truncate"
      title={label}
    >
      {label}
    </span>
  );
}
