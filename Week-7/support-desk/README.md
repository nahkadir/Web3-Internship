# Support Desk — Customer Support Ticketing Platform

A full-stack MERN support platform with role-based access (Customer, Agent, Admin), threaded real-time conversations, notifications, SLA tracking and an admin analytics dashboard.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Socket.IO client, Recharts
- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, Zod validation, JWT in httpOnly cookies, bcrypt
- **Tests:** Vitest, Supertest, mongodb-memory-server, socket.io-client, React Testing Library
- **Deployment:** Render (API + WebSockets + SLA worker), Vercel (frontend), MongoDB Atlas

## Getting started

**Prerequisites:** Node.js 20+, a MongoDB instance (local or Atlas).

```bash
git clone <repo-url> && cd support-desk

# backend
cd server
npm install
cp .env.example .env        # then fill in the values
npm run seed:admin          # creates the first admin from ADMIN_* in .env
npm run dev                 # http://localhost:5000

# frontend (new terminal)
cd client
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

There are no migrations: Mongoose creates collections and indexes on first start. If you have tickets from before the SLA feature, run `npm run backfill:sla` once.

**Production:** `cd server && npm start` and `cd client && npm run build` (output in `client/dist`).

**Tests:** `cd server && npm test` and `cd client && npm test`.

## Environment variables (server)

| Variable                                      | Purpose                                                        |
| --------------------------------------------- | -------------------------------------------------------------- |
| `MONGO_URI`                                   | MongoDB connection string (required)                           |
| `JWT_SECRET`                                  | Signing secret, 32+ characters in production (required)        |
| `JWT_EXPIRES_IN`                              | Login lifetime (default `7d`)                                  |
| `CLIENT_URL`                                  | Allowed frontend origin(s), comma-separated, no trailing slash |
| `NODE_ENV`                                    | `development`, `test` or `production`                          |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by `npm run seed:admin`                                   |

Client: `VITE_API_URL`, `VITE_SOCKET_URL`.

## Roles and permissions

| Role         | Can do                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **CUSTOMER** | Create tickets, view their own tickets, edit subject/description/category while OPEN, cancel or close, reply in their conversations |
| **AGENT**    | View tickets assigned to them, reply, change status and priority/category, resolve                                                  |
| **ADMIN**    | Everything an agent can on any ticket, plus assign/reassign tickets, manage user roles, view analytics                              |

New accounts are always CUSTOMER. The first admin is created with `npm run seed:admin`. Permissions are enforced on the backend; the UI only hides actions. Anything outside a user's scope returns 404, so ticket existence is never leaked.

## Ticket lifecycle

Statuses: `OPEN`, `IN_PROGRESS`, `WAITING_FOR_CUSTOMER`, `RESOLVED`, `CLOSED`, `CANCELLED` (CLOSED and CANCELLED are final).

| From                 | Customer               | Agent (assigned)               | Admin                                             |
| -------------------- | ---------------------- | ------------------------------ | ------------------------------------------------- |
| OPEN                 | CANCELLED              | IN_PROGRESS                    | IN_PROGRESS, CANCELLED, CLOSED                    |
| IN_PROGRESS          | —                      | WAITING_FOR_CUSTOMER, RESOLVED | WAITING_FOR_CUSTOMER, RESOLVED, CLOSED, CANCELLED |
| WAITING_FOR_CUSTOMER | IN_PROGRESS, CANCELLED | IN_PROGRESS, RESOLVED          | IN_PROGRESS, RESOLVED, CLOSED, CANCELLED          |
| RESOLVED             | CLOSED, OPEN (reopen)  | IN_PROGRESS                    | IN_PROGRESS, OPEN, CLOSED                         |

A transition that is invalid for everyone returns 400; one valid for another role returns 403. A customer reply on a WAITING_FOR_CUSTOMER ticket moves it back to IN_PROGRESS.

## SLA rules

| Priority          | First response | Resolution |
| ----------------- | -------------- | ---------- |
| URGENT (Critical) | 1 hour         | 4 hours    |
| HIGH              | 4 hours        | 24 hours   |
| MEDIUM            | 8 hours        | 3 days     |
| LOW               | 24 hours       | 7 days     |

- Deadlines are `createdAt + target`, calculated on the server in calendar time.
- First response = the first reply by an agent or admin (resolving a ticket also counts).
- Changing priority recalculates targets that are not yet met, from creation time.
- Warnings are sent 30 min before a first-response deadline and 2 h before a resolution deadline; a breach notification is sent once when a deadline passes.
- A worker runs every minute; the notification and analytics endpoints also trigger a throttled sweep, and `GET /api/internal/sla-sweep` supports external cron.

## API reference

All routes are under `/api` and need a login cookie unless noted.

| Method      | Endpoint                                                   | Description                                                                                                             |
| ----------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| POST        | `/auth/register`, `/auth/login`, `/auth/logout`            | Account and session (register/login are public and rate-limited)                                                        |
| GET         | `/auth/me`, `/auth/socket-token`                           | Current user; 2-minute token for WebSocket auth                                                                         |
| POST        | `/tickets`                                                 | Create a ticket (CUSTOMER)                                                                                              |
| GET         | `/tickets`                                                 | List my tickets. Query: `status, priority, category, assignedTo, from, to, search, overdue, sortBy, order, page, limit` |
| GET / PATCH | `/tickets/:id`                                             | Ticket details / update permitted fields                                                                                |
| PATCH       | `/tickets/:id/status`                                      | Change status (body: `status`)                                                                                          |
| GET / POST  | `/tickets/:id/messages`                                    | History (`limit`, `before`) / send a reply                                                                              |
| PATCH       | `/tickets/:id/messages/:messageId`                         | Edit own message within 15 minutes                                                                                      |
| GET         | `/notifications`                                           | My notifications + `unreadCount` (`page`, `limit`, `unread`)                                                            |
| PATCH       | `/notifications/:id/read`, `/notifications/read-all`       | Mark as read                                                                                                            |
| GET / PATCH | `/admin/users`, `/admin/users/:id/role`                    | User management (ADMIN)                                                                                                 |
| GET         | `/admin/tickets`                                           | All tickets with the same filters (ADMIN)                                                                               |
| PATCH       | `/admin/tickets/:id/assign`                                | Assign or reassign an agent (body: `agentId`)                                                                           |
| GET         | `/admin/analytics/overview`, `/tickets`, `/agents`, `/sla` | Aggregated analytics; query `from`, `to`, `groupBy`                                                                     |
| GET         | `/health`                                                  | Public health check (503 when the database is down)                                                                     |
| GET         | `/internal/sla-sweep`                                      | SLA sweep, requires `Authorization: Bearer CRON_SECRET`                                                                 |

Errors always look like `{ "success": false, "message": "...", "errors": [...] }`.

## WebSocket events

Connections authenticate with the login cookie or `auth: { token }` from `/auth/socket-token`. Users can only join rooms for tickets they may access (re-checked against the database on every join).

| Direction       | Event                         | Payload                                                                      |
| --------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| client → server | `join_ticket`, `leave_ticket` | `ticketId` (+ ack with `ok`, `presence`)                                     |
| server → client | `ticket_message`              | `{ message }` (new, edited or system message; clients de-duplicate by `_id`) |
| server → client | `ticket_updated`              | `{ ticketId, fields, updatedBy }`                                            |
| server → client | `ticket_status_changed`       | `{ ticketId, status, previousStatus, changedBy }`                            |
| server → client | `ticket_assigned`             | `{ ticketId, assignedTo }` (also sent to the agent's personal room)          |
| server → client | `user_joined`, `user_left`    | `{ ticketId, user }` (first and last connection only)                        |
| server → client | `notification`                | `{ notification }` (sent to the user's personal room)                        |

## Security

httpOnly + secure cookies, bcrypt (12 rounds), Zod validation on every input, regex-escaped search, body size limit, helmet, CORS allow-list, rate limits (API, auth, ticket creation, messaging, per-socket events), role checks on every route and socket join, generic 500 responses with secret-redacting structured logs, and database indexes for tickets, messages, notifications and analytics.

## Known limitations

- SLA uses calendar time and does not pause while waiting for the customer.
- Render's free tier sleeps when idle (cold start; the SLA worker pauses, then catches up).
- Ticket lists refresh live only for new assignments; other list changes need a refresh.
- No email notifications, password reset or refresh tokens; the 7-day login cannot be revoked server-side.
- Registration reveals whether an email is already taken.
- The WebSocket layer is not horizontally scaled (it needs a Redis adapter for multiple instances).
- Frontend tests cover guards and SLA display only; the main flows are covered by the backend end-to-end test.
