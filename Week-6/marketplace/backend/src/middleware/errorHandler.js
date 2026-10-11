import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;
  let details = err.details ?? null;
  // our own AppErrors, and 4xx errors from Express/body-parser, are safe to show
  let operational =
    err.isOperational || (statusCode < 500 && err.expose === true);

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Malformed JSON in request body";
    operational = true;
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
    operational = true;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate value: resource already exists";
    operational = true;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    operational = true;
  } else if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    operational = true;
  }

  // full detail goes to the server log only (never request bodies, which may hold passwords)
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, {
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: operational ? message : "Internal server error",
    ...(details && { errors: details }),
    ...(env.nodeEnv === "development" &&
      statusCode >= 500 && { stack: err.stack }),
  });
};
