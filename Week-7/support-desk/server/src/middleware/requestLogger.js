import { logger } from "../utils/logger.js";

// logs method, path (no query string, no body, no headers), status, duration and user id
export const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    logger.info("request", {
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      ms: Number((process.hrtime.bigint() - start) / 1000000n),
      userId: req.user ? String(req.user._id) : undefined,
    });
  });
  next();
};
