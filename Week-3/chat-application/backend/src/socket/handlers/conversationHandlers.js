import { verifyConversationMembership } from "../../services/conversationService.js";

const registerConversationHandlers = (io, socket) => {
  socket.on("join_conversation", async ({ conversationId }) => {
    try {
      if (!conversationId) {
        return socket.emit("error", { message: "conversationId is required" });
      }

      const isMember = await verifyConversationMembership(
        conversationId,
        socket.userId,
      );

      if (!isMember) {
        return socket.emit("error", {
          message: "You are not a member of this conversation",
        });
      }

      socket.join(conversationId);
      // track which room this socket is actively viewing
      socket.activeConversationId = conversationId;

      socket.emit("joined_conversation", { conversationId });
      console.log(`User ${socket.userId} joined room ${conversationId}`);
    } catch (err) {
      socket.emit("error", { message: "Failed to join conversation" });
    }
  });

  socket.on("leave_conversation", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(conversationId);

    if (socket.activeConversationId === conversationId) {
      // clear tracked room on leave
      socket.activeConversationId = null;
    }

    console.log(`User ${socket.userId} left room ${conversationId}`);
  });
};

export default registerConversationHandlers;
