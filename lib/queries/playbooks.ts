import {
  queuePlaybookResponseSchema,
  type QueuePlaybookResponse,
} from "@/lib/api-contracts";

const _generating = new Set<string>();

export function isGeneratingPlaybook(signalId: string): boolean {
  return _generating.has(signalId);
}

export async function generatePlaybookForSignal(
  orgId: string,
  signalId: string
): Promise<QueuePlaybookResponse> {
  const key = `${orgId}:${signalId}`;
  if (_generating.has(key)) {
    throw new Error("Generation already in progress for this signal.");
  }
  _generating.add(key);
  try {
    const res = await fetch("/api/generate-playbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signal_id: signalId,
      }),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Generation failed" }));
      throw new Error(err.error || "Playbook generation failed");
    }

    const json: unknown = await res.json();
    const parsed = queuePlaybookResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error("Invalid playbook queue response.");
    }
    return parsed.data;
  } finally {
    _generating.delete(key);
  }
}
