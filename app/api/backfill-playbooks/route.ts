import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

export const maxDuration = 300;

const DEMO_RESET_KEY = process.env.DEMO_RESET_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a GTM playbook specialist. Given an account profile and buyer signal, generate a personalized outreach playbook.
Return ONLY valid JSON, no markdown, no preamble.
Schema: {"role_target": string, "rationale": string, "channels": [string], "steps": [{"day": int, "channel": string, "action": string, "message_hint": string}]}`;

const playbookStepSchema = z.object({
  day: z.number(),
  channel: z.string(),
  action: z.string(),
  message_hint: z.string(),
});

const playbookSchema = z.object({
  role_target: z.string(),
  rationale: z.string(),
  channels: z.array(z.string()),
  steps: z.array(playbookStepSchema),
});

function buildUserMessage(signal: {
  account_name: string;
  why_now: string;
  velocity_score: number | null;
  industry: string | null;
  employee_count: number | null;
  data_quality_score: number | null;
  icp_fit_score: number | null;
}): string {
  const parts = [
    `Account: ${signal.account_name}`,
    signal.industry ? `Industry: ${signal.industry}` : null,
    signal.employee_count
      ? `Size: ${signal.employee_count} employees`
      : null,
    `Signal: ${signal.why_now}`,
    signal.data_quality_score != null
      ? `Data quality score: ${signal.data_quality_score}/100`
      : null,
    signal.icp_fit_score != null
      ? `ICP fit score: ${signal.icp_fit_score}/100`
      : null,
    signal.velocity_score != null
      ? `Velocity score: ${signal.velocity_score}/100`
      : null,
    "Generate the playbook.",
  ];
  return parts.filter(Boolean).join("\n");
}

function extractJson(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.split("```")[1];
    if (text.startsWith("json")) {
      text = text.slice(4);
    }
  }
  return text.trim();
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");
  if (!DEMO_RESET_KEY || adminKey !== DEMO_RESET_KEY) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid X-Admin-Key header." },
      { status: 401 }
    );
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
      { status: 503 }
    );
  }

  const db = createAdminClient();

  const { data: signals, error: queryErr } = await db
    .from("signals")
    .select("id,account_name,why_now,velocity_score,industry,employee_count")
    .is("playbook", null)
    .not("status", "eq", "rejected");

  if (queryErr) {
    return NextResponse.json(
      { error: "Failed to query signals.", detail: queryErr.message },
      { status: 500 }
    );
  }

  if (!signals || signals.length === 0) {
    return NextResponse.json({ total: 0, succeeded: 0, failed: 0, errors: [] });
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const sig of signals) {
    const accountName = sig.account_name ?? "Unknown";
    try {
      const { data: account } = await db
        .from("accounts")
        .select("industry,employee_count,data_quality_score,icp_fit_score")
        .eq("name", accountName)
        .maybeSingle();

      const userMessage = buildUserMessage({
        account_name: accountName,
        why_now: sig.why_now || "No signal context available",
        velocity_score: sig.velocity_score ?? null,
        industry: account?.industry ?? sig.industry ?? null,
        employee_count: account?.employee_count ?? sig.employee_count ?? null,
        data_quality_score: account?.data_quality_score ?? null,
        icp_fit_score: account?.icp_fit_score ?? null,
      });

      const result = await model.generateContent(userMessage);
      const rawText = result.response.text();
      const jsonText = extractJson(rawText);

      const playbookData = JSON.parse(jsonText);
      const validated = playbookSchema.safeParse(playbookData);
      if (!validated.success) {
        throw new Error("Gemini returned JSON that does not match the playbook schema.");
      }

      const { error: updateErr } = await db
        .from("signals")
        .update({ playbook: validated.data as never })
        .eq("id", sig.id);
      if (updateErr) throw updateErr;

      succeeded++;
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${accountName}: ${message}`);
      console.error(`[backfill-playbooks] ${accountName}:`, message);
    }
  }

  return NextResponse.json({
    total: signals.length,
    succeeded,
    failed,
    errors,
  });
}
