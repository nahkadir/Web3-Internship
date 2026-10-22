import { PRIORITY, STATUS } from "./ticket.js";

const H = 60 * 60 * 1000;

export const SLA_TARGETS = Object.freeze({
  [PRIORITY.URGENT]: { firstResponseMs: 1 * H, resolutionMs: 4 * H },
  [PRIORITY.HIGH]: { firstResponseMs: 4 * H, resolutionMs: 24 * H },
  [PRIORITY.MEDIUM]: { firstResponseMs: 8 * H, resolutionMs: 72 * H },
  [PRIORITY.LOW]: { firstResponseMs: 24 * H, resolutionMs: 168 * H },
});

export const WARNING_MS = { firstResponse: 30 * 60 * 1000, resolution: 2 * H };

export const ACTIVE_STATUSES = [
  STATUS.OPEN,
  STATUS.IN_PROGRESS,
  STATUS.WAITING_FOR_CUSTOMER,
];

// (re)calculates deadlines for targets that are not met yet
export const applySlaDeadlines = (ticket, now = new Date()) => {
  const target = SLA_TARGETS[ticket.priority];
  const base = (ticket.createdAt ?? now).getTime();

  if (!ticket.firstRespondedAt) {
    ticket.firstResponseDueAt = new Date(base + target.firstResponseMs);
    ticket.slaFirstResponseBreached = false; // the sweep re-flags it (and notifies) if already overdue
    ticket.slaWarned.firstResponse = false;
  }
  if (!ticket.resolvedAt) {
    ticket.resolutionDueAt = new Date(base + target.resolutionMs);
    ticket.slaResolutionBreached = false;
    ticket.slaWarned.resolution = false;
  }
};

const targetState = ({ dueAt, doneAt, active, warnMs }, now) => {
  if (!dueAt)
    return {
      state: "N/A",
      dueAt: null,
      doneAt: doneAt ?? null,
      remainingMs: null,
    };
  if (doneAt)
    return {
      state: doneAt <= dueAt ? "MET" : "BREACHED",
      dueAt,
      doneAt,
      remainingMs: null,
    };
  if (!active) return { state: "N/A", dueAt, doneAt: null, remainingMs: null };
  const remainingMs = dueAt.getTime() - now.getTime();
  const state =
    remainingMs < 0
      ? "BREACHED"
      : remainingMs <= warnMs
        ? "AT_RISK"
        : "ON_TRACK";
  return { state, dueAt, doneAt: null, remainingMs };
};

// computed on the server so the frontend never decides SLA state with its own clock
export const computeSla = (ticket, now = new Date()) => {
  const active = ACTIVE_STATUSES.includes(ticket.status);
  const firstResponse = targetState(
    {
      dueAt: ticket.firstResponseDueAt,
      doneAt: ticket.firstRespondedAt,
      active,
      warnMs: WARNING_MS.firstResponse,
    },
    now,
  );
  const resolution = targetState(
    {
      dueAt: ticket.resolutionDueAt,
      doneAt: ticket.resolvedAt,
      active,
      warnMs: WARNING_MS.resolution,
    },
    now,
  );

  const states = [firstResponse.state, resolution.state];
  const status = states.includes("BREACHED")
    ? "BREACHED"
    : states.includes("AT_RISK")
      ? "AT_RISK"
      : states.includes("ON_TRACK")
        ? "ON_TRACK"
        : states.includes("MET")
          ? "MET"
          : "N/A";

  // overdue = a target that is still pending and already past its deadline
  const overdue = [firstResponse, resolution].some(
    (t) => t.state === "BREACHED" && !t.doneAt,
  );

  return { status, overdue, firstResponse, resolution, serverTime: now };
};
