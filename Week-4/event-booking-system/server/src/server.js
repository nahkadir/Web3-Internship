import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

const start = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });

  process.on("unhandledRejection", (err) => {
    console.error("Unhandled rejection:", err);
    server.close(() => process.exit(1));
  });
};

start();
