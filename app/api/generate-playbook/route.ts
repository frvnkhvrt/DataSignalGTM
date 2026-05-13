import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PLAYBOOK_GENERATE_EVENT, inngest } from "@/lib/inngest/client";
import { createAdminClient, getAuthContext } from "@/lib/supabase/server";

export const maxDuration = 60;

const requestSchema = z.object({
  signal_id: z.string().uuid(),
});

export type GeneratePlaybookRequest = z.infer<typeof requestSchema>;
export type GeneratePlaybookResponse = { queued: true; signal_id: string };

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (auth.isDemo) {
    return NextResponse.json(
      { error: "Demo mode is read-only for playbook generation." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const db = createAdminClient();
  const { data: signal, error: signalError } = await db
    .from("signals")
    .select("id,org_id,status")
    .eq("id", parsed.data.signal_id)
    .eq("org_id", auth.org.id)
    .maybeSingle();

  if (signalError) {
    return NextResponse.json(
      { error: "Failed to load signal.", detail: signalError.message },
      { status: 500 }
    );
  }

  if (!signal) {
    return NextResponse.json({ error: "Signal not found." }, { status: 404 });
  }

  const { error: updateError } = await db
    .from("signals")
    .update({
      playbook_status: "queued",
      playbook_error: null,
      playbook_requested_at: new Date().toISOString(),
    })
    .eq("id", signal.id)
    .eq("org_id", auth.org.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to queue playbook.", detail: updateError.message },
      { status: 500 }
    );
  }

  await inngest.send({
    name: PLAYBOOK_GENERATE_EVENT,
    data: {
      orgId: auth.org.id,
      signalId: signal.id,
      requestedBy: auth.user.id,
    },
  });

  return NextResponse.json({
    queued: true,
    signal_id: signal.id,
  } satisfies GeneratePlaybookResponse);
}
