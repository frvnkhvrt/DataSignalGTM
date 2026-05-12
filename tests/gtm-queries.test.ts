import { describe, expect, it } from "vitest";
import {
  ApproveRequiresPlaybookError,
  TransitionError,
  assertSignalTransition,
  type Playbook,
} from "@/lib/gtm-queries";

const playbook: Playbook = {
  role_target: "VP of Sales",
  rationale: "High-intent account with complete data.",
  channels: ["Email"],
  steps: [
    {
      day: 1,
      channel: "Email",
      action: "Send opener",
      message_hint: "Lead with the signal.",
    },
  ],
};

describe("signal transition guard", () => {
  it("requires a generated playbook before approval", () => {
    expect(() =>
      assertSignalTransition({
        accountName: "Acme",
        from: "pending",
        to: "approved",
        playbook: null,
      })
    ).toThrow(ApproveRequiresPlaybookError);
  });

  it("blocks terminal signals from changing status", () => {
    expect(() =>
      assertSignalTransition({
        accountName: "Acme",
        from: "approved",
        to: "rejected",
        playbook,
      })
    ).toThrow(TransitionError);
  });
});
