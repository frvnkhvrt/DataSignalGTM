"use client";

import { useRealtimeSync } from "@/lib/use-realtime";

export function RealtimeSync({ orgId }: { orgId: string }) {
  useRealtimeSync(orgId);
  return null;
}
