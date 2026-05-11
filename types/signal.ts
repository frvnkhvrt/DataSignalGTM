export type SignalStatus = "pending" | "held" | "approved" | "rejected";

export const TERMINAL_STATUSES: readonly SignalStatus[] = [
  "approved",
  "rejected",
] as const;

export const VALID_TRANSITIONS: Record<SignalStatus, readonly SignalStatus[]> = {
  pending: ["approved", "rejected", "held"],
  held: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

export function canTransition(from: SignalStatus, to: SignalStatus): boolean {
  return (VALID_TRANSITIONS[from] as readonly string[]).includes(to);
}

export function isTerminal(status: SignalStatus): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}
