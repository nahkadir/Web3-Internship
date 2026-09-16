import { createMessage } from "../../services/messageService.js";

const registerMessageHandlers = (io, socket) => {
  socket.on("send_message", async ({ conversationId, content }) => {
    try {
      const message = await createMessage({
        conversationId,
        senderId: socket.userId,
        content,
      });

      const payload = {
        id: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      };

      // Broadcast to everyone in the room, including the sender
      io.to(conversationId).emit("receive_message", payload);
    } catch (err) {
      socket.emit("error", {
        message: err.message || "Failed to send message",
      });
    }
  });
};

export default registerMessageHandlers;
