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
