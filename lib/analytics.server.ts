/**
 * Server-side analytics tracking using posthog-node.
 * This module must only be imported in Server Components, API routes, and
 * Inngest functions — never in client components.
 */
import type { AnalyticsEvent } from "./analytics";

export async function trackServer(ev: AnalyticsEvent, distinctId: string) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!key) return;

  try {
    const { PostHog } = await import("posthog-node");
    const client = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
    const { event, properties } = ev as {
      event: string;
      properties?: Record<string, unknown>;
    };
    client.capture({ distinctId, event, properties: properties ?? {} });
    await client.shutdown();
  } catch {
    // Analytics must never break the main path.
  }
}
