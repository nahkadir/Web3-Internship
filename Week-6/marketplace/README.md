# Multi-Vendor Marketplace

A full-stack marketplace where vendors sell through their own stores, customers shop across vendors in one cart, and admins run the platform. It includes online payments with signed webhooks, vendor commissions and refunds.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS v4, React Router
- **Backend:** Node.js, Express, MongoDB (Mongoose), Zod validation
- **Security:** JWT in an httpOnly cookie, bcrypt, Helmet, CORS allow-list, rate limiting
- **Payments:** provider interface with a mock provider (hosted checkout, HMAC-signed webhooks, refunds)
- **Testing:** Vitest, Supertest, mongodb-memory-server
- **Deployment:** Vercel (frontend and backend as two projects) + MongoDB Atlas

## Setup

```bash
# backend
cd backend
cp .env.example .env        # fill in the values
npm install
npm run seed                # demo admin + vendor accounts (development only)
npm run seed:marketplace    # categories + an approved demo store
npm run dev                 # http://localhost:5000

# frontend
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

No migrations are needed: Mongoose creates collections and indexes on first start.

## Tests

```bash
cd backend && npm test      # unit, API and integration tests (in-memory MongoDB, no setup needed)
cd frontend && npm run build   # production build check
```

## Demo accounts (development only)

`npm run seed` creates `admin@marketplace.com` and `vendor@marketplace.com` (passwords are printed in `src/scripts/seed.js`). **Change or delete them in any shared environment.**
To create accounts yourself: register a customer in the UI; apply as a vendor from the customer dashboard; approve the vendor as admin.

## Roles and permissions

| Feature                                               | Customer | Vendor                 | Admin |
| ----------------------------------------------------- | -------- | ---------------------- | ----- |
| Browse, search, order, pay                            | yes      | yes (not own products) | yes   |
| Apply as vendor                                       | yes      | n/a                    | no    |
| Manage own products                                   | no       | approved vendors       | no    |
| View and fulfil own order items                       | no       | paid orders only       | no    |
| View own earnings                                     | no       | yes                    | no    |
| Manage vendors, categories, orders, payments, refunds | no       | no                     | yes   |

## Order and payment workflow

1. Checkout validates the cart, reserves stock and creates a `PENDING` / `UNPAID` order (prices and totals come from the database).
2. The customer pays on the provider's hosted page. The backend creates the payment session for the stored order total.
3. The payment becomes `PAID` only through a **signed webhook** or a **server-side lookup at the provider** (`/payments/verify`). The browser redirect is never trusted.
4. `PAID` confirms the order and creates one commission per item (rate from `COMMISSION_RATE`).
5. Vendors fulfil (`PROCESSING → SHIPPED → DELIVERED`). Delivered items settle their commission.
6. Unpaid orders expire after `PAYMENT_WINDOW_MINUTES` and their stock is released. Failed or cancelled payments can be retried.
7. Admin refunds go through the provider, cancel the order, restore unshipped stock and reverse commissions.

Lifecycle maps live in `backend/src/constants/lifecycle.js`. Important actions are recorded in the `AuditLog` collection (`GET /api/admin/audit-logs`).

## API overview

| Area            | Endpoints                                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Auth            | `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me`                                         |
| Vendors         | `POST /api/vendors`, `GET /api/vendors/me`, admin `GET/PATCH /api/admin/vendors`                           |
| Catalog         | `GET /api/products`, `GET /api/products/:id`, `GET /api/categories`                                        |
| Vendor          | `/api/vendor/products`, `/api/vendor/orders`, `GET /api/vendor/earnings`                                   |
| Cart and orders | `/api/cart`, `POST /api/checkout`, `GET /api/orders`                                                       |
| Payments        | `POST /api/payments/create`, `/verify`, `/webhook`                                                         |
| Admin           | `/api/admin/orders`, `/api/admin/payments`, `POST .../refund`, `/api/admin/stats`, `/api/admin/audit-logs` |
| Health          | `GET /api/health`                                                                                          |

## Security

Server-side authorization on every protected route, Zod validation, bcrypt (cost 12), httpOnly cookies, Helmet, CORS allow-list, rate limits on login/register/checkout/payments, no client-supplied prices, roles or statuses, HMAC webhook verification with replay protection, idempotent webhooks, secrets only in environment variables, and no stack traces in production.

## Deployment (Vercel + Atlas)

1. Create an Atlas cluster, a database user and allow `0.0.0.0/0`. Use the connection string as `DATABASE_URL`.
2. **Backend project:** root `backend`, framework "Other". Set the env vars from `.env.example` with `NODE_ENV=production`, a 32+ character `JWT_SECRET`, `BACKEND_URL` and `FRONTEND_URL` set to the real URLs, and `ALLOW_MOCK_PAYMENTS=true` for the demo.
3. **Frontend project:** root `frontend`. In `frontend/vercel.json`, point the `/api` rewrite at the backend URL.
4. Redeploy the backend after changing any environment variable, then run the seed scripts against Atlas once.
5. Check `https://<backend>/api/health`, then run through the demo flow.

## Enabling a real payment provider

1. Create `backend/src/payments/<provider>/` implementing the same five methods as the mock: `createSession`, `sessionUrl`, `retrieveTransaction`, `refund`, `parseWebhook`.
2. Register it in `backend/src/payments/index.js` and set `PAYMENT_PROVIDER` and the provider's keys.
3. In the provider dashboard, set the webhook URL to `<BACKEND_URL>/api/payments/webhook` and use the signing secret as `PAYMENT_WEBHOOK_SECRET`.
4. Remove `ALLOW_MOCK_PAYMENTS`. Make sure provider sessions expire at the same time as the order's payment window.

## Known limitations

- The mock provider simulates payments only. It must not be used for real money.
- Stock is reserved with atomic updates and rollback rather than MongoDB transactions (transactions need a replica set such as Atlas).
- The expired-order sweep uses `setInterval`, which does not run on serverless hosting. Expiry is also enforced when a customer tries to pay. A scheduled job could run it on Vercel.
- Rate limiting is in-memory per instance and keyed by IP, so it is approximate on serverless.
- Product images and store logos are URLs (no file uploads). Refunds are full refunds only.
- Frontend tests are a manual QA checklist, not automated.
