import rateLimit from "express-rate-limit";

const limiter = (options) =>
  rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    ...options,
    message: { success: false, message: options.message },
  });

// everything under /api, except health checks and provider callbacks
export const apiLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: "Too many requests. Please slow down and try again shortly.",
  skip: (req) =>
    req.originalUrl.startsWith("/api/health") ||
    req.originalUrl.startsWith("/api/payments/webhook") ||
    req.originalUrl.startsWith("/api/mock-gateway"),
});

// only FAILED logins count, so normal users are never locked out
export const loginLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Try again in 15 minutes.",
});

export const registerLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: "Too many accounts created from this connection. Try again later.",
});

// money-moving actions
export const sensitiveLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: "Too many attempts. Please wait a minute and try again.",
});
