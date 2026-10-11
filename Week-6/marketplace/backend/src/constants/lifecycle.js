import { ORDER_STATUS as O, PAYMENT_STATUS as P } from "./statuses.js";

// Order status. It is derived from item fulfilment and moves forward only.
// Cancelling is only possible before anything ships.
export const ORDER_TRANSITIONS = {
  [O.PENDING]: [O.CONFIRMED, O.CANCELLED],
  [O.CONFIRMED]: [O.PROCESSING, O.CANCELLED],
  [O.PROCESSING]: [O.SHIPPED, O.CANCELLED],
  [O.SHIPPED]: [O.DELIVERED],
  [O.DELIVERED]: [],
  [O.CANCELLED]: [],
};

// Payment status. Only the backend (webhook / verify / admin refund) can move it.
export const PAYMENT_TRANSITIONS = {
  [P.PENDING]: [P.PROCESSING, P.PAID, P.FAILED, P.CANCELLED],
  [P.PROCESSING]: [P.PAID, P.FAILED, P.CANCELLED],
  [P.PAID]: [P.REFUNDED],
  [P.FAILED]: [],
  [P.CANCELLED]: [],
  [P.REFUNDED]: [],
};

export const canMove = (map, from, to) => map[from]?.includes(to) ?? false;

// every status that is allowed to move TO the given status
export const statusesThatCanMoveTo = (map, to) =>
  Object.keys(map).filter((from) => map[from].includes(to));
