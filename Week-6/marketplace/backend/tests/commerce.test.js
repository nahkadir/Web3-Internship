import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { AuditLog } from "../src/models/AuditLog.js";
import { Commission } from "../src/models/Commission.js";
import { Order } from "../src/models/Order.js";
import { OrderItem } from "../src/models/OrderItem.js";
import { Payment } from "../src/models/Payment.js";
import { Product } from "../src/models/Product.js";
import { signPayload } from "../src/payments/signature.js";
import {
  addToCart,
  checkout,
  completeMock,
  makeActor,
  makeCategory,
  makeProduct,
  makeVendor,
  payOrder,
  placeOrder,
  postWebhook,
  startPayment,
  verify,
  webhookEvent,
} from "./helpers.js";

let ctx;

beforeEach(async () => {
  const cat = await makeCategory();
  const A = await makeVendor();
  const B = await makeVendor();
  ctx = {
    A,
    B,
    pa: await makeProduct(A.vendor, cat, {
      name: "Alpha Jacket",
      price: 100,
      stock: 10,
    }),
    pb: await makeProduct(B.vendor, cat, {
      name: "Beta Scarf",
      price: 250,
      stock: 5,
    }),
    customer: await makeActor("CUSTOMER"),
    admin: await makeActor("ADMIN"),
  };
});

const stock = async (p) => (await Product.findById(p._id)).stock;

const paidOrder = async (items = [[ctx.pa, 2]]) => {
  const order = await placeOrder(ctx.customer.agent, items);
  const paid = await payOrder(ctx.customer.agent, order.id);
  return { order, ...paid };
};

describe("checkout", () => {
  it("creates an order with server-side totals, deducts stock once and clears the cart", async () => {
    const order = await placeOrder(ctx.customer.agent, [
      [ctx.pa, 2],
      [ctx.pb, 1],
    ]);
    expect(order.totalAmount).toBe(450);
    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("UNPAID");
    expect(order.groups).toHaveLength(2);
    expect(await stock(ctx.pa)).toBe(8);
    expect(await stock(ctx.pb)).toBe(4);
    expect(
      (await ctx.customer.agent.get("/api/cart")).body.cart.itemCount,
    ).toBe(0);
  });

  it("ignores totals and prices sent by the client", async () => {
    await addToCart(ctx.customer.agent, ctx.pa._id, 2).expect(201);
    const res = await checkout(ctx.customer.agent)
      .send({ totalAmount: 1, subtotal: 1, price: 1 })
      .expect(201);
    expect(res.body.order.totalAmount).toBe(200);
  });

  it("rejects an empty cart", async () => {
    await checkout(ctx.customer.agent).expect(400);
  });

  it("fails safely, with no partial order, when an item is no longer available", async () => {
    await addToCart(ctx.customer.agent, ctx.pa._id, 2).expect(201);
    await addToCart(ctx.customer.agent, ctx.pb._id, 1).expect(201);
    await Product.updateOne({ _id: ctx.pb._id }, { stock: 0 });

    await checkout(ctx.customer.agent).expect(409);
    expect(await Order.countDocuments()).toBe(0);
    expect(await stock(ctx.pa)).toBe(10);
    expect(
      (await ctx.customer.agent.get("/api/cart")).body.cart.itemCount,
    ).toBe(3);
  });

  it("concurrent checkouts of one cart create only one order", async () => {
    await addToCart(ctx.customer.agent, ctx.pa._id, 2).expect(201);
    const results = await Promise.all([
      checkout(ctx.customer.agent),
      checkout(ctx.customer.agent),
    ]);
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(await Order.countDocuments()).toBe(1);
    expect(await stock(ctx.pa)).toBe(8);
  });

  it("customers cannot see each other's orders", async () => {
    const order = await placeOrder(ctx.customer.agent, [[ctx.pa, 1]]);
    const other = await makeActor();
    await other.agent.get(`/api/orders/${order.id}`).expect(404);
    expect((await other.agent.get("/api/orders")).body.orders).toHaveLength(0);
  });
});

