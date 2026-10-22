import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./realtime/socket.js";
import { startSlaWorker } from "./jobs/slaWorker.js";
import { logger } from "./utils/logger.js";

process.on("unhandledRejection", (reason) =>
  logger.error("Unhandled rejection", {
    error: reason?.message ?? String(reason),
  }),
);
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", err);
  process.exit(1); // let the host restart a process in an unknown state
});

const start = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    initSocket(server);
    server.listen(env.port, () =>
      logger.info("Server started", { port: env.port }),
    );
    if (process.env.DISABLE_SCHEDULER !== "true") startSlaWorker();

    process.on("SIGTERM", () => {
      logger.info("Shutting down");
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
