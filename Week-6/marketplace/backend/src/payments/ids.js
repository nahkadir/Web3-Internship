import crypto from "crypto";

export const rid = (prefix) =>
  `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
