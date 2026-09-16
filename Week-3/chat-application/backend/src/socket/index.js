import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import registerConversationHandlers from "./handlers/conversationHandlers.js";
import registerMessageHandlers from "./handlers/messageHandlers.js";

// Create the Socket.IO server
// Attach Socket.IO to this HTTP server
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://chat-app-frontend-flame.vercel.app",
      ],
      credentials: true,
    },
  });

  // Authenticate every socket connection using the existing JWT system
  // auth middleware: This runs once when a socket is establishing its connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication error: no token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  // This runs only after middleware successfully calls next()
  io.on("connection", (socket) => {
    console.log(`Socket connected: user ${socket.userId}, socket ${socket.id}`);

    registerConversationHandlers(io, socket);
    registerMessageHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: user ${socket.userId}, socket ${socket.id}`,
      );
    });
  });

  return io;
};

export default initSocket;
