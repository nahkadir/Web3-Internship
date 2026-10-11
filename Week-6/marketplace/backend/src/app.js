import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  sensitiveLimiter,
} from "./middleware/rateLimit.js";
import { logger } from "./utils/logger.js";

const app = express();

// behind Vercel's proxy: lets req.ip and secure cookies work correctly
app.set("trust proxy", env.trustProxyHops);

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));

// the webhook signature is checked against the raw bytes, so this must come BEFORE express.json()
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json", limit: "100kb" }),
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
if (env.nodeEnv !== "test") {
  app.use(
    morgan(env.nodeEnv === "production" ? "combined" : "tiny", {
      stream: { write: (line) => logger.http(line.trim()) },
    }),
  );
}

if (env.nodeEnv !== "test") {
  app.use("/api", apiLimiter);
  app.use("/api/auth/login", loginLimiter);
  app.use("/api/auth/register", registerLimiter);
  app.post(
    [
      "/api/checkout",
      "/api/orders",
      "/api/payments/create",
      "/api/admin/payments/:id/refund",
    ],
    sensitiveLimiter,
  );
}

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
