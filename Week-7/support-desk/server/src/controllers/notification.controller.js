import { asyncHandler } from "../utils/asyncHandler.js";
import * as notificationService from "../services/notification.service.js";
import { maybeRunSlaSweep } from "../services/sla.service.js";

export const list = asyncHandler(async (req, res) => {
  await maybeRunSlaSweep();
  const { page, limit, unread } = req.validated.query;
  const data = await notificationService.listNotifications(req.user._id, {
    page,
    limit,
    unread: unread === "true",
  });
  res.json({ success: true, data });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(
    req.user._id,
    req.params.id,
  );
  res.json({ success: true, data: { notification } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllRead(req.user._id);
  res.json({ success: true, data });
});
