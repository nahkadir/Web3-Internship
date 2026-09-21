import { getConversationMessages } from "../services/messageService.js";

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page, limit } = req.query;

    const result = await getConversationMessages(conversationId, req.user._id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 30,
    });

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
