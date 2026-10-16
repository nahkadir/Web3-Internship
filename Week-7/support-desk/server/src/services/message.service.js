import TicketMessage, { MESSAGE_TYPE } from "../models/TicketMessage.js";
import { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import {
  STATUS,
  TERMINAL_STATUSES,
  MESSAGE_EDIT_WINDOW_MS,
} from "../constants/ticket.js";
import { findScoped } from "./ticketAccess.js";
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

// save first, then return the JSON shape that is both sent in the API response and broadcast
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

export const recordStatusChange = async (ticket, previousStatus, actor) => {
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
};

export const recordAssignment = async (
  ticket,
  agent,
  previousAgentId,
  actor,
) => {
  // revoke the previous agent's live access first so they don't receive anything further
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

  // the customer answered, so the ticket is no longer waiting on them
  if (
    user.role === ROLES.CUSTOMER &&
    ticket.status === STATUS.WAITING_FOR_CUSTOMER
  ) {
    const previous = ticket.status;
    ticket.status = STATUS.IN_PROGRESS;
    await ticket.save();
    await recordStatusChange(ticket, previous, user);
  }

  return message;
};

export const listMessages = async (user, ticketId, { limit, before }) => {
  await findScoped(user, ticketId);

  const filter = { ticketId };
  if (before) filter._id = { $lt: before };

  const docs = await TicketMessage.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1) // one extra tells us whether older messages exist
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
  broadcastMessage(ticket._id, message); // clients upsert by _id, so an edit replaces the old copy
  return message;
};
