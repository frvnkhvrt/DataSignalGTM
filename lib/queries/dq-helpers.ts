export type Tone = "good" | "warn" | "bad";

export function dqTone(score: number | null | undefined): Tone {
  const s = score ?? 0;
  if (s >= 90) return "good";
  if (s >= 75) return "warn";
  return "bad";
}

export function dqStatusLabel(
  score: number | null | undefined
): "HEALTHY" | "HELD" | "CRITICAL" {
  const s = score ?? 0;
  if (s >= 90) return "HEALTHY";
  if (s >= 75) return "HELD";
  return "CRITICAL";
}
