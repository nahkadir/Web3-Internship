# Event Booking API

A production-oriented Express + MongoDB backend for an Event Booking System: authentication and RBAC, event management, concurrency-safe seat booking, idempotency and reliability hardening and final integration/security validation.

## Technology Stack

- **Backend framework:** Express
- **Database:** MongoDB Atlas via Mongoose
- **Authentication:** JWT (Bearer tokens), bcrypt password hashing
- **Validation:** Zod
- **API documentation:** Swagger UI / OpenAPI (`swagger-jsdoc` + `swagger-ui-express`)
- **Logging:** Winston (structured JSON logs) + Morgan (HTTP request logs)
- **Testing:** Node's built-in `node:test` runner + Supertest (in-process HTTP testing, no separate server needed)
- **Concurrency approach:** atomic single-document MongoDB operations (`findOneAndUpdate` with conditional filters), not application-level locking

## Architecture

```
src/
├── config/
├── models/
├── validators/
├── middleware/
├── services/
├── controllers/
├── routes/
├── utils/
├── app.js
├── server.js
└── tests/
```

**Data flow:** request → validation middleware (Zod) → auth middleware (JWT + role) → controller → service (business logic + DB) → consistent `{ success, message, data }` response, or a centralized error handler producing `{ success: false, message, errors? }`.

## Setup Instructions

```bash
# 1. Clone
git clone <repo-url>
cd event-booking-system/server

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env   # then edit values - see table below

# 4. Run database
# Uses MongoDB Atlas (a replica set, required for transactions/atomic guarantees).
# No local database or migrations needed - just a valid MONGO_URI.

# 5. Seed the admin user
npm run seed:admin

# 6. Start the server
npm run dev             # development, auto-restarts on file changes
npm start                # production

# 7. Run tests
npm test
```

- API base: `http://localhost:5000/api`
- Swagger UI: `http://localhost:5000/api/docs`
- OpenAPI JSON: `http://localhost:5000/api/docs.json`

## Environment Variables

| Name                                            | Purpose                                                 |
| ----------------------------------------------- | ------------------------------------------------------- |
| `PORT`                                          | Server port                                             |
| `NODE_ENV`                                      | `development` or `production`                           |
| `MONGO_URI`                                     | MongoDB connection string (main database)               |
| `TEST_MONGO_URI`                                | Separate database used only by the automated test suite |
| `JWT_SECRET`                                    | Secret used to sign tokens                              |
| `JWT_EXPIRES_IN`                                | Token lifetime (e.g. `1d`)                              |
| `CLIENT_URL`                                    | Allowed CORS origin(s), comma-separated for multiple    |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used by the admin seed script                           |

No secrets are committed to git — `.env` is in `.gitignore`, and `.env.example` documents every required variable with placeholder values.

## Endpoints

| Method | Path                       | Access                                                                                             |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/api/health`              | Public                                                                                             |
| POST   | `/api/auth/register`       | Public                                                                                             |
| POST   | `/api/auth/login`          | Public                                                                                             |
| GET    | `/api/auth/me`             | Authenticated                                                                                      |
| GET    | `/api/events`              | Authenticated (filters: `status`, `available`, `location`, `startAfter`, `startBefore`; paginated) |
| GET    | `/api/events/:id`          | Authenticated                                                                                      |
| POST   | `/api/events`              | ADMIN                                                                                              |
| PATCH  | `/api/events/:id`          | ADMIN                                                                                              |
| DELETE | `/api/events/:id`          | ADMIN                                                                                              |
| POST   | `/api/bookings`            | Authenticated (optional `Idempotency-Key` header)                                                  |
| GET    | `/api/bookings`            | Authenticated, own bookings only (filters: `status`; paginated)                                    |
| GET    | `/api/bookings/:id`        | Authenticated, own bookings only                                                                   |
| PATCH  | `/api/bookings/:id/cancel` | Authenticated, own bookings only                                                                   |

Full request/response examples, auth requirements, and error responses for every endpoint are in Swagger UI (`/api/docs`).

## Conventions

- Success: `{ "success": true, "message": "...", "data": {} }`
- Error: `{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }`
- Status codes used: `200 201 400 401 403 404 409 422 500`

## Business Rules

- `availableSeats` is set to `totalSeats` on event creation and is never accepted from the client, on create or update — enforced at the schema/validation level, verified by dedicated injection tests.
- Changing `totalSeats` keeps `availableSeats` consistent with already-booked seats; it cannot go below the booked count.
- **Event delete behavior:** an event with booked seats (`availableSeats < totalSeats`) cannot be deleted (`409`). Cancel it via `PATCH { "status": "CANCELLED" }` instead.
- `totalAmount` on a booking is always calculated server-side (`price × quantity`) — never accepted from the client.
- Booking status transitions are explicitly restricted: `PENDING → CONFIRMED`, `PENDING → CANCELLED`, `CONFIRMED → CANCELLED` only. `CANCELLED` is terminal.
- Registration always creates a `USER`; admins are created via `npm run seed:admin`.

## Booking Concurrency

### The race condition

A naive booking flow — read `availableSeats`, check it in application code, then write the new value — is not safe under concurrent requests. Two requests can both read the same "before" value before either writes, both pass the check, and both write, causing a **lost update** (a classic check-then-act race condition). The check and the write are separate database round-trips; Node.js processes other requests' code while one request is `await`ing a call, so the gap between read and write is a real window where another request can interleave. No amount of `if`-statement logic closes a gap that exists between two separate network calls.

### How overbooking is prevented

```js
Event.findOneAndUpdate(
  { _id: eventId, availableSeats: { $gte: quantity } },
  { $inc: { availableSeats: -quantity } },
);
```

This performs the condition check and the update as **one atomic operation** on a single document. MongoDB guarantees no other write to that document can be interleaved inside it. A losing request's filter simply fails to match (seats already gone), and the call returns `null` instead of applying a stale calculation — never a negative count, never an oversold event.

### How atomic operations are used (and why not a database transaction)

Seat deduction and booking creation were originally wrapped in a MongoDB multi-document transaction (`session.withTransaction`) to guarantee both succeed or both roll back together. **This was changed after load testing revealed a critical performance problem**, described below.

Instead, the two steps are now separate atomic single-document operations, coordinated by an explicit **compensating-action (saga) pattern** in the application layer:

```
1. Atomically deduct seats (single-document op)
2. Try to create the booking
   → succeeds: done
   → fails: delete the booking (if partially created) AND restore the seats (compensate)
