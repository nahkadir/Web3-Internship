import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // needed for httpOnly cookies
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
if (env.nodeEnv === "development") app.use(morgan("dev"));

app.use("/api/health", healthRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
