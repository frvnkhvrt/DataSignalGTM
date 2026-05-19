import { NextRequest, NextResponse } from "next/server";
import { trackServer } from "@/lib/analytics.server";
import { resetDemoDataForOrg } from "@/lib/demo-data";
import { getOptionalServerEnv } from "@/lib/env";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";

type ResetBody = { key?: string };

/**
 * Unified demo reset endpoint:
 * - Demo users: POST with no body (self-service reset from demo banner)
 * - Org admins: POST with { key } matching DEMO_RESET_KEY (admin tools)
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: ResetBody = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text) as ResetBody;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const hasAdminKey = Boolean(body.key?.trim());
  const demoResetKey = getOptionalServerEnv("DEMO_RESET_KEY");

  if (auth.isDemo) {
    if (hasAdminKey) {
      return NextResponse.json(
        {
          error:
            "Demo users cannot reset with an admin key. Use the demo banner reset.",
        },
        { status: 403 }
      );
    }
  } else if (hasAdminKey) {
    if (auth.org.role !== "admin") {
      return NextResponse.json(
        { error: "Only organization admins can reset demo data." },
        { status: 403 }
      );
    }

    if (!demoResetKey) {
      return NextResponse.json(
        {
          error: "Demo reset is not configured. Set DEMO_RESET_KEY on the server.",
        },
        { status: 503 }
      );
    }

    if (body.key !== demoResetKey) {
      return NextResponse.json({ error: "Invalid reset key." }, { status: 403 });
    }
  } else {
    return NextResponse.json(
      {
        error:
          "Only demo users can reset without a key, or provide a valid admin reset key.",
      },
      { status: 403 }
    );
  }

  try {
    const result = await resetDemoDataForOrg(createAdminClient(), auth.org.id);

    await trackServer(
      {
        event: "demo_reset",
        properties: {
          org_id: auth.org.id,
          accounts: result.accounts,
          signals: result.signals,
          data_issues: result.dataIssues,
          playbooks: result.playbooks,
        },
      },
      auth.user.id
    );

    return NextResponse.json({
      success: true,
      message: auth.isDemo
        ? "Demo data reset successfully."
        : "Demo data reset to canonical state.",
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
