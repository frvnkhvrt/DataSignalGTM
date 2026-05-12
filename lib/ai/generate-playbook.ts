import { z } from "zod";

const SYSTEM_PROMPT = `You are a GTM playbook specialist. Given an account profile and buyer signal, generate a personalized outreach playbook.
Return ONLY valid JSON, no markdown, no preamble.
Schema: {"role_target": string, "rationale": string, "channels": [string], "steps": [{"day": int, "channel": string, "action": string, "message_hint": string}]}`;

export const playbookInputSchema = z.object({
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

export type PlaybookInput = z.infer<typeof playbookInputSchema>;

const playbookStepSchema = z.object({
  day: z.number(),
  channel: z.string(),
  action: z.string(),
  message_hint: z.string(),
});

export const playbookSchema = z.object({
  role_target: z.string(),
  rationale: z.string(),
  channels: z.array(z.string()),
  steps: z.array(playbookStepSchema),
});

export type GeneratedPlaybook = z.infer<typeof playbookSchema>;

function buildUserMessage(input: PlaybookInput): string {
  const parts = [
    `Account: ${input.account_name}`,
    input.industry ? `Industry: ${input.industry}` : null,
    input.employee_count ? `Size: ${input.employee_count} employees` : null,
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
    input.fit_score != null ? `Fit score: ${input.fit_score}/100` : null,
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
    text = text.split("```")[1] ?? text;
    if (text.startsWith("json")) {
      text = text.slice(4);
    }
  }
  return text.trim();
}

export async function generatePlaybookWithGemini({
  input,
  apiKey,
}: {
  input: PlaybookInput;
  apiKey: string;
}): Promise<GeneratedPlaybook> {
  const parsedInput = playbookInputSchema.parse(input);
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(buildUserMessage(parsedInput));
  const rawText = result.response.text();
  const jsonText = extractJson(rawText);
  const playbookData = JSON.parse(jsonText) as unknown;
  const validated = playbookSchema.safeParse(playbookData);

  if (!validated.success) {
    throw new Error("Gemini returned JSON that does not match the playbook schema.");
  }

  return validated.data;
}
