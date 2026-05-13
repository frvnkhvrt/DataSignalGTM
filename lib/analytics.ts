/**
 * Client-safe analytics helpers.
 * This file must never import server-only packages (posthog-node, etc.)
 * For server-side tracking use `lib/analytics.server.ts`.
 */

// ── Event catalogue ────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | { event: "dashboard_viewed"; properties?: { org_id: string } }
  | { event: "demo_started"; properties: { org_id: string; created_user: boolean } }
  | {
      event: "demo_reset";
      properties: {
        org_id: string;
        accounts: number;
        signals: number;
        data_issues: number;
        playbooks: number;
      };
    }
  | {
      event: "demo_limitation_viewed";
      properties: { org_id: string; action: string; surface: string };
    }
  | { event: "account_viewed"; properties: { org_id: string; account_name: string } }
  | {
      event: "playbook_generated";
      properties: {
        org_id: string;
        signal_id: string;
        success: boolean;
        duration_ms?: number;
        model?: string;
        error?: string;
      };
    }
  | { event: "signal_approved"; properties: { org_id: string; account_name: string } }
  | { event: "signal_rejected"; properties: { org_id: string; account_name: string } }
  | { event: "bulk_approve"; properties: { org_id: string; count: number } }
  | { event: "bulk_reject"; properties: { org_id: string; count: number } }
  | {
      event: "command_palette_used";
      properties: { org_id: string; action: string };
    }
  | {
      event: "rules_engine_applied";
      properties: { org_id: string; held_count: number };
    };

// ── Client-side PostHog reference ─────────────────────────────────────────

let _posthog: import("posthog-js").PostHog | null = null;

export function getPostHog(): import("posthog-js").PostHog | null {
  return _posthog;
}

export function setPostHog(ph: import("posthog-js").PostHog) {
  _posthog = ph;
}

/** Fire a client-side analytics event. No-op when PostHog is not initialised. */
export function track(ev: AnalyticsEvent) {
  if (!_posthog) return;
  const { event, properties } = ev as {
    event: string;
    properties?: Record<string, unknown>;
  };
  _posthog.capture(event, properties);
}