describe("payments", () => {
  it("creates a session for the server-side amount and reuses it", async () => {
    const order = await placeOrder(ctx.customer.agent, [[ctx.pa, 2]]);
    const r1 = await ctx.customer.agent
      .post("/api/payments/create")
      .send({ orderId: order.id, amount: 1 })
      .expect(201);
    expect(r1.body.payment.amount).toBe(200); // the client's amount was ignored
    expect(r1.body.redirectUrl).toContain("/pay/mock/txn_");
    expect(JSON.stringify(r1.body)).not.toContain(
      process.env.PAYMENT_WEBHOOK_SECRET,
    );

    const r2 = await ctx.customer.agent
      .post("/api/payments/create")
      .send({ orderId: order.id })
      .expect(201);
    expect(r2.body.payment.id).toBe(r1.body.payment.id);
    expect((await Order.findById(order.id)).paymentStatus).toBe("PENDING");
  });

  it("only the order owner can pay, and verify never confirms an unpaid order", async () => {
    const order = await placeOrder(ctx.customer.agent, [[ctx.pa, 2]]);
    const other = await makeActor();
    await other.agent
      .post("/api/payments/create")
      .send({ orderId: order.id })
      .expect(404);

    await startPayment(ctx.customer.agent, order.id);
    const res = await verify(ctx.customer.agent, order.id).expect(200);
    expect(res.body.payment.status).toBe("PENDING");
    expect(res.body.order.status).toBe("PENDING");
  });

  it("a verified payment confirms the order and creates one commission without touching stock", async () => {
    const { order } = await paidOrder();
    const o = await Order.findById(order.id);
    expect(o.status).toBe("CONFIRMED");
    expect(o.paymentStatus).toBe("PAID");
    expect(
      (await OrderItem.find({ orderId: order.id })).every(
        (i) => i.status === "CONFIRMED",
      ),
    ).toBe(true);

    const commission = await Commission.findOne();
    expect(commission).toMatchObject({
      grossAmount: 200,
      commissionAmount: 20,
      vendorAmount: 180,
      status: "PENDING",
    });
    expect(await stock(ctx.pa)).toBe(8); // deducted at checkout only
  });

  it("repeated and parallel verification never duplicates commissions or audit entries", async () => {
    const { order } = await paidOrder();
    await Promise.all([
      verify(ctx.customer.agent, order.id),
      verify(ctx.customer.agent, order.id),
    ]);
    expect(await Commission.countDocuments()).toBe(1);
    expect(await AuditLog.countDocuments({ action: "payment.paid" })).toBe(1);
  });

  it("a failed payment never confirms the order and can be retried", async () => {
    const order = await placeOrder(ctx.customer.agent, [[ctx.pa, 2]]);
    const first = await startPayment(ctx.customer.agent, order.id);
    await completeMock(first.txn, "fail").expect(200);

    const failed = await verify(ctx.customer.agent, order.id).expect(200);
    expect(failed.body.payment.status).toBe("FAILED");
    expect(failed.body.order.status).toBe("PENDING");
    expect(failed.body.order.paymentStatus).toBe("FAILED");
    expect(await Commission.countDocuments()).toBe(0);

    const retry = await startPayment(ctx.customer.agent, order.id);
    expect(retry.payment.id).not.toBe(first.payment.id);
    await completeMock(retry.txn).expect(200);
    const done = await verify(ctx.customer.agent, order.id).expect(200);
    expect(done.body.payment.status).toBe("PAID");
    expect(done.body.order.status).toBe("CONFIRMED");
  });

  it("a cancelled payment is not paid, and a paid order cannot be paid again", async () => {
    const order = await placeOrder(ctx.customer.agent, [[ctx.pa, 1]]);
    const { txn } = await startPayment(ctx.customer.agent, order.id);
    await completeMock(txn, "cancel").expect(200);
    expect(
      (await verify(ctx.customer.agent, order.id)).body.payment.status,
    ).toBe("CANCELLED");

    const paid = await placeOrder(ctx.customer.agent, [[ctx.pa, 1]]);
    await payOrder(ctx.customer.agent, paid.id);
    await ctx.customer.agent
      .post("/api/payments/create")
      .send({ orderId: paid.id })
      .expect(409);
  });

  it("an expired unpaid order is cancelled and its stock is restored", async () => {
    const order = await placeOrder(ctx.customer.agent, [[ctx.pa, 2]]);
    await Order.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(order.id) },
      { $set: { createdAt: new Date(Date.now() - 60 * 60 * 1000) } },
    );
    await ctx.customer.agent
      .post("/api/payments/create")
      .send({ orderId: order.id })
      .expect(410);
    expect((await Order.findById(order.id)).status).toBe("CANCELLED");
    expect(await stock(ctx.pa)).toBe(10);
  });
});

