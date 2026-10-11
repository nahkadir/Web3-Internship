import { AuditLog } from "../models/AuditLog.js";
import { buildPagination } from "../utils/pagination.js";

// never throws: a logging problem must not break the action being logged
export const audit = async ({
  actor = null,
  action,
  entityType,
  entityId,
  meta = {},
}) => {
  try {
    await AuditLog.create({
      actorId: actor?._id ?? null,
      actorRole: actor?.role ?? "SYSTEM",
      action,
      entityType,
      entityId,
      meta,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

export const listAuditLogs = async ({ action, entityType, page, limit }) => {
  const filter = {};
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;

  const [docs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("actorId", "name email"),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs: docs.map((d) => {
      const { actorId, ...rest } = d.toJSON();
      return { ...rest, actor: actorId };
    }),
    pagination: buildPagination(page, limit, total),
  };
};
