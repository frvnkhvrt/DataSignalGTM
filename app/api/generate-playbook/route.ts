import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a GTM playbook specialist. Given an account profile and buyer signal, generate a personalized outreach playbook.
Return ONLY valid JSON, no markdown, no preamble.
Schema: {"role_target": string, "rationale": string, "channels": [string], "steps": [{"day": int, "channel": string, "action": string, "message_hint": string}]}`;

const requestSchema = z.object({
  account_name: z.string().min(1),
  industry: z.string().nullable().optional(),
  employee_count: z.number().int().nullable().optional(),
  data_quality_score: z.number().int().min(0).max(100).nullable().optional(),
  icp_fit_score: z.number().int().min(0).max(100).nullable().optional(),
  why_now: z.string().min(1),
  velocity_score: z.number().int().min(0).max(100).nullable().optional(),
  fit_score: z.number().int().min(0).max(100).nullable().optional(),
  intent_score: z.number().int().min(0).max(100).nullable().optional(),
  timing_score: z.number().int().min(0).max(100).nullable().optional(),
  composite_score: z.number().int().min(0).max(100).nullable().optional(),
});

export type GeneratePlaybookRequest = z.infer<typeof requestSchema>;

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

export type GeneratePlaybookResponse = z.infer<typeof playbookSchema>;

function buildUserMessage(input: GeneratePlaybookRequest): string {
  const parts = [
    `Account: ${input.account_name}`,
    input.industry ? `Industry: ${input.industry}` : null,
    input.employee_count
      ? `Size: ${input.employee_count} employees`
      : null,
    `Signal: ${input.why_now}`,
    input.data_quality_score != null
      ? `Data quality score: ${input.data_quality_score}/100`
      : null,
    input.icp_fit_score != null
      ? `ICP fit score: ${input.icp_fit_score}/100`
      : null,
    input.velocity_score != null
      ? `Velocity score: ${input.velocity_score}/100`
      : null,
    input.fit_score != null
      ? `Fit score: ${input.fit_score}/100`
      : null,
    input.intent_score != null
      ? `Intent score: ${input.intent_score}/100`
      : null,
    input.timing_score != null
      ? `Timing score: ${input.timing_score}/100`
      : null,
    input.composite_score != null
      ? `Composite score: ${input.composite_score}/100`
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
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error: "Playbook generation is unavailable. GEMINI_API_KEY is not configured.",
      },
      { status: 503 }
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

  const input = parsed.data;
  const userMessage = buildUserMessage(input);

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userMessage);
    const rawText = result.response.text();
    const jsonText = extractJson(rawText);

    let playbookData: unknown;
    try {
      playbookData = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        {
          error: "Gemini returned invalid JSON.",
          raw: jsonText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const validated = playbookSchema.safeParse(playbookData);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Gemini returned JSON that does not match the playbook schema.",
          details: validated.error.flatten().fieldErrors,
          raw: playbookData,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error during generation.";
    console.error("[generate-playbook]", message);
    return NextResponse.json(
      { error: "Playbook generation failed.", detail: message },
      { status: 500 }
    );
  }
}
