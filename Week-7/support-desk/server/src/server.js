import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./realtime/socket.js";

const start = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);
    server.listen(env.port, () =>
      console.log(`Server running on port ${env.port}`),
    );
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();
