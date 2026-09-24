import { env } from "../config/env.js";
import AppError from "../utils/AppError.js";

const normalizeError = (err) => {
  if (err instanceof AppError) return err;

  if (err.name === "CastError") {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new AppError("Validation failed", 400, errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return new AppError(`${field} already exists`, 409);
  }

  if (err.name === "JsonWebTokenError")
    return new AppError("Invalid token", 401);
  if (err.name === "TokenExpiredError")
    return new AppError("Token expired", 401);

  if (err.type === "entity.parse.failed") {
    return new AppError("Invalid JSON body", 400);
  }

  if (err.errorLabels?.includes("TransientTransactionError")) {
    return new AppError("Seats are no longer available, please try again", 409);
  }

  if (err.code === 112 || err.codeName === "WriteConflict") {
    return new AppError("Seats are no longer available, please try again", 409);
  }

  return err;
};

export const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);
  const isOperational = error instanceof AppError;
  const statusCode = isOperational ? error.statusCode : 500;

  if (!isOperational) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: isOperational ? error.message : "Internal server error",
    ...(error.errors && { errors: error.errors }),
    ...(env.nodeEnv === "development" && { stack: err.stack }),
  });
};
