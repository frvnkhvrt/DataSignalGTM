import { getFlags, serialiseFlags } from "@/lib/feature-flags";

/**
 * Server component that injects the resolved feature-flag map into
 * `window.__FEATURE_FLAGS__` so client components can read it without
 * an extra network round-trip.
 */
export function FeatureFlagsScript() {
  const flags = getFlags();
  const json = serialiseFlags(flags);

  return (
    <script
      id="feature-flags"
      dangerouslySetInnerHTML={{
        __html: `window.__FEATURE_FLAGS__=${json};`,
      }}
    />
  );
}
