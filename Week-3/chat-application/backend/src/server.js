import { createServer } from "http";
import initSocket from "./socket/index.js";

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
import conversationRoutes from "./routes/conversations.js";

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
app.use("/api/conversations", conversationRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

// wrap Express app in HTTP server
const httpServer = createServer(app);
const io = initSocket(httpServer);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
