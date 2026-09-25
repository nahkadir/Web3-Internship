import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
import {
  connectTestDB,
  disconnectTestDB,
  clearCollections,
} from "./helpers/setup.js";
import { registerAndLogin, makeAdmin, createEvent } from "./helpers/factory.js";

before(connectTestDB);
after(disconnectTestDB);
beforeEach(clearCollections);

// Test 1 — Normal booking
test("normal booking: books 2 of 10 seats, leaves 8", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const res = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ eventId: event._id, quantity: 2 });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.booking.quantity, 2);
  assert.equal(res.body.data.booking.totalAmount, 2000);

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);

  assert.equal(eventRes.body.data.event.availableSeats, 8);
});

// Test 2 — Overbooking rejected
test("overbooking rejected: 2 seats available, request 5", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 2 });

  const res = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ eventId: event._id, quantity: 5 });

  assert.equal(res.status, 409);
  assert.equal(res.body.message, "Not enough seats available");

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);

  assert.equal(eventRes.body.data.event.availableSeats, 2);
});

// Test 3 — Concurrent booking
test("concurrent booking: 10 seats, 20 simultaneous requests, max 10 succeed", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${user.token}`)
        .send({ eventId: event._id, quantity: 1 }),
    ),
  );

  const succeeded = results.filter((r) => r.status === 201);
  const failed = results.filter((r) => r.status === 409);

  assert.equal(succeeded.length, 10);
  assert.equal(failed.length, 10);

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);

  assert.equal(eventRes.body.data.event.availableSeats, 0);
});

// Test 4 — Transaction failure / rollback
test("transaction failure: booking creation fails after seat deduction, seats are restored", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const Booking = (await import("../src/models/Booking.js")).default;
  const originalCreate = Booking.create;
  Booking.create = async () => {
    throw new Error("Simulated failure after seat deduction");
  };

  const res = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ eventId: event._id, quantity: 3 });

  Booking.create = originalCreate;

  assert.equal(res.status, 500);

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);

  assert.equal(eventRes.body.data.event.availableSeats, 10);

  const bookingsRes = await request(app)
    .get("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`);

  assert.equal(bookingsRes.body.data.bookings.length, 0);
});

// Test 5 — Final consistency
test("final consistency: availableSeats + bookedSeats = totalSeats after mixed activity", async () => {
  const admin = await makeAdmin();
  const user = await registerAndLogin();
  const event = await createEvent(admin.token, { totalSeats: 10 });

  const b1 = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ eventId: event._id, quantity: 3 });

  const b2 = await request(app)
    .post("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ eventId: event._id, quantity: 2 });

  await request(app)
    .patch(`/api/bookings/${b1.body.data.booking._id}/cancel`)
    .set("Authorization", `Bearer ${user.token}`);

  const eventRes = await request(app)
    .get(`/api/events/${event._id}`)
    .set("Authorization", `Bearer ${user.token}`);

  const bookingsRes = await request(app)
    .get("/api/bookings")
    .set("Authorization", `Bearer ${user.token}`);

  const bookedSeats = bookingsRes.body.data.bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.quantity, 0);

  assert.equal(
    eventRes.body.data.event.availableSeats + bookedSeats,
    event.totalSeats,
  );
  assert.equal(eventRes.body.data.event.availableSeats, 8);
  assert.equal(bookedSeats, 2);

  void b2;
});
