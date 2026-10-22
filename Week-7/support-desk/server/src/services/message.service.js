import TicketMessage, { MESSAGE_TYPE } from "../models/TicketMessage.js";
import { NOTIFICATION_TYPE } from "../models/Notification.js";
import { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import {
  STATUS,
  TERMINAL_STATUSES,
  MESSAGE_EDIT_WINDOW_MS,
} from "../constants/ticket.js";
import { findScoped } from "./ticketAccess.js";
import { notifyUsers, adminIds } from "./notification.service.js";
import {
  emitTo,
  ticketRoom,
  userRoom,
  removeUserFromTicket,
} from "../realtime/socket.js";

const pretty = (s) => {
  const t = s.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const store = async (data) => {
  const doc = await TicketMessage.create(data);
  await doc.populate({ path: "senderId", select: "name role" });
  return doc.toJSON();
};

const broadcastMessage = (ticketId, message) =>
  emitTo(ticketRoom(ticketId), "ticket_message", { message });

export const createSystemMessage = async (ticketId, actorId, text) => {
  const message = await store({
    ticketId,
    senderId: actorId,
    message: text,
    messageType: MESSAGE_TYPE.SYSTEM,
  });
  broadcastMessage(ticketId, message);
  return message;
};

export const recordStatusChange = async (
  ticket,
  previousStatus,
  actor,
  { notify = true } = {},
) => {
  await createSystemMessage(
    ticket._id,
    actor._id,
    `Status changed from ${pretty(previousStatus)} to ${pretty(ticket.status)}`,
  );
  emitTo(ticketRoom(ticket._id), "ticket_status_changed", {
    ticketId: String(ticket._id),
    status: ticket.status,
    previousStatus,
    changedBy: { _id: String(actor._id), name: actor.name },
  });

  if (!notify) return;
  const resolved = ticket.status === STATUS.RESOLVED;
  const others = (
    resolved ? [ticket.createdBy] : [ticket.createdBy, ticket.assignedTo]
  ).filter((id) => id && String(id) !== String(actor._id));

  await notifyUsers(others, {
    ticket,
    type: resolved
      ? NOTIFICATION_TYPE.TICKET_RESOLVED
      : NOTIFICATION_TYPE.STATUS_CHANGED,
    title: resolved
      ? `Ticket ${ticket.ticketNumber} resolved`
      : `Ticket ${ticket.ticketNumber} status updated`,
    message: resolved
      ? `${actor.name} marked "${ticket.subject}" as resolved`
      : `${actor.name} changed the status to ${pretty(ticket.status)}`,
  });
};

export const recordAssignment = async (
  ticket,
  agent,
  previousAgentId,
  actor,
) => {
  if (previousAgentId) removeUserFromTicket(previousAgentId, ticket._id);

  await createSystemMessage(
    ticket._id,
    actor._id,
    previousAgentId
      ? `Ticket reassigned to ${agent.name}`
      : `Ticket assigned to ${agent.name}`,
  );

  const rooms = [ticketRoom(ticket._id), userRoom(agent.id)];
  if (previousAgentId) rooms.push(userRoom(previousAgentId));
  emitTo(rooms, "ticket_assigned", {
    ticketId: String(ticket._id),
    assignedTo: { _id: agent.id, name: agent.name },
  });

  await notifyUsers([agent.id], {
    ticket,
    type: NOTIFICATION_TYPE.TICKET_ASSIGNED,
    title: `Ticket assigned to you: ${ticket.ticketNumber}`,
    message: ticket.subject,
  });
  await notifyUsers([ticket.createdBy], {
    ticket,
    type: NOTIFICATION_TYPE.TICKET_ASSIGNED,
    title: `Your ticket ${ticket.ticketNumber} was assigned`,
    message: `${agent.name} will help you with "${ticket.subject}"`,
  });
};

export const createMessage = async (user, ticketId, text) => {
  const ticket = await findScoped(user, ticketId);
  if (TERMINAL_STATUSES.includes(ticket.status)) {
    throw new ApiError(
      409,
      "This ticket is closed. New messages cannot be sent",
    );
  }

  const message = await store({
    ticketId: ticket._id,
    senderId: user._id,
    message: text,
  });
  broadcastMessage(ticket._id, message);

  const isCustomer = user.role === ROLES.CUSTOMER;
  let dirty = false;
  let previousStatus = null;

  // SLA: the first reply from an agent or admin is the "first response"
  if (!isCustomer && !ticket.firstRespondedAt) {
    const now = new Date();
    ticket.firstRespondedAt = now;
    ticket.slaFirstResponseBreached = ticket.firstResponseDueAt
      ? now > ticket.firstResponseDueAt
      : false;
    dirty = true;
  }

  // the customer answered, so the ticket is no longer waiting on them
  if (isCustomer && ticket.status === STATUS.WAITING_FOR_CUSTOMER) {
    previousStatus = ticket.status;
    ticket.status = STATUS.IN_PROGRESS;
    dirty = true;
  }

  if (dirty) await ticket.save();
  if (previousStatus)
    await recordStatusChange(ticket, previousStatus, user, { notify: false });

  const recipients = isCustomer
    ? ticket.assignedTo
      ? [ticket.assignedTo]
      : await adminIds()
    : [ticket.createdBy, ticket.assignedTo];

  await notifyUsers(
    recipients.filter((id) => id && String(id) !== String(user._id)),
    {
      ticket,
      type: NOTIFICATION_TYPE.NEW_REPLY,
      title: `New reply on ${ticket.ticketNumber}`,
      message: `${user.name}: ${text.slice(0, 100)}`,
    },
  );

  return message;
};

export const listMessages = async (user, ticketId, { limit, before }) => {
  await findScoped(user, ticketId);

  const filter = { ticketId };
  if (before) filter._id = { $lt: before };

  const docs = await TicketMessage.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("senderId", "name role");

  return {
    messages: docs
      .slice(0, limit)
      .reverse()
      .map((d) => d.toJSON()),
    hasMore: docs.length > limit,
    editWindowMs: MESSAGE_EDIT_WINDOW_MS,
  };
};

export const editMessage = async (user, ticketId, messageId, text) => {
  const ticket = await findScoped(user, ticketId);
  const doc = await TicketMessage.findOne({
    _id: messageId,
    ticketId: ticket._id,
  });
  if (!doc) throw new ApiError(404, "Message not found");

  if (doc.messageType !== MESSAGE_TYPE.USER)
    throw new ApiError(403, "System messages cannot be edited");
  if (String(doc.senderId) !== String(user._id))
    throw new ApiError(403, "You can only edit your own messages");
  if (TERMINAL_STATUSES.includes(ticket.status))
    throw new ApiError(409, "This ticket is closed");
  if (Date.now() - doc.createdAt.getTime() > MESSAGE_EDIT_WINDOW_MS) {
    throw new ApiError(403, "The edit window for this message has expired");
  }

  doc.message = text;
  doc.editedAt = new Date();
  await doc.save();
  await doc.populate({ path: "senderId", select: "name role" });

  const message = doc.toJSON();
  broadcastMessage(ticket._id, message);
  return message;
};
