import { asyncHandler } from "../utils/asyncHandler.js";
import * as analytics from "../services/analytics.service.js";

const handler = (fn) =>
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: await fn(req.validated.query) });
  });

export const overview = handler(analytics.overview);
export const tickets = handler(analytics.ticketStats);
export const agents = handler(analytics.agentStats);
export const sla = handler(analytics.slaStats);
