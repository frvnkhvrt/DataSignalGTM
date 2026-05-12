import { NextResponse } from "next/server";
import { applySignalRulesForOrg } from "@/lib/rules/signal-rules";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";

export async function POST() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = createAdminClient();
  const result = await applySignalRulesForOrg({
    db,
    orgId: auth.org.id,
  });

  return NextResponse.json(result);
}