describe("webhooks", () => {
  const pending = async () => {
    const order = await placeOrder(ctx.customer.agent, [[ctx.pa, 2]]);
    const { txn } = await startPayment(ctx.customer.agent, order.id);
    return { order, txn };
  };

  it("rejects missing, wrong and stale signatures", async () => {
    const { txn } = await pending();
    const event = await webhookEvent(txn);
    await postWebhook(event, { signature: "" }).expect(400);
    await postWebhook(event, { secret: "wrong-secret" }).expect(400);
    const stale = signPayload(
      JSON.stringify(event),
      process.env.PAYMENT_WEBHOOK_SECRET,
      Math.floor(Date.now() / 1000) - 1000,
    );
    await postWebhook(event, { signature: stale }).expect(400);
    expect((await Payment.findOne()).status).toBe("PENDING");
  });

  it("processes success once, whatever the repeats", async () => {
    const { order, txn } = await pending();
    const event = await webhookEvent(txn);

    const first = await postWebhook(event).expect(200);
    expect(first.body.processed).toBe(true);
    expect((await Payment.findOne()).status).toBe("PAID");
    expect((await Order.findById(order.id)).status).toBe("CONFIRMED");

    expect((await postWebhook(event).expect(200)).body.duplicate).toBe(true); // same event id
    await postWebhook(await webhookEvent(txn)).expect(200); // same payment, NEW event id

    expect(await Commission.countDocuments()).toBe(1);
    expect(await AuditLog.countDocuments({ action: "payment.paid" })).toBe(1);
    expect(await stock(ctx.pa)).toBe(8);
  });

  it("rejects an event whose amount does not match", async () => {
    const { txn } = await pending();
    const event = await webhookEvent(txn);
    event.data.amount += 1;
    expect((await postWebhook(event).expect(200)).body.rejected).toBe(true);
    expect((await Payment.findOne()).status).toBe("PENDING");
  });

  it("handles failure events and ignores unknown transactions", async () => {
    const { order, txn } = await pending();
    await postWebhook(await webhookEvent(txn, "payment.failed")).expect(200);
    expect((await Payment.findOne()).status).toBe("FAILED");
    expect((await Order.findById(order.id)).status).toBe("PENDING");

    const unknown = {
      id: "evt_unknown",
      type: "payment.succeeded",
      data: {
        transactionId: `txn_${"0".repeat(24)}`,
        amount: 100,
        currency: "PKR",
        metadata: {},
      },
    };
    expect((await postWebhook(unknown).expect(200)).body.ignored).toBe(true);
  });
});

describe("vendor orders, fulfilment and earnings", () => {
  it("shows vendors only their own items, and only once paid", async () => {
    const order = await placeOrder(ctx.customer.agent, [
      [ctx.pa, 2],
      [ctx.pb, 1],
    ]);
    expect(
      (await ctx.A.agent.get("/api/vendor/orders").expect(200)).body.orders,
    ).toHaveLength(0);
    await ctx.A.agent
      .patch(`/api/vendor/orders/${order.id}/status`)
      .send({ status: "PROCESSING" })
      .expect(409);

    await payOrder(ctx.customer.agent, order.id);
    const a = await ctx.A.agent.get("/api/vendor/orders").expect(200);
    expect(a.body.orders).toHaveLength(1);
    expect(a.body.orders[0].items.map((i) => i.productName)).toEqual([
      "Alpha Jacket",
    ]);
    expect(a.body.orders[0].subtotal).toBe(200);
    expect(JSON.stringify(a.body)).not.toContain("Beta Scarf");

    const b = await ctx.B.agent.get("/api/vendor/orders").expect(200);
    expect(b.body.orders[0].items.map((i) => i.productName)).toEqual([
      "Beta Scarf",
    ]);
  });

  it("one vendor cannot read or change another vendor's order", async () => {
    const solo = await placeOrder(ctx.customer.agent, [[ctx.pb, 1]]);
    await payOrder(ctx.customer.agent, solo.id);
    await ctx.A.agent.get(`/api/vendor/orders/${solo.id}`).expect(404);
    await ctx.A.agent
      .patch(`/api/vendor/orders/${solo.id}/status`)
      .send({ status: "PROCESSING" })
      .expect(404);
  });

  it("enforces fulfilment transitions and keeps the customer's order status consistent", async () => {
    const { order } = await paidOrder([
      [ctx.pa, 2],
      [ctx.pb, 1],
    ]);
    const patch = (v, status) =>
      v.agent.patch(`/api/vendor/orders/${order.id}/status`).send({ status });
    const orderStatus = async () =>
      (await ctx.customer.agent.get(`/api/orders/${order.id}`)).body.order
        .status;

    await patch(ctx.A, "SHIPPED").expect(400); // cannot skip PROCESSING
    await patch(ctx.A, "PROCESSING").expect(200);
    expect(await orderStatus()).toBe("PROCESSING");

    for (const s of ["SHIPPED", "DELIVERED"]) await patch(ctx.A, s).expect(200);
    for (const s of ["PROCESSING", "SHIPPED", "DELIVERED"])
      await patch(ctx.B, s).expect(200);
    expect(await orderStatus()).toBe("DELIVERED");
    await patch(ctx.A, "CANCELLED").expect(400);
  });

  it("calculates commissions and moves earnings from pending to paid on delivery", async () => {
    const { order } = await paidOrder([
      [ctx.pa, 2],
      [ctx.pb, 1],
    ]);

    const a = await ctx.A.agent.get("/api/vendor/earnings").expect(200);
    expect(a.body.summary).toMatchObject({
      totalSales: 200,
      totalCommission: 20,
      netEarnings: 180,
      pendingEarnings: 180,
      paidEarnings: 0,
    });
    const b = await ctx.B.agent.get("/api/vendor/earnings").expect(200);
    expect(b.body.summary).toMatchObject({
      totalSales: 250,
      totalCommission: 25,
      netEarnings: 225,
    });
    expect(b.body.transactions).toHaveLength(1);
    expect(b.body.transactions[0].productName).toBe("Beta Scarf");

    for (const s of ["PROCESSING", "SHIPPED", "DELIVERED"]) {
      await ctx.A.agent
        .patch(`/api/vendor/orders/${order.id}/status`)
        .send({ status: s })
        .expect(200);
    }
    const after = await ctx.A.agent.get("/api/vendor/earnings").expect(200);
    expect(after.body.summary).toMatchObject({
      pendingEarnings: 0,
      paidEarnings: 180,
    });
  });

  it("a vendor cancelling restores stock and cancels the commission", async () => {
    const { order } = await paidOrder();
    await ctx.A.agent
      .patch(`/api/vendor/orders/${order.id}/status`)
      .send({ status: "CANCELLED" })
      .expect(200);
    expect(await stock(ctx.pa)).toBe(10);
    expect((await Commission.findOne()).status).toBe("CANCELLED");
    const e = await ctx.A.agent.get("/api/vendor/earnings").expect(200);
    expect(e.body.summary.totalSales).toBe(0);
  });
});

