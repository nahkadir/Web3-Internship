# Event Booking API

Express + MongoDB backend for an Event Booking System (Day 1: auth, events, RBAC).

## Setup

```bash
npm install
cp .env.example .env   # then edit values
npm run seed:admin     # creates the admin user from ADMIN_* env vars
npm run dev
```

- API: http://localhost:5000/api
- Swagger UI: http://localhost:5000/api/docs
- OpenAPI JSON: http://localhost:5000/api/docs.json

## Environment variables

| Name                                      | Purpose                       |
| ----------------------------------------- | ----------------------------- |
| PORT                                      | Server port                   |
| NODE_ENV                                  | development or production     |
| MONGO_URI                                 | MongoDB connection string     |
| JWT_SECRET                                | Secret used to sign tokens    |
| JWT_EXPIRES_IN                            | Token lifetime (e.g. 1d)      |
| CLIENT_URL                                | Allowed CORS origin           |
| ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD | Used by the admin seed script |

## Endpoints

| Method | Path               | Access        |
| ------ | ------------------ | ------------- |
| GET    | /api/health        | Public        |
| POST   | /api/auth/register | Public        |
| POST   | /api/auth/login    | Public        |
| GET    | /api/auth/me       | Authenticated |
| GET    | /api/events        | Authenticated |
| GET    | /api/events/:id    | Authenticated |
| POST   | /api/events        | ADMIN         |
| PATCH  | /api/events/:id    | ADMIN         |
| DELETE | /api/events/:id    | ADMIN         |

## Conventions

- Success: `{ "success": true, "message": "...", "data": {} }`
- Error: `{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }`
- Status codes: 200, 201, 400, 401, 403, 404, 409, 500

## Business rules

- `availableSeats` is set to `totalSeats` on creation and is never accepted from the client.
- Changing `totalSeats` keeps `availableSeats` consistent with already-booked seats; it cannot go below the booked count.
- **Delete behavior:** an event with booked seats (`availableSeats < totalSeats`) cannot be deleted (`409`). Cancel it by setting `status` to `CANCELLED` via `PATCH`.
- Registration always creates a `USER`; admins are created with `npm run seed:admin`.

## Concurrency: the booking race condition

### The problem

A naive booking flow — read `availableSeats`, check it in application code,
then write the new value — is not safe under concurrent requests. Two
requests can both read the same "before" value before either writes,
both pass the check, and both write, causing a lost update where the
final seat count doesn't reflect both bookings (a classic
"check-then-act" race condition).

### Why application-level checks aren't enough

The check and the write are separate round-trips to the database. Node.js
processes other requests' code while one request is `await`ing a database
call, so the gap between "read" and "write" is a real window where
another request's read/write can interleave. No amount of `if`-statement
logic closes a gap that exists between two separate network calls.

### The fix

`Event.findOneAndUpdate({ _id, availableSeats: { $gte: quantity } }, { $inc: { availableSeats: -quantity } })`
performs the condition check and the update as a single atomic operation
on one document. MongoDB guarantees no other write to that document can
be interleaved inside it. A losing request's filter simply fails to
match (seats already gone), and `findOneAndUpdate` returns `null` instead
of applying a stale calculation.

### Booking creation + seat deduction as one unit

The atomic seat deduction and the `Booking.create` call are wrapped in a
MongoDB transaction (`session.withTransaction`). This guarantees both
succeed together or both roll back together — never seats-deducted-with-
no-booking, and never booking-created-with-no-seat-deduction.
