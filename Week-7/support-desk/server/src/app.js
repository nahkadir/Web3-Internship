import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
if (env.nodeEnv !== "test") app.use(morgan("dev"));

// serverless: make sure the DB is connected before handling a request (no-op if already connected)
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
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
