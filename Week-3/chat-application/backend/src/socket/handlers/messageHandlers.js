import {
  createMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
} from "../../services/messageService.js";
import { getConversationMemberIds } from "../../services/conversationService.js";
import { getUserSocketIds } from "../presence.js";
import Message from "../../models/Message.js";

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

      io.to(conversationId).emit("receive_message", payload);

      // Determine delivered/read status per other member
      const memberIds = await getConversationMemberIds(conversationId);
      const otherMemberIds = memberIds.filter((id) => id !== socket.userId);

      const deliveredTo = [];
      const readBy = [];

      for (const memberId of otherMemberIds) {
        const socketIds = getUserSocketIds(memberId);
        if (socketIds.size === 0) continue; // offline — stays "sent"

        deliveredTo.push(memberId);

        const isViewing = [...socketIds].some((sid) => {
          const s = io.sockets.sockets.get(sid);
          return s?.activeConversationId === conversationId;
        });

        if (isViewing) readBy.push(memberId);
      }

      if (deliveredTo.length > 0 || readBy.length > 0) {
        await Message.findByIdAndUpdate(message._id, {
          $addToSet: {
            deliveredTo: { $each: deliveredTo },
            readBy: { $each: readBy },
          },
        });

        io.to(conversationId).emit("message_delivered", {
          messageId: message._id,
          deliveredTo,
        });
        if (readBy.length > 0) {
          io.to(conversationId).emit("message_read", {
            messageId: message._id,
            readBy,
          });
        }
      }
    } catch (err) {
      socket.emit("error", {
        message: err.message || "Failed to send message",
      });
    }
  });

  socket.on("mark_messages_read", async ({ conversationId }) => {
    try {
      if (!conversationId) return;

      const messageIds = await markMessagesAsRead(
        conversationId,
        socket.userId,
      );
      if (messageIds.length === 0) return;

      io.to(conversationId).emit("message_read", {
        conversationId,
        messageIds,
        readerId: socket.userId,
      });
    } catch (err) {
      socket.emit("error", {
        message: err.message || "Failed to mark messages as read",
      });
    }
  });

  socket.on("edit_message", async ({ messageId, content }) => {
    try {
      const message = await editMessage(messageId, socket.userId, content);
      io.to(message.conversationId.toString()).emit("message_edited", {
        messageId: message._id,
        content: message.content,
        edited: true,
      });
    } catch (err) {
      socket.emit("error", {
        message: err.message || "Failed to edit message",
      });
    }
  });

  socket.on("delete_message", async ({ messageId }) => {
    try {
      const message = await deleteMessage(messageId, socket.userId);
      io.to(message.conversationId.toString()).emit("message_deleted", {
        messageId: message._id,
        content: message.content,
      });
    } catch (err) {
      socket.emit("error", {
        message: err.message || "Failed to delete message",
      });
    }
  });
};

export default registerMessageHandlers;
