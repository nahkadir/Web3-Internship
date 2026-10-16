import Ticket from "../models/Ticket.js";
import User, { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

// which tickets a role may even see
export const scopeFor = (user) => {
  if (user.role === ROLES.CUSTOMER) return { createdBy: user._id };
  if (user.role === ROLES.AGENT) return { assignedTo: user._id };
  return {};
};

export const findScoped = async (user, id) => {
  const ticket = await Ticket.findOne({ _id: id, ...scopeFor(user) });
  if (!ticket) throw new ApiError(404, "Ticket not found");
  return ticket;
};

// used by sockets: re-reads the user so role changes and deactivation apply immediately
export const canAccessTicket = async (userId, ticketId) => {
  if (typeof ticketId !== "string" || !/^[0-9a-fA-F]{24}$/.test(ticketId))
    return false;
  const user = await User.findById(userId);
  if (!user || !user.isActive) return false;
  return Boolean(await Ticket.exists({ _id: ticketId, ...scopeFor(user) }));
};
