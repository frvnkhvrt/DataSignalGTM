import { NextResponse } from "next/server";
import { PLAYBOOK_GENERATE_EVENT, inngest } from "@/lib/inngest/client";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";

export const maxDuration = 300;

export async function POST() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  if (auth.org.role !== "admin") {
    return NextResponse.json(
      { error: "Only organization admins can backfill playbooks." },
      { status: 403 }
    );
  }

  const db = createAdminClient();

  const { data: signals, error: queryErr } = await db
    .from("signals")
    .select("id,playbook_status")
    .eq("org_id", auth.org.id)
    .is("playbook", null)
    .not("status", "eq", "rejected")
    .not("playbook_status", "in", "(queued,generating)");

  if (queryErr) {
    return NextResponse.json(
      { error: "Failed to query signals.", detail: queryErr.message },
      { status: 500 }
    );
  }

  if (!signals || signals.length === 0) {
    return NextResponse.json({ total: 0, queued: 0 });
  }

  const signalIds = signals.map((signal) => signal.id);
  const now = new Date().toISOString();
  const { error: updateErr } = await db
    .from("signals")
    .update({
      playbook_status: "queued",
      playbook_error: null,
      playbook_requested_at: now,
    })
    .eq("org_id", auth.org.id)
    .in("id", signalIds);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to queue playbooks.", detail: updateErr.message },
      { status: 500 }
    );
  }

  await inngest.send(
    signalIds.map((signalId) => ({
      name: PLAYBOOK_GENERATE_EVENT,
      data: {
        orgId: auth.org.id,
        signalId,
        requestedBy: auth.user.id,
      },
    }))
  );

  return NextResponse.json({
    total: signalIds.length,
    queued: signalIds.length,
  });
}
