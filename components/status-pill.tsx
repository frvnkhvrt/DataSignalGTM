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

export function StatusPill({ status }: { status: SignalStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} shape="square">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
