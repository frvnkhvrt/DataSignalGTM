import { Spinner } from "@/components/ui/spinner";
import type { SignalRow } from "@/lib/db-types";

export function PlaybookState({ signal }: { signal: SignalRow }) {
  if (signal.playbook) {
    return <span className="text-[11px] font-medium text-success">Ready</span>;
  }
  if (
    signal.playbook_status === "queued" ||
    signal.playbook_status === "generating"
  ) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-primary">
        <Spinner size="sm" />
        Generating
      </span>
    );
  }
  if (signal.playbook_status === "failed") {
    return (
      <span
        className="text-[11px] text-destructive"
        title={signal.playbook_error ?? "Generation failed"}
      >
        Failed
      </span>
    );
  }
  return <span className="text-[11px] text-muted-foreground">—</span>;
}
