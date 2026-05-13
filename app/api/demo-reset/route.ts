import { NextRequest, NextResponse } from "next/server";
import { resetDemoDataForOrg } from "@/lib/demo-data";
import { getOptionalServerEnv } from "@/lib/env";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (auth.isDemo) {
    return NextResponse.json(
      { error: "Demo users cannot reset the shared demo workspace from admin tools." },
      { status: 403 }
    );
  }

  if (auth.org.role !== "admin") {
    return NextResponse.json(
      { error: "Only organization admins can reset demo data." },
      { status: 403 }
    );
  }

  const demoResetKey = getOptionalServerEnv("DEMO_RESET_KEY");

  if (!demoResetKey) {
    return NextResponse.json(
      { error: "Demo reset is not configured. Set DEMO_RESET_KEY on the server." },
      { status: 503 }
    );
  }

  let body: { key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.key !== demoResetKey) {
    return NextResponse.json({ error: "Invalid reset key." }, { status: 403 });
  }

  try {
    const result = await resetDemoDataForOrg(createAdminClient(), auth.org.id);

    return NextResponse.json({
      success: true,
      message: "Demo data reset to canonical state.",
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[demo-reset]", message);
    return NextResponse.json(
      { error: "Reset failed.", detail: message },
      { status: 500 }
    );
  }
}
