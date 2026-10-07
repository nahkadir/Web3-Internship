import { ORDER_STATUS } from "../constants/statuses.js";

const { PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED } =
  ORDER_STATUS;
const RANK = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};

// what a vendor may change an order item to
export const ITEM_TRANSITIONS = {
  [PENDING]: [CONFIRMED, CANCELLED],
  [CONFIRMED]: [PROCESSING, CANCELLED],
  [PROCESSING]: [SHIPPED, CANCELLED],
  [SHIPPED]: [DELIVERED],
  [DELIVERED]: [],
  [CANCELLED]: [],
};

export const TERMINAL = [DELIVERED, CANCELLED];

// overall status derived from the fulfillment status of every item
export const deriveOrderStatus = (statuses) => {
  const active = statuses.filter((s) => s !== CANCELLED);
  if (active.length === 0) return CANCELLED;
  if (active.every((s) => s === DELIVERED)) return DELIVERED;
  if (active.every((s) => RANK[s] >= RANK[SHIPPED])) return SHIPPED;
  if (active.some((s) => RANK[s] >= RANK[PROCESSING])) return PROCESSING;
  if (active.every((s) => RANK[s] >= RANK[CONFIRMED])) return CONFIRMED;
  return PENDING;
};
