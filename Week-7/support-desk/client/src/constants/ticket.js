export const STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
];
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
export const CATEGORIES = [
  "GENERAL",
  "BILLING",
  "TECHNICAL",
  "ACCOUNT",
  "FEATURE_REQUEST",
  "OTHER",
];
export const TERMINAL = ["CLOSED", "CANCELLED"];

export const label = (v) =>
  v
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

export const statusAction = (s) =>
  s === "CANCELLED"
    ? "Cancel ticket"
    : s === "CLOSED"
      ? "Close ticket"
      : `Move to ${label(s)}`;
