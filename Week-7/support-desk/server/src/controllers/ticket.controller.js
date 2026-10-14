import { asyncHandler } from "../utils/asyncHandler.js";
import * as ticketService from "../services/ticket.service.js";

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user, req.body);
  res.status(201).json({ success: true, data: { ticket } });
});

export const listTickets = asyncHandler(async (req, res) => {
  const data = await ticketService.listTickets(req.user, req.validated.query);
  res.json({ success: true, data });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicket(req.user, req.params.id);
  res.json({ success: true, data: { ticket } });
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(
    req.user,
    req.params.id,
    req.body,
  );
  res.json({ success: true, data: { ticket } });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const ticket = await ticketService.changeStatus(
    req.user,
    req.params.id,
    req.body.status,
  );
  res.json({ success: true, data: { ticket } });
});
