import Ticket from "../models/Ticket.js";
import { NOTIFICATION_TYPE } from "../models/Notification.js";
import { ACTIVE_STATUSES, WARNING_MS } from "../constants/sla.js";
import { notifyUsers, adminIds } from "./notification.service.js";
import { logger } from "../utils/logger.js";

const CHECKS = [
  {
    label: "First response",
    due: "firstResponseDueAt",
    pending: { firstRespondedAt: null },
    breached: "slaFirstResponseBreached",
    warned: "slaWarned.firstResponse",
    warnMs: WARNING_MS.firstResponse,
  },
  {
    label: "Resolution",
    due: "resolutionDueAt",
    pending: { resolvedAt: null },
    breached: "slaResolutionBreached",
    warned: "slaWarned.resolution",
    warnMs: WARNING_MS.resolution,
  },
];

const notifySla = async (ticket, type, title, message) =>
  notifyUsers([ticket.assignedTo, ...(await adminIds())], {
    ticket,
    type,
    title,
    message,
  });

const sweepCheck = async (c, now) => {
  const base = { status: { $in: ACTIVE_STATUSES }, ...c.pending };
  let breaches = 0;
  let warnings = 0;

  // each flag is claimed with an atomic update, so concurrent sweeps notify only once
  const overdue = await Ticket.find({
    ...base,
    [c.breached]: false,
    [c.due]: { $lt: now },
  }).limit(200);
  for (const t of overdue) {
    const claimed = await Ticket.findOneAndUpdate(
      { _id: t._id, ...c.pending, [c.breached]: false },
      { $set: { [c.breached]: true } },
    );
    if (claimed) {
      breaches++;
      await notifySla(
        claimed,
        NOTIFICATION_TYPE.SLA_BREACHED,
        `SLA breached: ${claimed.ticketNumber}`,
        `${c.label} deadline passed for "${claimed.subject}"`,
      );
    }
  }

  const atRisk = await Ticket.find({
    ...base,
    [c.breached]: false,
    [c.warned]: false,
    [c.due]: { $gte: now, $lte: new Date(now.getTime() + c.warnMs) },
  }).limit(200);
  for (const t of atRisk) {
    const claimed = await Ticket.findOneAndUpdate(
      { _id: t._id, ...c.pending, [c.warned]: false },
      { $set: { [c.warned]: true } },
    );
    if (claimed) {
      warnings++;
      await notifySla(
        claimed,
        NOTIFICATION_TYPE.SLA_WARNING,
        `SLA at risk: ${claimed.ticketNumber}`,
        `${c.label} deadline is approaching for "${claimed.subject}"`,
      );
    }
  }

  return { breaches, warnings };
};

export const runSlaSweep = async (now = new Date()) => {
  const totals = { breaches: 0, warnings: 0 };
  for (const c of CHECKS) {
    const r = await sweepCheck(c, now);
    totals.breaches += r.breaches;
    totals.warnings += r.warnings;
  }
  return totals;
};

// cheap fallback for hosts without a scheduler: at most one sweep per minute per instance
let lastRun = 0;
export const maybeRunSlaSweep = async () => {
  if (Date.now() - lastRun < 60_000) return;
  lastRun = Date.now();
  try {
    await runSlaSweep();
  } catch (err) {
    logger.error("SLA sweep failed:", err.message);
  }
};
