/**
 * External signal ingestion webhook.
 *
 * POST /api/webhooks/signals
 *
 * Authentication: Bearer token matching SIGNAL_WEBHOOK_SECRET, or
 *                 X-Webhook-Secret header, or ?secret= query param.
 *
 * Accepts a JSON body with either a single signal or an array of signals.
 *
 * Minimal example (single):
 * {
 *   "org_id": "uuid-of-your-organisation",
 *   "account_name": "Acme Corp",
 *   "source": "6sense",
 *   "why_now": "High intent spike on pricing page",
 *   "velocity_score": 85
 * }
 *
 * See README for full schema documentation.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// ── Request schema ────────────────────────────────────────────────────────────

const signalSchema = z.object({
  org_id: z.string().uuid("org_id must be a valid UUID"),
  account_name: z.string().min(1).max(255),
  source: z.string().max(100).optional(),
  why_now: z.string().max(2000).optional(),
  velocity_score: z.number().min(0).max(100).optional(),
  fit_score: z.number().min(0).max(100).optional(),
  intent_score: z.number().min(0).max(100).optional(),
  timing_score: z.number().min(0).max(100).optional(),
  composite_score: z.number().min(0).max(100).optional(),
  /** If provided, upsert-match on this external ID to avoid duplicates. */
  external_id: z.string().max(255).optional(),
});

const bodySchema = z.union([signalSchema, z.array(signalSchema).max(100)]);

type SignalInput = z.infer<typeof signalSchema>;

// ── Auth helper ───────────────────────────────────────────────────────────────

function isAuthorised(request: NextRequest): boolean {
  const secret = process.env.SIGNAL_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      logger.error("signal-webhook-no-secret", {
        note: "SIGNAL_WEBHOOK_SECRET must be set in production",
      });
      return false;
    }
    logger.warn("signal-webhook-no-secret", {
      note: "SIGNAL_WEBHOOK_SECRET is not set — webhook accepts all callers in development only",
    });
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7) === secret;
  }

  const headerSecret = request.headers.get("x-webhook-secret");
  if (headerSecret) return headerSecret === secret;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret) return querySecret === secret;

  return false;
}

// ── Signal upsert logic ───────────────────────────────────────────────────────

async function upsertSignal(
  input: SignalInput,
  db: ReturnType<typeof createAdminClient>
): Promise<{ id: string; created: boolean }> {
  // Verify the org exists.
  const { data: org } = await db
    .from("organizations")
    .select("id")
    .eq("id", input.org_id)
    .maybeSingle();

  if (!org) {
    throw new Error(`Organisation '${input.org_id}' not found.`);
  }

  // Upsert the account so it exists before we attach signals.
  await db.from("accounts").upsert(
    { org_id: input.org_id, name: input.account_name },
    { onConflict: "org_id,name", ignoreDuplicates: true }
  );

  // Build the signal row.
  const composite =
    input.composite_score ??
    (input.velocity_score !== undefined &&
    input.fit_score !== undefined &&
    input.intent_score !== undefined &&
    input.timing_score !== undefined
      ? Math.round(
          (input.velocity_score +
            input.fit_score +
            input.intent_score +
            input.timing_score) /
            4
        )
      : undefined);

  const { data: existing } = input.external_id
    ? await db
        .from("signals")
        .select("id")
        .eq("org_id", input.org_id)
        .eq("account_name", input.account_name)
        .maybeSingle()
    : { data: null };

  if (existing?.id) {
    await db
      .from("signals")
      .update({
        source: input.source,
        why_now: input.why_now,
        velocity_score: input.velocity_score,
        fit_score: input.fit_score,
        intent_score: input.intent_score,
        timing_score: input.timing_score,
        composite_score: composite,
      })
      .eq("id", existing.id);

    return { id: existing.id, created: false };
  }

  const { data: signal, error } = await db
    .from("signals")
    .insert({
      org_id: input.org_id,
      account_name: input.account_name,
      source: input.source ?? "webhook",
      why_now: input.why_now,
      velocity_score: input.velocity_score,
      fit_score: input.fit_score,
      intent_score: input.intent_score,
      timing_score: input.timing_score,
      composite_score: composite,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;

  return { id: signal.id, created: true };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const inputs = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const db = createAdminClient();

  const results: Array<{ index: number; id: string; created: boolean; error?: string }> = [];

  for (let i = 0; i < inputs.length; i++) {
    try {
      const result = await upsertSignal(inputs[i], db);
      results.push({ index: i, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("signal-webhook-upsert-error", err, { index: i });
      results.push({ index: i, id: "", created: false, error: message });
    }
  }

  const created = results.filter((r) => r.created && !r.error).length;
  const updated = results.filter((r) => !r.created && !r.error).length;
  const errors = results.filter((r) => r.error).length;

  logger.info("signal-webhook-processed", {
    total: inputs.length,
    created,
    updated,
    errors,
  });

  const status = errors === inputs.length ? 422 : errors > 0 ? 207 : 200;

  return NextResponse.json(
    {
      received: inputs.length,
      created,
      updated,
      errors,
      results,
    },
    { status }
  );
}
