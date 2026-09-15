import { findOrCreatePrivateConversation } from "../services/conversationService.js";

export const createOrFindConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: "recipientId is required" });
    }

    const conversation = await findOrCreatePrivateConversation(
      req.user._id,
      recipientId,
    );

    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
};
