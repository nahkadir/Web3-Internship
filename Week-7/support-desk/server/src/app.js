import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiters.js";
import { requestLogger } from "./middleware/requestLogger.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);

app.use(helmet());
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

if (env.nodeEnv === "production") app.use(requestLogger);
else if (env.nodeEnv !== "test") app.use(morgan("dev"));

// makes sure the DB is connected before handling a request (no-op once connected)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/", (req, res) =>
  res.json({ success: true, message: "Support Desk API" }),
);
app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
