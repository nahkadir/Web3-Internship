import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SlaBadge } from "./Sla";

const target = (over) => ({
  state: "ON_TRACK",
  dueAt: null,
  doneAt: null,
  remainingMs: null,
  ...over,
});
const H = 3600000;

describe("SlaBadge", () => {
  it("shows how overdue a ticket is", () => {
    const sla = {
      status: "BREACHED",
      overdue: true,
      firstResponse: target({ state: "BREACHED", remainingMs: -H }),
      resolution: target({ remainingMs: 2 * H }),
    };
    render(<SlaBadge sla={sla} />);
    expect(screen.getByText("Overdue 1h 0m")).toBeInTheDocument();
  });

  it("shows the time left when on track", () => {
    const sla = {
      status: "ON_TRACK",
      overdue: false,
      firstResponse: target({ remainingMs: 3 * H }),
      resolution: target({ remainingMs: 30 * H }),
    };
    render(<SlaBadge sla={sla} />);
    expect(screen.getByText("Due in 3h 0m")).toBeInTheDocument();
  });

  it("shows Met for finished tickets and a dash when there is no SLA", () => {
    const met = {
      status: "MET",
      overdue: false,
      firstResponse: target({ state: "MET" }),
      resolution: target({ state: "MET" }),
    };
    const { rerender } = render(<SlaBadge sla={met} />);
    expect(screen.getByText("Met")).toBeInTheDocument();
    rerender(<SlaBadge sla={{ status: "N/A" }} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
