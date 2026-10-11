import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  addToCart,
  makeActor,
  makeCategory,
  makeProduct,
  makeVendor,
} from "./helpers.js";

let cat;
beforeEach(async () => {
  cat = await makeCategory();
});

const productBody = (extra = {}) => ({
  name: "Blue Jacket",
  description: "A warm blue jacket",
  price: 2500,
  stock: 5,
  categoryId: String(cat._id),
  ...extra,
});

describe("vendor applications", () => {
  it("a customer becomes a PENDING vendor and can only apply once", async () => {
    const { agent } = await makeActor("CUSTOMER");
    const res = await agent
      .post("/api/vendors")
      .send({ storeName: "My Store" })
      .expect(201);
    expect(res.body.vendor.status).toBe("PENDING");
    expect((await agent.get("/api/auth/me")).body.user.role).toBe("VENDOR");
    await agent.post("/api/vendors").send({ storeName: "Again" }).expect(409);
  });

  it("admins cannot apply as vendors", async () => {
    const { agent } = await makeActor("ADMIN");
    await agent
      .post("/api/vendors")
      .send({ storeName: "Admin Shop" })
      .expect(403);
  });

  it("only admins approve, reject and suspend, with valid transitions only", async () => {
    const admin = await makeActor("ADMIN");
    const v = await makeVendor("PENDING");
    const url = `/api/admin/vendors/${v.vendor.id}/status`;

    await v.agent.patch(url).send({ status: "APPROVED" }).expect(403);
    await admin.agent.patch(url).send({ status: "APPROVED" }).expect(200);
    await admin.agent.patch(url).send({ status: "APPROVED" }).expect(400); // already approved
    await admin.agent.patch(url).send({ status: "SUSPENDED" }).expect(200);

    const other = await makeVendor("PENDING");
    await admin.agent
      .patch(`/api/admin/vendors/${other.vendor.id}/status`)
      .send({ status: "REJECTED" })
      .expect(200);
  });

  it("a pending vendor cannot create products", async () => {
    const v = await makeVendor("PENDING");
    await v.agent.post("/api/vendor/products").send(productBody()).expect(403);
  });
});

describe("vendor products", () => {
  it("validates input and enforces the publishing rules", async () => {
    const v = await makeVendor();
    await v.agent
      .post("/api/vendor/products")
      .send(productBody({ price: 0 }))
      .expect(400);
    await v.agent
      .post("/api/vendor/products")
      .send(productBody({ stock: -1 }))
      .expect(400);
    await v.agent
      .post("/api/vendor/products")
      .send(productBody({ description: "", status: "ACTIVE" }))
      .expect(400);
    const ok = await v.agent
      .post("/api/vendor/products")
      .send(productBody({ status: "ACTIVE" }))
      .expect(201);
    expect(ok.body.product.status).toBe("ACTIVE");
  });

  it("never lets a vendor set or change ownership", async () => {
    const A = await makeVendor();
    const B = await makeVendor();
    const created = await A.agent
      .post("/api/vendor/products")
      .send(productBody({ status: "ACTIVE", vendorId: String(B.vendor._id) }))
      .expect(201);
    expect(String(created.body.product.vendorId)).toBe(String(A.vendor._id));

    const url = `/api/vendor/products/${created.body.product.id}`;
    await B.agent.get(url).expect(404);
    await B.agent.patch(url).send({ price: 1 }).expect(404);
    await B.agent.delete(url).expect(404);
  });

  it("syncs OUT_OF_STOCK with stock and archives instead of deleting", async () => {
    const v = await makeVendor();
    const created = await v.agent
      .post("/api/vendor/products")
      .send(productBody({ status: "ACTIVE" }))
      .expect(201);
    const url = `/api/vendor/products/${created.body.product.id}`;

    expect(
      (await v.agent.patch(url).send({ stock: 0 }).expect(200)).body.product
        .status,
    ).toBe("OUT_OF_STOCK");
    expect(
      (await v.agent.patch(url).send({ stock: 3 }).expect(200)).body.product
        .status,
    ).toBe("ACTIVE");
    expect((await v.agent.delete(url).expect(200)).body.product.status).toBe(
      "ARCHIVED",
    );
  });
});

