import mongoose from "mongoose";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { expireUnpaidOrders } from "./services/orderLifecycle.service.js";

const start = async () => {
  try {
    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`Server running on ${env.backendUrl}`);
    });

    // cancel unpaid orders after the payment window and give their stock back
    const sweep = setInterval(
      () => {
        expireUnpaidOrders().catch((err) =>
          console.error("Order expiry sweep failed:", err.message),
        );
      },
      5 * 60 * 1000,
    );
    sweep.unref();

    process.on("SIGINT", async () => {
      clearInterval(sweep);
      await mongoose.connection.close();
      server.close(() => process.exit(0));
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

start();
