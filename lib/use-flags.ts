"use client";

import { useMemo } from "react";
import { getClientFlags, type FeatureFlags } from "@/lib/feature-flags";

/** Client hook: returns the feature flags injected by the server layout. */
export function useFlags(): FeatureFlags {
  return useMemo(() => getClientFlags(), []);
}
