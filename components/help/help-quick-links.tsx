import Link from "next/link";
import { Radio, Webhook } from "lucide-react";

/** Shortcuts shown on the Getting Started hub only — keeps other help pages focused. */
export function HelpQuickLinks() {
  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2">
      <Link
        href="/help/signals"
        className="ds-focus-ring ds-pressable group rounded-xl border border-border/70 bg-card/70 p-4 shadow-soft backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] ds-card-inner-glow hover:border-primary/20 hover:bg-surface-elevated/80 hover:shadow-elevated motion-reduce:transition-none"
      >
        <Radio className="h-4 w-4 text-primary" strokeWidth={2} />
        <div className="mt-2 text-sm font-medium text-foreground">
          Understand signal lifecycle
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Status, playbooks, rules, and what reps should do next.
        </p>
      </Link>
      <Link
        href="/help/webhook"
        className="ds-focus-ring ds-pressable group rounded-xl border border-border/70 bg-card/70 p-4 shadow-soft backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-[var(--ds-duration-tactile)] ease-[var(--ease-premium)] ds-card-inner-glow hover:border-primary/20 hover:bg-surface-elevated/80 hover:shadow-elevated motion-reduce:transition-none"
      >
        <Webhook className="h-4 w-4 text-primary" strokeWidth={2} />
        <div className="mt-2 text-sm font-medium text-foreground">
          Connect signal sources
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Endpoint, auth, schema, and cURL examples for ingestion.
        </p>
      </Link>
    </div>
  );
}
