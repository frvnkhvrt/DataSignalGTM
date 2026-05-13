export const DEMO_EMAIL = "demo@datasignalgtm.com";
export const LEGACY_LOCAL_DEMO_EMAIL = "demo@datasignalgtm.local";
export const DEMO_ORG_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_ORG_SLUG = "datasignal-demo";
export const DEMO_ORG_NAME = "DataSignal Demo";

export function isDemoEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  return normalized === DEMO_EMAIL || normalized === LEGACY_LOCAL_DEMO_EMAIL;
}

export function hasDemoAppMetadata(
  appMetadata: Record<string, unknown> | null | undefined
): boolean {
  return appMetadata?.is_demo === true;
}
