import { getConversationMessages } from "../services/messageService.js";

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit, before } = req.query;

    const messages = await getConversationMessages(
      conversationId,
      req.user._id,
      {
        limit: limit ? parseInt(limit) : undefined,
        before,
      },
    );

    res.status(200).json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};
