"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFlags } from "@/lib/use-flags";

export function RulesEngineSync({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const flags = useFlags();
  const enabled = flags.enable_rules_engine;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function applyRules() {
      try {
        const response = await fetch("/api/rules/apply", { method: "POST" });
        if (!response.ok || cancelled) return;
        const result = (await response.json()) as { held: number };
        if (result.held > 0) {
          qc.invalidateQueries({ queryKey: ["org", orgId, "signals"] });
          qc.invalidateQueries({ queryKey: ["org", orgId, "accounts"] });
        }
      } catch {
        // Rules are advisory and should never block app navigation.
      }
    }

    applyRules();
    return () => {
      cancelled = true;
    };
  }, [orgId, qc, enabled]);

  return null;
}
