import Ticket from "../models/Ticket.js";
import { STATUS, PRIORITY } from "../constants/ticket.js";
import { ACTIVE_STATUSES } from "../constants/sla.js";
import { maybeRunSlaSweep } from "./sla.service.js";

const DAY = 24 * 60 * 60 * 1000;

const flag = (cond) => ({ $cond: [cond, 1, 0] });
const has = (field) => ({ $gt: [field, null] }); // true only when the field holds a real value
const isActive = { $in: ["$status", ACTIVE_STATUSES] };
const pendingPast = (done, due) => ({
  $and: [{ $not: [has(done)] }, has(due), { $lt: [due, "$$NOW"] }],
});
const overdueExpr = {
  $and: [
    isActive,
    {
      $or: [
        pendingPast("$firstRespondedAt", "$firstResponseDueAt"),
        pendingPast("$resolvedAt", "$resolutionDueAt"),
      ],
    },
  ],
};
const firstResponseMs = {
  $cond: [
    has("$firstRespondedAt"),
    { $subtract: ["$firstRespondedAt", "$createdAt"] },
    null,
  ],
};
const resolutionMs = {
  $cond: [
    has("$resolvedAt"),
    { $subtract: ["$resolvedAt", "$createdAt"] },
    null,
  ],
};

const rangeOf = ({ from, to }) => {
  const end = to ? new Date(to) : new Date();
  if (to) end.setUTCHours(23, 59, 59, 999);
  const start = from ? new Date(from) : new Date(end.getTime() - 30 * DAY);
  return {
    match: { createdAt: { $gte: start, $lte: end } },
    range: { from: start, to: end },
  };
};

const round = (n) => (n == null ? null : Math.round(n));
const rate = (part, other) =>
  part + other ? Math.round((part / (part + other)) * 1000) / 10 : null;
const fill = (keys, rows) =>
  keys.map((key) => ({
    key,
    count: rows.find((r) => r._id === key)?.count ?? 0,
  }));

export const overview = async (q) => {
  await maybeRunSlaSweep();
  const { match, range } = rangeOf(q);

  const [row] = await Ticket.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: flag({ $eq: ["$status", STATUS.OPEN] }) },
        unresolved: { $sum: flag(isActive) },
        resolved: { $sum: flag(has("$resolvedAt")) },
        overdue: { $sum: flag(overdueExpr) },
        avgFirstResponseMs: { $avg: firstResponseMs },
        avgResolutionMs: { $avg: resolutionMs },
      },
    },
  ]);

  return {
    range,
    total: row?.total ?? 0,
    open: row?.open ?? 0,
    unresolved: row?.unresolved ?? 0,
    resolved: row?.resolved ?? 0,
    overdue: row?.overdue ?? 0,
    avgFirstResponseMs: round(row?.avgFirstResponseMs),
    avgResolutionMs: round(row?.avgResolutionMs),
  };
};

export const ticketStats = async (q) => {
  await maybeRunSlaSweep();
  const { match, range } = rangeOf(q);

  const [row] = await Ticket.aggregate([
    { $match: match },
    {
      $facet: {
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
        created: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: {
                    $dateTrunc: {
                      date: "$createdAt",
                      unit: q.groupBy,
                      timezone: "UTC",
                    },
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  return {
    range,
    groupBy: q.groupBy,
    byStatus: fill(Object.values(STATUS), row.byStatus),
    byPriority: fill(Object.values(PRIORITY), row.byPriority),
    created: row.created.map((r) => ({ date: r._id, count: r.count })),
  };
};

export const agentStats = async (q) => {
  await maybeRunSlaSweep();
  const { match, range } = rangeOf(q);

  const agents = await Ticket.aggregate([
    { $match: { ...match, assignedTo: { $ne: null } } },
    {
      $group: {
        _id: "$assignedTo",
        assigned: { $sum: 1 },
        active: { $sum: flag(isActive) },
        resolved: { $sum: flag(has("$resolvedAt")) },
        slaBreaches: {
          $sum: flag({
            $or: [
              { $eq: ["$slaFirstResponseBreached", true] },
              { $eq: ["$slaResolutionBreached", true] },
            ],
          }),
        },
        avgFirstResponseMs: { $avg: firstResponseMs },
        avgResolutionMs: { $avg: resolutionMs },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "agent",
      },
    },
    { $unwind: "$agent" },
    {
      $project: {
        _id: 0,
        agentId: "$_id",
        name: "$agent.name",
        assigned: 1,
        active: 1,
        resolved: 1,
        slaBreaches: 1,
        avgFirstResponseMs: 1,
        avgResolutionMs: 1,
      },
    },
    { $sort: { assigned: -1, name: 1 } },
  ]);

  return {
    range,
    agents: agents.map((a) => ({
      ...a,
      avgFirstResponseMs: round(a.avgFirstResponseMs),
      avgResolutionMs: round(a.avgResolutionMs),
    })),
  };
};

export const slaStats = async (q) => {
  await maybeRunSlaSweep();
  const { match, range } = rangeOf(q);

  const rows = await Ticket.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$priority",
        total: { $sum: 1 },
        frMet: {
          $sum: flag({
            $and: [
              has("$firstRespondedAt"),
              { $eq: ["$slaFirstResponseBreached", false] },
            ],
          }),
        },
        frBreached: {
          $sum: flag({ $eq: ["$slaFirstResponseBreached", true] }),
        },
        resMet: {
          $sum: flag({
            $and: [
              has("$resolvedAt"),
              { $eq: ["$slaResolutionBreached", false] },
            ],
          }),
        },
        resBreached: { $sum: flag({ $eq: ["$slaResolutionBreached", true] }) },
      },
    },
  ]);

  const summarize = (r) => ({
    total: r.total,
    firstResponse: {
      met: r.frMet,
      breached: r.frBreached,
      complianceRate: rate(r.frMet, r.frBreached),
      breachRate: rate(r.frBreached, r.frMet),
    },
    resolution: {
      met: r.resMet,
      breached: r.resBreached,
      complianceRate: rate(r.resMet, r.resBreached),
      breachRate: rate(r.resBreached, r.resMet),
    },
  });

  const sum = (key) => rows.reduce((acc, r) => acc + r[key], 0);
  const overall = summarize({
    total: sum("total"),
    frMet: sum("frMet"),
    frBreached: sum("frBreached"),
    resMet: sum("resMet"),
    resBreached: sum("resBreached"),
  });

  const byPriority = Object.values(PRIORITY).map((priority) => {
    const r = rows.find((x) => x._id === priority) ?? {
      total: 0,
      frMet: 0,
      frBreached: 0,
      resMet: 0,
      resBreached: 0,
    };
    return { priority, ...summarize(r) };
  });

  return { range, overall, byPriority };
};