```

Each step alone is still fully atomic and race-proof — that guarantee never depended on the transaction, it depends on MongoDB's single-document atomicity, which holds with or without a transaction wrapping it. What changed is _how_ the two steps are kept consistent with each other: instead of the database enforcing all-or-nothing atomicity across both, the application explicitly reverses step 1 if step 2 fails.

**Why the change:** MongoDB transactions carry real overhead — lock coordination, replica-set consensus, and critically, the driver's built-in automatic retry on `WriteConflict` with no backoff between attempts. Under high concurrency (50+ simultaneous requests against one event), most transactions collided, retried near-instantly, and re-collided with each other's retries — a **thundering herd**. Load testing showed average response times climbing to **~59 seconds**, with a maximum observed latency of **~74 seconds**, while correctness remained perfect throughout (no overbooking occurred even under this pathological contention).

After removing the transaction and replacing it with the compensating-action pattern, the same 100-seat/500-request scenario dropped to an average response time of **~13 seconds**, with a maximum of **~14.4 seconds** — a roughly 4-5x improvement — while every correctness guarantee (verified via the full automated test suite) remained intact.

**Honest tradeoff:** a true ACID transaction protects even against a server crash occurring _between_ the two steps. The compensating-action approach has a narrow window — a crash after booking creation but before compensation runs — where manual reconciliation would be needed. This is accepted in exchange for eliminating unusable latency under real concurrent load. The remaining ~13s under 500 simultaneous requests to one document is not a bug: MongoDB serializes writes to a single document regardless of transaction use, and this is the inherent cost of safely handling that level of contention on one counter. A production system anticipating genuinely massive simultaneous demand for one event would address this with a different architecture entirely (sharded seat inventory, queue-based booking) — a scope decision beyond this project.

### How idempotency works

Clients can send an optional `Idempotency-Key` header with `POST /bookings` to make retries safe:

- The key is inserted into a dedicated `IdempotencyKey` collection **before** processing — using an insert-first pattern against a **unique index** on `(userId, idempotencyKey)**`, so the actual concurrency guarantee is enforced by MongoDB itself, not an application-level `findOne`-then-`create` check (which would have the same race condition as unprotected seat booking).
- A **repeated** request with the same key and the same payload returns the **original stored response** (a replay), without creating a second booking or deducting seats twice.
- A repeated request with the same key but a **different payload** (e.g. different `quantity`) is rejected with `422`, preventing key reuse for an unrelated request.
- **Concurrent identical requests** with the same key: only one wins the unique-index insert and proceeds; the rest either see the result once it's `COMPLETED` (replay) or get a `409` if it's still `PENDING`. Verified with 20 truly simultaneous identical requests producing exactly one booking.
- Idempotency records expire automatically after 24 hours via a MongoDB TTL index — no manual cleanup job needed.

## Testing

All automated tests use `node:test` + Supertest, running in-process against the Express app (no server process needed) with an isolated test database (`TEST_MONGO_URI`).

```bash
npm test
```

**18 passing tests across 8 files**, covering:

- Normal booking, overbooking rejection, concurrent booking (20 requests/10 seats)
- Transaction/compensation rollback in both directions (failure before and after booking creation)
- Idempotency: replay, payload-mismatch rejection, 20 concurrent identical requests
- Booking state-machine rules (unit tests) and concurrent cancellation (20 simultaneous cancels on one booking)
- Full end-to-end user journey (register → login → browse → book → view → cancel → verify)
- Concurrent mixed operations (100 bookings + 20 cancellations + 20 idempotent retries against one event, invariant verified)
- Security: seat-count injection attempts rejected on both create and update; idempotency key length validation

### Manual concurrency testing

`scripts/concurrency-test.js` is a configurable script for driving real concurrent load against a running server:

```bash
$env:TEST_TOKEN = "<jwt>"
node scripts/concurrency-test.js --eventId="<id>" --requests=500 --quantity=1
```

Tested at three scales this week:

| Scenario | Seats | Requests | Result                        | Avg response time                                                          |
| -------- | ----- | -------- | ----------------------------- | -------------------------------------------------------------------------- |
| Small    | 10    | 20       | 10 succeeded, 10 failed (409) | ~140ms                                                                     |
| Medium   | 50    | 100      | 50 succeeded, 50 failed       | ~59.3s _(pre-fix, with transaction)_                                       |
| Large    | 100   | 500      | 100 succeeded, 400 failed     | ~59.3s avg / ~74s max _(pre-fix)_ → **~13.3s avg / ~14.4s max (post-fix)** |

In every case: `successful bookings + remaining seats = total seats`, exactly, with zero overbooking and zero negative seat counts.
