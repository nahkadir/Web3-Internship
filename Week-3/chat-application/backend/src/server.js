import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import express from "express";
import cors from "cors";
// cors tells the browser requests from which frontend are allowed to access the backend
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import healthRoutes from "./routes/health.js";
import errorHandler from "./middleware/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";

dotenv.config();
// reads the .env so that code can use it like process.env.MONGO_URI
connectDB();
// connects to the db

const app = express();
// create express application - main backend application that receives HTTP requests

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chat-app-frontend-flame.vercel.app",
    ],
  }),
);
app.use(express.json());

app.use("/api/health", healthRoutes);
// router is imported & mounted at /api/health
app.use("/api/auth", authRoutes);
// So when POST /api/auth/register comes in, Express matches /api/auth and goes to auth.js and then to router.post("/register", register) which runs the register controller.
app.use("/api/users", userRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

const server = createServer(app); // wrap Express app in HTTP server

// Create the Socket.IO server
// Attach Socket.IO to this HTTP server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-app-frontend-flame.vercel.app",
    ],
  },
});

// auth middleware: This runs once when a socket is establishing its connection
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// This runs only after middleware successfully calls next()
io.on("connection", (socket) => {
  console.log(`User ${socket.userId} connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
