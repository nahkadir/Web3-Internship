import { describe, expect, it } from "vitest";
import {
  canMove,
  ORDER_TRANSITIONS,
  PAYMENT_TRANSITIONS,
} from "../src/constants/lifecycle.js";
import { deriveOrderStatus } from "../src/services/orderStatus.js";
import {
  calculateTotals,
  toMinorUnits,
} from "../src/services/pricing.service.js";
import { signPayload, verifySignature } from "../src/payments/signature.js";

describe("status lifecycles", () => {
  it("only allows valid order transitions", () => {
    expect(canMove(ORDER_TRANSITIONS, "PENDING", "CONFIRMED")).toBe(true);
    expect(canMove(ORDER_TRANSITIONS, "PROCESSING", "CANCELLED")).toBe(true);
    expect(canMove(ORDER_TRANSITIONS, "SHIPPED", "CANCELLED")).toBe(false);
    expect(canMove(ORDER_TRANSITIONS, "DELIVERED", "PENDING")).toBe(false);
    expect(canMove(ORDER_TRANSITIONS, "CANCELLED", "CONFIRMED")).toBe(false);
  });

  it("only allows valid payment transitions", () => {
    expect(canMove(PAYMENT_TRANSITIONS, "PENDING", "PAID")).toBe(true);
    expect(canMove(PAYMENT_TRANSITIONS, "PAID", "REFUNDED")).toBe(true);
    expect(canMove(PAYMENT_TRANSITIONS, "FAILED", "PAID")).toBe(false);
    expect(canMove(PAYMENT_TRANSITIONS, "REFUNDED", "PAID")).toBe(false);
    expect(canMove(PAYMENT_TRANSITIONS, "PENDING", "REFUNDED")).toBe(false);
  });

  it("derives the overall order status from item statuses", () => {
    expect(deriveOrderStatus(["CONFIRMED", "CONFIRMED"])).toBe("CONFIRMED");
    expect(deriveOrderStatus(["PENDING", "CONFIRMED"])).toBe("PENDING");
    expect(deriveOrderStatus(["SHIPPED", "PROCESSING"])).toBe("PROCESSING");
    expect(deriveOrderStatus(["SHIPPED", "DELIVERED"])).toBe("SHIPPED");
    expect(deriveOrderStatus(["DELIVERED", "CANCELLED"])).toBe("DELIVERED");
    expect(deriveOrderStatus(["CANCELLED", "CANCELLED"])).toBe("CANCELLED");
  });
});

describe("money", () => {
  it("rounds totals correctly", () => {
    const totals = calculateTotals([
      { unitPrice: 10.1, quantity: 3 },
      { unitPrice: 5, quantity: 2 },
    ]);
    expect(totals.subtotal).toBe(40.3);
    expect(totals.totalAmount).toBe(40.3);
  });

  it("converts to integer minor units", () => {
    expect(toMinorUnits(1500.5)).toBe(150050);
    expect(toMinorUnits(0.29)).toBe(29);
  });
});

describe("webhook signatures", () => {
  const body = JSON.stringify({ a: 1 });

  it("accepts a valid signature and rejects tampering, wrong secrets, stale and missing headers", () => {
    const header = signPayload(body, "secret");
    expect(verifySignature(body, header, "secret")).toBe(true);
    expect(verifySignature(body + " ", header, "secret")).toBe(false);
    expect(verifySignature(body, header, "other")).toBe(false);
    expect(
      verifySignature(
        body,
        signPayload(body, "secret", Math.floor(Date.now() / 1000) - 1000),
        "secret",
      ),
    ).toBe(false);
    expect(verifySignature(body, undefined, "secret")).toBe(false);
  });
});
