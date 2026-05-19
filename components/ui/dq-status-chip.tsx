import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/queries/dq-helpers";

export function DqStatusChip({ tone, label }: { tone: Tone; label: string }) {
  const variant =
    tone === "good" ? "success" : tone === "warn" ? "warning" : "destructive";
  const Icon = tone === "good" ? ShieldCheck : AlertTriangle;
  return (
    <Badge variant={variant} shape="square" className="uppercase">
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </Badge>
  );
}
