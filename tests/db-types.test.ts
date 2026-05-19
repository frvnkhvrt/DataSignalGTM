import { describe, expect, it } from "vitest";
import { isPlaybookStatus, mapSignalRow, parsePlaybook } from "@/lib/db-types";

describe("db-types", () => {
  it("parses valid playbook JSON", () => {
    const playbook = parsePlaybook({
      role_target: "VP Sales",
      rationale: "High intent",
      channels: ["Email"],
      steps: [
        {
          day: 1,
          channel: "Email",
          action: "Send",
          message_hint: "Hi",
        },
      ],
    });
    expect(playbook?.role_target).toBe("VP Sales");
  });

  it("maps signal rows with safe playbook_status fallback", () => {
    const row = mapSignalRow({
      id: "1",
      org_id: "org",
      account_name: "Acme",
      source: "webhook",
      status: "pending",
      velocity_score: 80,
      why_now: "Hiring",
      assigned_to: null,
      playbook: null,
      playbook_status: "not-a-status",
      playbook_error: null,
      created_at: null,
    });
    expect(row.playbook_status).toBe("idle");
    expect(isPlaybookStatus("queued")).toBe(true);
  });
});
