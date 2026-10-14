export const STATUS = Object.freeze({
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_FOR_CUSTOMER: "WAITING_FOR_CUSTOMER",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
});

export const PRIORITY = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
});

export const PRIORITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };

export const CATEGORY = Object.freeze({
  GENERAL: "GENERAL",
  BILLING: "BILLING",
  TECHNICAL: "TECHNICAL",
  ACCOUNT: "ACCOUNT",
  FEATURE_REQUEST: "FEATURE_REQUEST",
  OTHER: "OTHER",
});

export const TERMINAL_STATUSES = [STATUS.CLOSED, STATUS.CANCELLED];

// role -> current status -> statuses that role may move to
// every role's moves must also exist in the ADMIN map (used to tell 400 from 403)
export const TRANSITIONS = {
  CUSTOMER: {
    OPEN: ["CANCELLED"],
    WAITING_FOR_CUSTOMER: ["IN_PROGRESS", "CANCELLED"],
    RESOLVED: ["CLOSED", "OPEN"],
  },
  AGENT: {
    OPEN: ["IN_PROGRESS"],
    IN_PROGRESS: ["WAITING_FOR_CUSTOMER", "RESOLVED"],
    WAITING_FOR_CUSTOMER: ["IN_PROGRESS", "RESOLVED"],
    RESOLVED: ["IN_PROGRESS"],
  },
  ADMIN: {
    OPEN: ["IN_PROGRESS", "CANCELLED", "CLOSED"],
    IN_PROGRESS: ["WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED", "CANCELLED"],
    WAITING_FOR_CUSTOMER: ["IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"],
    RESOLVED: ["IN_PROGRESS", "OPEN", "CLOSED"],
  },
};

export const EDITABLE_FIELDS = {
  CUSTOMER: ["subject", "description", "category"],
  AGENT: ["priority", "category"],
  ADMIN: ["priority", "category"],
};
