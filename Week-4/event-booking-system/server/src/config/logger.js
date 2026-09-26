import winston from "winston";
import { env } from "./env.js";

export const logger = winston.createLogger({
  level: env.nodeEnv === "development" ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});
