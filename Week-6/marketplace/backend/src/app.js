import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));

// must come BEFORE express.json(): the webhook signature is checked against the raw bytes
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(cookieParser());
if (env.nodeEnv === "development") app.use(morgan("dev"));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
