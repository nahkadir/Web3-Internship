const registerTypingHandlers = (io, socket) => {
  socket.on("typing_start", ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit("typing_start", {
      userId: socket.userId,
      conversationId,
    });
  });

  // socket.to() broadcasts to the room excluding the sender

  socket.on("typing_stop", ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(conversationId).emit("typing_stop", {
      userId: socket.userId,
      conversationId,
    });
  });
};

export default registerTypingHandlers;
