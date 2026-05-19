import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/supabase/server";

type RouteContext = { params: Promise<Record<string, string>> };

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function withAuth(
  handler: (
    auth: NonNullable<Awaited<ReturnType<typeof getAuthContext>>>
  ) => Promise<Response>
): Promise<Response> {
  const auth = await getAuthContext();
  if (!auth) return jsonError("Unauthorized.", 401);
  return handler(auth);
}

export async function withAdmin(
  handler: (
    auth: NonNullable<Awaited<ReturnType<typeof getAuthContext>>>
  ) => Promise<Response>
): Promise<Response> {
  return withAuth(async (auth) => {
    if (auth.org.role !== "admin") {
      return jsonError("Only organization admins can perform this action.", 403);
    }
    return handler(auth);
  });
}

export async function withNonDemo(
  handler: (
    auth: NonNullable<Awaited<ReturnType<typeof getAuthContext>>>
  ) => Promise<Response>
): Promise<Response> {
  return withAuth(async (auth) => {
    if (auth.isDemo) {
      return jsonError("This action is disabled in demo mode.", 403);
    }
    return handler(auth);
  });
}

export type { RouteContext };
