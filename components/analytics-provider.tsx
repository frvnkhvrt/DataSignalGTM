"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setPostHog } from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    let mounted = true;

    async function init() {
      const posthog = (await import("posthog-js")).default;
      if (!mounted) return;
      posthog.init(key!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // we fire manually below
        capture_pageleave: true,
        autocapture: false,
      });
      setPostHog(posthog);
    }

    void init();
    return () => {
      mounted = false;
    };
  }, []);

  // Fire pageview on every route change.
  useEffect(() => {
    const ph = (globalThis as Record<string, unknown>)["posthog"] as
      | { capture?: (event: string, props: Record<string, unknown>) => void }
      | undefined;
    ph?.capture?.("$pageview", { $current_url: window.location.href });
  }, [pathname]);

  return <>{children}</>;
}
