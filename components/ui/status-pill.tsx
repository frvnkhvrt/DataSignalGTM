import type { SignalStatus } from "@/types/signal";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<SignalStatus, BadgeProps["variant"]> = {
  approved: "success",
  held: "warning",
  pending: "muted",
  rejected: "destructive",
};

const STATUS_LABELS: Record<SignalStatus, string> = {
  approved: "Approved",
  held: "Held",
  pending: "Pending",
  rejected: "Rejected",
};

/** Signal lifecycle chip — shadcn `Badge` + product ping for pending. */
export function StatusPill({ status }: { status: SignalStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} shape="square" className="max-w-full shrink-0 whitespace-nowrap">
      {status === "pending" && (
        <span
          aria-hidden="true"
          className="ds-ping-dot relative inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warning/70"
        />
      )}
      {STATUS_LABELS[status]}
    </Badge>
  );
}
