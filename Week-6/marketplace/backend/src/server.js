import mongoose from "mongoose";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

const start = async () => {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`Server running on ${env.backendUrl}`);
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();
