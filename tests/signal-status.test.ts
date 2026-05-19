import { describe, expect, it } from "vitest";
import {
  canTransition,
  isTerminal,
  TERMINAL_STATUSES,
  toSignalStatus,
  VALID_TRANSITIONS,
  type SignalStatus,
} from "@/types/signal";

const STATUSES: SignalStatus[] = ["pending", "held", "approved", "rejected"];

describe("signal status machine", () => {
  it("allows every declared transition", () => {
    for (const [from, targets] of Object.entries(VALID_TRANSITIONS)) {
      for (const to of targets) {
        expect(canTransition(from as SignalStatus, to)).toBe(true);
      }
    }
  });

  it("blocks transitions that are not explicitly declared", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        const declared = VALID_TRANSITIONS[from].includes(to);
        expect(canTransition(from, to)).toBe(declared);
      }
    }
  });

  it("treats only approved and rejected as terminal", () => {
    for (const status of STATUSES) {
      expect(isTerminal(status)).toBe(TERMINAL_STATUSES.includes(status));
    }
  });

  it("maps unknown DB status values to pending", () => {
    expect(toSignalStatus(null)).toBe("pending");
    expect(toSignalStatus("bogus")).toBe("pending");
    expect(toSignalStatus("held")).toBe("held");
  });
});
