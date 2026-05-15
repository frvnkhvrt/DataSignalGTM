import * as React from "react";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
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

const STATUS_ICONS: Record<
  SignalStatus,
  React.ComponentType<{ className?: string }>
> = {
  approved: CheckCircle2,
  held: AlertTriangle,
  pending: Clock,
  rejected: XCircle,
};

/**
 * Signal lifecycle chip — single source of truth across the app.
 *
 * - Always renders a ping for `pending` so the queue feels alive.
 * - `showIcon` prepends the status icon (used in dense table cells where the
 *   ping alone is too subtle next to action buttons).
 */
export function StatusPill({
  status,
  showIcon = false,
}: {
  status: SignalStatus;
  showIcon?: boolean;
}) {
  const Icon = STATUS_ICONS[status];
  return (
    <Badge variant={STATUS_VARIANTS[status]} shape="square">
      {status === "pending" && (
        <span
          aria-hidden="true"
          className="ds-ping-dot relative inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warning/70"
        />
      )}
      {showIcon && status !== "pending" && (
        <Icon className="h-3 w-3 shrink-0" />
      )}
      {STATUS_LABELS[status]}
    </Badge>
  );
}
