import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app.js";
import { Commission } from "../src/models/Commission.js";
import { Order } from "../src/models/Order.js";
import { Payment } from "../src/models/Payment.js";
import { Product } from "../src/models/Product.js";
import {
  PASSWORD,
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

describe("complete marketplace workflow", () => {
  it("customer, vendor and admin journey from registration to refund", async () => {
    const admin = await makeActor("ADMIN");

    // customer registers and logs in
    const customer = request.agent(app);
    await customer
      .post("/api/auth/register")
      .send({
        name: "Sara Customer",
        email: "sara@test.com",
        password: PASSWORD,
      })
      .expect(201);
    await customer
      .post("/api/auth/login")
      .send({ email: "sara@test.com", password: PASSWORD })
      .expect(200);

    // a vendor applies, the admin approves and sets up a category
    const vendor = await makeActor("CUSTOMER");
    const apply = await vendor.agent
      .post("/api/vendors")
      .send({ storeName: "Jacket House" })
      .expect(201);
    await admin.agent
      .patch(`/api/admin/vendors/${apply.body.vendor.id}/status`)
      .send({ status: "APPROVED" })
      .expect(200);
    const cat = await admin.agent
      .post("/api/categories")
      .send({ name: "Outerwear" })
      .expect(201);

    // the vendor publishes a product
    const created = await vendor.agent
      .post("/api/vendor/products")
      .send({
        name: "Wool Jacket",
        description: "Warm wool jacket",
        price: 5000,
        stock: 5,
        categoryId: cat.body.category.id,
        status: "ACTIVE",
      })
      .expect(201);
    const productId = created.body.product.id;

    // the customer browses, orders and pays
    const found = await customer.get("/api/products?search=wool").expect(200);
    expect(found.body.products[0].vendor.storeName).toBe("Jacket House");
    await addToCart(customer, productId, 2).expect(201);
    const order = (await checkout(customer).expect(201)).body.order;
    expect(order.totalAmount).toBe(10000);
    await payOrder(customer, order.id);
    expect((await Order.findById(order.id)).status).toBe("CONFIRMED");

    // the vendor fulfils and sees the earnings
    const earnings = await vendor.agent.get("/api/vendor/earnings").expect(200);
    expect(earnings.body.summary).toMatchObject({
      totalSales: 10000,
      totalCommission: 1000,
      netEarnings: 9000,
      pendingEarnings: 9000,
    });
    for (const s of ["PROCESSING", "SHIPPED", "DELIVERED"]) {
      await vendor.agent
        .patch(`/api/vendor/orders/${order.id}/status`)
        .send({ status: s })
        .expect(200);
    }
    expect(
      (await vendor.agent.get("/api/vendor/earnings")).body.summary
        .paidEarnings,
    ).toBe(9000);

    // the admin reviews the payment and refunds it
    const payments = await admin.agent
      .get("/api/admin/payments?status=PAID")
      .expect(200);
    expect(payments.body.pagination.total).toBe(1);
    await admin.agent
      .post(`/api/admin/payments/${payments.body.payments[0].id}/refund`)
      .send({ reason: "Integration test" })
      .expect(200);

    const refunded = await Order.findById(order.id);
    expect(refunded.status).toBe("CANCELLED");
    expect(refunded.paymentStatus).toBe("REFUNDED");
    expect((await Product.findById(productId)).stock).toBe(3); // delivered goods are not restocked
    expect(
      (await vendor.agent.get("/api/vendor/earnings")).body.summary.totalSales,
    ).toBe(0);
  });

  it("failed payments and duplicate webhooks never create wrong order, stock or commission records", async () => {
    const cat = await makeCategory();
    const v = await makeVendor();
    const product = await makeProduct(v.vendor, cat, { price: 100, stock: 10 });
    const customer = await makeActor();

    const order = await placeOrder(customer.agent, [[product, 2]]);
    const { txn } = await startPayment(customer.agent, order.id);

    await postWebhook(await webhookEvent(txn, "payment.failed")).expect(200);
    expect((await Payment.findOne()).status).toBe("FAILED");
    expect((await Order.findById(order.id)).status).toBe("PENDING");
    expect(await Commission.countDocuments()).toBe(0);

    // retry and pay, then deliver the success event repeatedly
    const retry = await startPayment(customer.agent, order.id);
    await completeMock(retry.txn).expect(200);
    const event = await webhookEvent(retry.txn);
    await postWebhook(event).expect(200);
    await postWebhook(event).expect(200);
    await verify(customer.agent, order.id).expect(200);

    expect(await Commission.countDocuments()).toBe(1);
    expect((await Order.findById(order.id)).status).toBe("CONFIRMED");
    expect((await Product.findById(product._id)).stock).toBe(8);
  });
});
