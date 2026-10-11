import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import { User } from "../src/models/User.js";
import { Vendor } from "../src/models/Vendor.js";
import { Category } from "../src/models/Category.js";
import { Product } from "../src/models/Product.js";
import { MockTransaction } from "../src/payments/mock/MockTransaction.js";
import { signPayload } from "../src/payments/signature.js";

export const PASSWORD = "Passw0rdTest";
let counter = 0;
const next = () => ++counter;

export const makeUser = async (role = "CUSTOMER") => {
  const n = next();
  return User.create({
    name: `${role.toLowerCase()} ${n}`,
    email: `${role.toLowerCase()}${n}@test.com`,
    password: await bcrypt.hash(PASSWORD, 4),
    role,
  });
};

export const loginAs = async (user) => {
  const agent = request.agent(app); // keeps the auth cookie
  await agent
    .post("/api/auth/login")
    .send({ email: user.email, password: PASSWORD })
    .expect(200);
  return agent;
};

export const makeActor = async (role = "CUSTOMER") => {
  const user = await makeUser(role);
  return { user, agent: await loginAs(user) };
};

export const makeVendor = async (status = "APPROVED") => {
  const actor = await makeActor("VENDOR");
  const vendor = await Vendor.create({
    userId: actor.user._id,
    storeName: `Store ${next()}`,
    status,
  });
  return { ...actor, vendor };
};

export const makeCategory = () => {
  const n = next();
  return Category.create({ name: `Category ${n}`, slug: `category-${n}` });
};

export const makeProduct = (vendor, category, overrides = {}) => {
  const n = next();
  return Product.create({
    vendorId: vendor._id,
    categoryId: category._id,
    name: `Product ${n}`,
    slug: `product-${n}`,
    description: "A test product",
    price: 100,
    stock: 10,
    images: [],
    status: "ACTIVE",
    ...overrides,
  });
};

/* ---------- shopping flow ---------- */

export const addToCart = (agent, productId, quantity = 1) =>
  agent
    .post("/api/cart/items")
    .send({ productId: String(productId), quantity });

export const checkout = (agent) => agent.post("/api/checkout");

export const placeOrder = async (agent, items) => {
  for (const [product, qty] of items)
    await addToCart(agent, product._id, qty).expect(201);
  const res = await checkout(agent).expect(201);
  return res.body.order;
};

/* ---------- payment flow (the mock gateway plays the provider) ---------- */

export const startPayment = async (agent, orderId) => {
  const res = await agent
    .post("/api/payments/create")
    .send({ orderId })
    .expect(201);
  return { payment: res.body.payment, txn: res.body.payment.transactionId };
};

export const completeMock = (txn, outcome = "succeed") =>
  request(app).post(`/api/mock-gateway/${txn}/complete`).send({ outcome });

export const verify = (agent, orderId) =>
  agent.post("/api/payments/verify").send({ orderId });

export const payOrder = async (agent, orderId) => {
  const { txn } = await startPayment(agent, orderId);
  await completeMock(txn, "succeed").expect(200);
  const res = await verify(agent, orderId).expect(200);
  return { payment: res.body.payment, txn };
};

export const webhookEvent = async (
  txn,
  type = "payment.succeeded",
  id = `evt_${next()}`,
) => {
  const tx = await MockTransaction.findOne({ transactionId: txn });
  return {
    id,
    type,
    created: Math.floor(Date.now() / 1000),
    data: {
      transactionId: txn,
      amount: tx.amount,
      currency: tx.currency,
      metadata: tx.toObject().metadata,
    },
  };
};

export const postWebhook = (
  event,
  { signature, secret = process.env.PAYMENT_WEBHOOK_SECRET } = {},
) => {
  const body = JSON.stringify(event);
  return request(app)
    .post("/api/payments/webhook")
    .set("Content-Type", "application/json")
    .set("x-signature", signature ?? signPayload(body, secret))
    .send(body);
};
