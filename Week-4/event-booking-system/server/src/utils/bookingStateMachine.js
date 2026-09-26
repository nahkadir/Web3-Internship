const ALLOWED_TRANSITIONS = {
  PENDING: new Set(["CONFIRMED", "CANCELLED"]),
  CONFIRMED: new Set(["CANCELLED"]),
  CANCELLED: new Set([]), // terminal state, nothing is allowed from here
};

export const isTransitionAllowed = (from, to) =>
  ALLOWED_TRANSITIONS[from]?.has(to) ?? false;
