import { findOrCreatePrivateConversation } from "../services/conversationService.js";

export const createOrFindConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res
        .status(400)
        .json({ success: false, message: "recipientId is required" });
    }

    const conversation = await findOrCreatePrivateConversation(
      req.user._id,
      recipientId,
    );
    res.status(200).json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
};
