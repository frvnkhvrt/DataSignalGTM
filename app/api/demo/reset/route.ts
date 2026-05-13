import { NextResponse } from "next/server";
import { trackServer } from "@/lib/analytics.server";
import { resetDemoDataForOrg } from "@/lib/demo-data";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";

export async function POST() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!auth.isDemo) {
    return NextResponse.json(
      { error: "Only demo users can reset demo data from this endpoint." },
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
      message: "Demo data reset successfully.",
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[demo-self-reset]", message);
    return NextResponse.json(
      { error: "Reset failed.", detail: message },
      { status: 500 }
    );
  }
}
