import {
  findOrCreatePrivateConversation,
  createGroupConversation,
  getUserConversations,
} from "../services/conversationService.js";

export const createOrFindConversation = async (req, res, next) => {
  try {
    const { type, recipientId, name, memberIds } = req.body;

    if (type === "group") {
      const conversation = await createGroupConversation(req.user._id, {
        name,
        memberIds,
      });
      return res.status(201).json({ success: true, conversation });
    }

    if (!recipientId) {
      return res
        .status(400)
        .json({ success: false, message: "recipientId is required" });
    }

    // default: private
    const conversation = await findOrCreatePrivateConversation(
      req.user._id,
      recipientId,
    );
    res.status(200).json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
};

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await getUserConversations(req.user._id);
    res.status(200).json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
};
