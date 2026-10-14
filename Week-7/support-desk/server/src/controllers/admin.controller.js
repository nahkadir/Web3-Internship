import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminService from "../services/admin.service.js";
import * as ticketService from "../services/ticket.service.js";

export const getUsers = asyncHandler(async (req, res) => {
  const { users, pagination } = await adminService.listUsers(req.query);
  res.json({ success: true, data: { users, pagination } });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserRole(
    req.params.id,
    req.body.role,
    req.user._id,
  );
  res.json({ success: true, data: { user } });
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const data = await ticketService.listTickets(req.user, req.validated.query);
  res.json({ success: true, data });
});

export const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.assignTicket(
    req.user,
    req.params.id,
    req.body.agentId,
  );
  res.json({ success: true, data: { ticket } });
});