describe("public marketplace", () => {
  it("lists only ACTIVE products from approved vendors", async () => {
    const v = await makeVendor();
    await makeProduct(v.vendor, cat, { name: "Visible" });
    await makeProduct(v.vendor, cat, { name: "Hidden draft", status: "DRAFT" });
    const res = await request(app).get("/api/products").expect(200);
    expect(res.body.products.map((p) => p.name)).toEqual(["Visible"]);
  });

  it("hides a suspended vendor's products", async () => {
    const admin = await makeActor("ADMIN");
    const v = await makeVendor();
    const p = await makeProduct(v.vendor, cat);
    await request(app).get(`/api/products/${p.id}`).expect(200);

    await admin.agent
      .patch(`/api/admin/vendors/${v.vendor.id}/status`)
      .send({ status: "SUSPENDED" })
      .expect(200);
    expect(
      (await request(app).get("/api/products")).body.products,
    ).toHaveLength(0);
    await request(app).get(`/api/products/${p.id}`).expect(404);
  });

  it("supports search, price filters, sorting and pagination", async () => {
    const v = await makeVendor();
    await makeProduct(v.vendor, cat, { name: "Red Shirt", price: 100 });
    await makeProduct(v.vendor, cat, { name: "Blue Jacket", price: 300 });

    const search = await request(app)
      .get("/api/products?search=jacket")
      .expect(200);
    expect(search.body.products).toHaveLength(1);
    const price = await request(app)
      .get("/api/products?minPrice=200")
      .expect(200);
    expect(price.body.products[0].name).toBe("Blue Jacket");
    const sorted = await request(app)
      .get("/api/products?sort=price_desc")
      .expect(200);
    expect(sorted.body.products[0].price).toBe(300);
    const paged = await request(app).get("/api/products?limit=1").expect(200);
    expect(paged.body.products).toHaveLength(1);
    expect(paged.body.pagination.totalPages).toBe(2);
    await request(app)
      .get("/api/products?minPrice=500&maxPrice=100")
      .expect(400);
  });
});

describe("cart", () => {
  it("merges quantities, validates stock and uses database prices", async () => {
    const v = await makeVendor();
    const p = await makeProduct(v.vendor, cat, { price: 100, stock: 10 });
    const { agent } = await makeActor();

    await addToCart(agent, p._id, 2).expect(201);
    const res = await agent
      .post("/api/cart/items")
      .send({ productId: String(p._id), quantity: 2, price: 1 })
      .expect(201);
    expect(res.body.cart.groups[0].items).toHaveLength(1);
    expect(res.body.cart.groups[0].items[0].quantity).toBe(4);
    expect(res.body.cart.totals.subtotal).toBe(400); // the client's price: 1 was ignored

    await addToCart(agent, p._id, 20).expect(409);
    await addToCart(agent, p._id, 0).expect(400);
    await agent
      .post("/api/cart/items")
      .send({ productId: "nope", quantity: 1 })
      .expect(400);
  });

  it("groups items by vendor and blocks buying your own product", async () => {
    const A = await makeVendor();
    const B = await makeVendor();
    const pa = await makeProduct(A.vendor, cat);
    const pb = await makeProduct(B.vendor, cat);
    const { agent } = await makeActor();

    await addToCart(agent, pa._id, 1).expect(201);
    const res = await addToCart(agent, pb._id, 2).expect(201);
    expect(res.body.cart.groups).toHaveLength(2);
    expect(res.body.cart.itemCount).toBe(3);

    await addToCart(A.agent, pa._id, 1).expect(403);
  });

  it("only the owner can change or remove a cart item", async () => {
    const v = await makeVendor();
    const p = await makeProduct(v.vendor, cat);
    const owner = await makeActor();
    const other = await makeActor();

    const res = await addToCart(owner.agent, p._id, 1).expect(201);
    const itemId = res.body.cart.groups[0].items[0].id;
    await other.agent
      .patch(`/api/cart/items/${itemId}`)
      .send({ quantity: 2 })
      .expect(404);
    await other.agent.delete(`/api/cart/items/${itemId}`).expect(404);
    await owner.agent.delete(`/api/cart/items/${itemId}`).expect(200);
    await owner.agent.delete(`/api/cart/items/${itemId}`).expect(404);
  });
});
