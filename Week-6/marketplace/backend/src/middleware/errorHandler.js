import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;
  let operational = err.isOperational;

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate value: resource already exists";
    operational = true;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
    operational = true;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    operational = true;
  }

  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: operational ? message : "Internal server error",
    ...(err.details && { errors: err.details }),
    ...(env.nodeEnv === "development" &&
      statusCode === 500 && { stack: err.stack }),
  });
};