describe("admin management and refunds", () => {
  it("only admins can refund", async () => {
    const { payment } = await paidOrder();
    const url = `/api/admin/payments/${payment.id}/refund`;
    await ctx.customer.agent.post(url).expect(403);
    await ctx.A.agent.post(url).expect(403);
  });

  it("refunds once, cancelling the order, restoring stock and reversing commissions", async () => {
    const { order, payment } = await paidOrder();
    const url = `/api/admin/payments/${payment.id}/refund`;

    const res = await ctx.admin.agent
      .post(url)
      .send({ reason: "Customer request" })
      .expect(200);
    expect(res.body.payment.status).toBe("REFUNDED");

    const o = await Order.findById(order.id);
    expect(o.status).toBe("CANCELLED");
    expect(o.paymentStatus).toBe("REFUNDED");
    expect(await stock(ctx.pa)).toBe(10);
    expect((await Commission.findOne()).status).toBe("REFUNDED");

    await ctx.admin.agent.post(url).expect(409); // already refunded
  });

  it("does not refund a payment that was never paid", async () => {
    const order = await placeOrder(ctx.customer.agent, [[ctx.pa, 1]]);
    const { payment } = await startPayment(ctx.customer.agent, order.id);
    await ctx.admin.agent
      .post(`/api/admin/payments/${payment.id}/refund`)
      .expect(409);
  });

  it("cancelling a paid order requires a refund, but an unpaid order can be cancelled", async () => {
    const { order: paid } = await paidOrder();
    const res = await ctx.admin.agent
      .patch(`/api/admin/orders/${paid.id}/status`)
      .send({ status: "CANCELLED" })
      .expect(409);
    expect(res.body.message).toMatch(/refund/i);

    const unpaid = await placeOrder(ctx.customer.agent, [[ctx.pb, 2]]);
    await ctx.admin.agent
      .patch(`/api/admin/orders/${unpaid.id}/status`)
      .send({ status: "CANCELLED" })
      .expect(200);
    expect(await stock(ctx.pb)).toBe(5);
    await ctx.admin.agent
      .patch(`/api/admin/orders/${unpaid.id}/status`)
      .send({ status: "PROCESSING" })
      .expect(409);
  });

  it("filters orders, reports stats and exposes the audit trail to admins only", async () => {
    await paidOrder();
    await placeOrder(ctx.customer.agent, [[ctx.pa, 1]]);

    const filtered = await ctx.admin.agent
      .get("/api/admin/orders?paymentStatus=PAID")
      .expect(200);
    expect(filtered.body.pagination.total).toBe(1);

    const stats = await ctx.admin.agent.get("/api/admin/stats").expect(200);
    expect(stats.body.stats).toMatchObject({
      paidOrders: 1,
      totalSales: 200,
      totalCommission: 20,
      vendorEarnings: 180,
    });

    await ctx.customer.agent.get("/api/admin/audit-logs").expect(403);
    const logs = await ctx.admin.agent.get("/api/admin/audit-logs").expect(200);
    expect(logs.body.logs.some((l) => l.action === "payment.paid")).toBe(true);
  });
});
