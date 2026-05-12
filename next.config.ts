import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  // Silence Sentry CLI output during local builds.
  silent: !process.env.CI,

  // Upload source maps only when SENTRY_AUTH_TOKEN is present (CI/CD).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Tunnel Sentry requests through your app to avoid ad-blockers.
  tunnelRoute: "/monitoring",
});
