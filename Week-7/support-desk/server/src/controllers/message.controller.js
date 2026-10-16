import { asyncHandler } from "../utils/asyncHandler.js";
import * as messageService from "../services/message.service.js";

export const listMessages = asyncHandler(async (req, res) => {
  const data = await messageService.listMessages(
    req.user,
    req.params.id,
    req.validated.query,
  );
  res.json({ success: true, data });
});

export const createMessage = asyncHandler(async (req, res) => {
  const message = await messageService.createMessage(
    req.user,
    req.params.id,
    req.body.message,
  );
  res.status(201).json({ success: true, data: { message } });
});

export const editMessage = asyncHandler(async (req, res) => {
  const message = await messageService.editMessage(
    req.user,
    req.params.id,
    req.params.messageId,
    req.body.message,
  );
  res.json({ success: true, data: { message } });
});
