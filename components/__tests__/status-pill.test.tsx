import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "@/components/ui/status-pill";
import type { SignalStatus } from "@/types/signal";

const CASES: Array<{ status: SignalStatus; label: string }> = [
  { status: "pending", label: "Pending" },
  { status: "held", label: "Held" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
];

describe("StatusPill", () => {
  it("renders the user-facing label for each signal status", () => {
    const { rerender } = render(<StatusPill status="pending" />);

    for (const { status, label } of CASES) {
      rerender(<StatusPill status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
