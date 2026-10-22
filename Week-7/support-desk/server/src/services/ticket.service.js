import Ticket from "../models/Ticket.js";
import User, { ROLES } from "../models/User.js";
import { NOTIFICATION_TYPE } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import {
  STATUS,
  TERMINAL_STATUSES,
  TRANSITIONS,
  EDITABLE_FIELDS,
} from "../constants/ticket.js";
import { ACTIVE_STATUSES, computeSla } from "../constants/sla.js";
import { scopeFor, findScoped } from "./ticketAccess.js";
import { recordStatusChange, recordAssignment } from "./message.service.js";
import { notifyUsers, adminIds } from "./notification.service.js";
import { emitTo, ticketRoom } from "../realtime/socket.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const populateFor = (user) => {
  const select = user.role === ROLES.CUSTOMER ? "name" : "name email";
  return [
    { path: "createdBy", select },
    { path: "assignedTo", select },
  ];
};

const editableFieldsFor = (user, ticket) => {
  if (TERMINAL_STATUSES.includes(ticket.status)) return [];
  if (user.role === ROLES.CUSTOMER && ticket.status !== STATUS.OPEN) return [];
  return EDITABLE_FIELDS[user.role] ?? [];
};

const serialize = (ticket, user) => ({
  ...ticket.toJSON(),
  allowedStatuses: TRANSITIONS[user.role]?.[ticket.status] ?? [],
  editableFields: editableFieldsFor(user, ticket),
  sla: computeSla(ticket),
});

export const createTicket = async (
  user,
  { subject, description, category },
) => {
  const ticket = await Ticket.create({
    subject,
    description,
    category,
    createdBy: user._id,
  });

  await notifyUsers(await adminIds(), {
    ticket,
    type: NOTIFICATION_TYPE.TICKET_CREATED,
    title: `New ticket ${ticket.ticketNumber}`,
    message: `${user.name} opened "${ticket.subject}"`,
  });

  await ticket.populate(populateFor(user));
  return serialize(ticket, user);
};

export const listTickets = async (user, q) => {
  const conditions = [scopeFor(user)];

  if (q.status) conditions.push({ status: q.status });
  if (q.priority) conditions.push({ priority: q.priority });
  if (q.category) conditions.push({ category: q.category });
  if (q.assignedTo)
    conditions.push({
      assignedTo: q.assignedTo === "unassigned" ? null : q.assignedTo,
    });

  if (q.overdue === "true") {
    const now = new Date();
    conditions.push({
      status: { $in: ACTIVE_STATUSES },
      $or: [
        { firstRespondedAt: null, firstResponseDueAt: { $lt: now } },
        { resolvedAt: null, resolutionDueAt: { $lt: now } },
      ],
    });
  }

  if (q.from || q.to) {
    const range = {};
    if (q.from) range.$gte = q.from;
    if (q.to) {
      const end = new Date(q.to);
      end.setUTCHours(23, 59, 59, 999);
      range.$lte = end;
    }
    conditions.push({ createdAt: range });
  }

  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    conditions.push({ $or: [{ ticketNumber: rx }, { subject: rx }] });
  }

  const filter = { $and: conditions };
  const dir = q.order === "asc" ? 1 : -1;
  const sortField = q.sortBy === "priority" ? "priorityRank" : q.sortBy;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .sort({ [sortField]: dir, _id: dir })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate(populateFor(user)),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets: tickets.map((t) => serialize(t, user)),
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      pages: Math.ceil(total / q.limit) || 1,
    },
  };
};

export const getTicket = async (user, id) => {
  const ticket = await findScoped(user, id);
  await ticket.populate(populateFor(user));
  return serialize(ticket, user);
};

export const updateTicket = async (user, id, updates) => {
  const ticket = await findScoped(user, id);

  const forbidden = Object.keys(updates).filter(
    (f) => !EDITABLE_FIELDS[user.role].includes(f),
  );
  if (forbidden.length)
    throw new ApiError(
      403,
      `You are not allowed to edit: ${forbidden.join(", ")}`,
    );

  if (!editableFieldsFor(user, ticket).length) {
    throw new ApiError(409, "This ticket can no longer be edited");
  }

  ticket.set(updates);
  await ticket.save(); // a priority change recalculates the unmet SLA deadlines (see Ticket model hook)

  emitTo(ticketRoom(ticket._id), "ticket_updated", {
    ticketId: String(ticket._id),
    fields: Object.keys(updates),
    updatedBy: { _id: String(user._id), name: user.name },
  });

  await ticket.populate(populateFor(user));
  return serialize(ticket, user);
};

export const changeStatus = async (user, id, status) => {
  const ticket = await findScoped(user, id);

  const allowed = TRANSITIONS[user.role]?.[ticket.status] ?? [];
  if (!allowed.includes(status)) {
    const validForSomeone = TRANSITIONS.ADMIN[ticket.status]?.includes(status);
    throw validForSomeone
      ? new ApiError(
          403,
          `Your role cannot move a ticket from ${ticket.status} to ${status}`,
        )
      : new ApiError(
          400,
          `Invalid status change: ${ticket.status} to ${status}`,
        );
  }

  const previousStatus = ticket.status;
  const now = new Date();

  if (status === STATUS.RESOLVED) {
    ticket.resolvedAt = now;
    ticket.slaResolutionBreached = ticket.resolutionDueAt
      ? now > ticket.resolutionDueAt
      : false;
    if (!ticket.firstRespondedAt) {
      // resolving without a reply still counts as having responded
      ticket.firstRespondedAt = now;
      ticket.slaFirstResponseBreached = ticket.firstResponseDueAt
        ? now > ticket.firstResponseDueAt
        : false;
    }
  } else if (previousStatus === STATUS.RESOLVED && status !== STATUS.CLOSED) {
    ticket.resolvedAt = null; // reopened: the resolution target is pending again
    ticket.slaResolutionBreached = ticket.resolutionDueAt
      ? now > ticket.resolutionDueAt
      : false;
    ticket.slaWarned.resolution = false;
  }

  ticket.status = status;
  await ticket.save();
  await recordStatusChange(ticket, previousStatus, user);

  await ticket.populate(populateFor(user));
  return serialize(ticket, user);
};

export const assignTicket = async (admin, id, agentId) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  if (TERMINAL_STATUSES.includes(ticket.status)) {
    throw new ApiError(409, "Closed or cancelled tickets cannot be assigned");
  }

  const agent = await User.findOne({
    _id: agentId,
    role: ROLES.AGENT,
    isActive: true,
  });
  if (!agent) throw new ApiError(400, "Selected user is not an active agent");

  const previousAgentId = ticket.assignedTo;
  if (previousAgentId && String(previousAgentId) === agent.id) {
    await ticket.populate(populateFor(admin));
    return serialize(ticket, admin);
  }

  ticket.assignedTo = agent._id;
  await ticket.save();
  await recordAssignment(ticket, agent, previousAgentId, admin);

  await ticket.populate(populateFor(admin));
  return serialize(ticket, admin);
};
