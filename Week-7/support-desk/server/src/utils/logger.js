import { env } from "../config/env.js";

const SENSITIVE = /pass(word)?|token|secret|cookie|authorization|mongo_?uri/i;

const redact = (value, depth = 0) => {
  if (value instanceof Error)
    return { name: value.name, message: value.message };
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value && typeof value === "object" && depth < 4) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        SENSITIVE.test(k) ? "[REDACTED]" : redact(v, depth + 1),
      ]),
    );
  }
  return value;
};

const write = (level, msg, meta) => {
  if (env.nodeEnv === "test") return;
  const isObject = meta && typeof meta === "object" && !(meta instanceof Error);
  const extra =
    meta === undefined
      ? {}
      : isObject
        ? redact(meta)
        : { detail: redact(meta) };
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    msg,
    ...extra,
  });
  (level === "error"
    ? console.error
    : level === "warn"
      ? console.warn
      : console.log)(line);
};

export const logger = {
  info: (msg, meta) => write("info", msg, meta),
  warn: (msg, meta) => write("warn", msg, meta),
  error: (msg, meta) => write("error", msg, meta),
};
