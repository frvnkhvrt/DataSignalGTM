/**
 * Lightweight feature flags.
 *
 * Flags are sourced in priority order:
 *   1. Individual env vars: FEATURE_<FLAG_NAME>=true|false
 *   2. JSON env var FEATURE_FLAGS: '{"enable_rules_engine":false}'
 *   3. Hard-coded defaults below.
 *
 * On the server (API routes / Server Components) call `getFlags()`.
 * In client components call the `useFlags()` hook, which reads from the
 * `__FEATURE_FLAGS__` global injected by the root layout.
 *
 * To override in development, set env vars in .env.local:
 *   FEATURE_ENABLE_RULES_ENGINE=false
 */

export interface FeatureFlags {
  enable_rules_engine: boolean;
  enable_advanced_charts: boolean;
  enable_bulk_actions: boolean;
  enable_ai_usage_page: boolean;
  enable_command_palette: boolean;
}

const DEFAULTS: FeatureFlags = {
  enable_rules_engine: true,
  enable_advanced_charts: true,
  enable_bulk_actions: true,
  enable_ai_usage_page: true,
  enable_command_palette: true,
};

type FlagKey = keyof FeatureFlags;

function parseBool(value: string | undefined): boolean | undefined {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

/** Server-only: reads env vars and returns the full resolved flag map. */
export function getFlags(): FeatureFlags {
  // Parse optional JSON blob first, then individual overrides take priority.
  let fromJson: Partial<FeatureFlags> = {};
  const jsonEnv = process.env.FEATURE_FLAGS;
  if (jsonEnv) {
    try {
      fromJson = JSON.parse(jsonEnv) as Partial<FeatureFlags>;
    } catch {
      // Malformed JSON — ignore and continue with defaults.
    }
  }

  const resolved = { ...DEFAULTS, ...fromJson } as FeatureFlags;

  for (const key of Object.keys(DEFAULTS) as FlagKey[]) {
    const envKey = `FEATURE_${key.toUpperCase()}`;
    const override = parseBool(process.env[envKey]);
    if (override !== undefined) {
      resolved[key] = override;
    }
  }

  return resolved;
}

/** Serialise flags for injection into the page via a script tag. */
export function serialiseFlags(flags: FeatureFlags): string {
  return JSON.stringify(flags);
}

// ── Client-side access ────────────────────────────────────────────────────────

declare global {
  interface Window {
    __FEATURE_FLAGS__?: FeatureFlags;
  }
}

/** Returns the flags injected by the server, falling back to all-on defaults. */
export function getClientFlags(): FeatureFlags {
  if (typeof window !== "undefined" && window.__FEATURE_FLAGS__) {
    return window.__FEATURE_FLAGS__;
  }
  return DEFAULTS;
}
