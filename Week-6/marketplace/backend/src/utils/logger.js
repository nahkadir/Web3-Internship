import winston from "winston";
import { env } from "../config/env.js";

const isProd = env.nodeEnv === "production";

export const logger = winston.createLogger({
  level: isProd ? "http" : "debug", // "http" is the level Morgan's request lines use
  silent: env.nodeEnv === "test", // keeps test output clean
  format: winston.format.combine(
    winston.format.timestamp(),
    isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
  ),
  transports: [new winston.transports.Console()],
});
