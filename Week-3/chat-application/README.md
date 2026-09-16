# Real-Time Chat Application

A full-stack chat application built with React, Node.js, Express, and MongoDB. Day 1 covers project architecture, authentication, and the initial data models for upcoming real-time messaging.

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS v4, React Router

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt

**Docs:** Swagger (OpenAPI)

## Project Structure

```
chat-app/
├── backend/
│ ├── src/
│ │ ├── config/ # DB connection, Swagger setup
│ │ ├── controllers/ # request/response handling
│ │ ├── services/ # business logic
│ │ ├── models/ # Mongoose schemas
│ │ ├── middleware/ # auth guard, error handler
│ │ ├── routes/ # route definitions
│ │ ├── utils/ # token generation, validators
│ │ └── server.js
│ └── package.json
└── frontend/
├── src/
│ ├── context/ # AuthContext
│ ├── lib/ # API client
│ ├── pages/ # Login, Register, Dashboard, Profile
│ ├── routes/ # ProtectedRoute
│ └── App.tsx
└── package.json
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in values below
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in VITE_API_URL
npm run dev
```

## Environment Variables

**backend/.env**
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `PORT` | Server port (default 5000) |
| `CLIENT_URL` | Frontend origin, required for CORS (e.g. `http://localhost:5173`) |

**frontend/.env**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |

## API Documentation

Interactive Swagger docs available at `http://localhost:5000/api-docs` once the backend is running. Covers all endpoints below with request/response schemas and an "Authorize" button for testing protected routes.

## Endpoints

| Method | Route                | Protected |
| ------ | -------------------- | --------- |
| GET    | `/api/health`        | No        |
| POST   | `/api/auth/register` | No        |
| POST   | `/api/auth/login`    | No        |
| GET    | `/api/auth/me`       | Yes       |
| GET    | `/api/users/me`      | Yes       |
| PATCH  | `/api/users/me`      | Yes       |

## Data Models

- **User** — name, email, password (hashed), avatar, timestamps
- **Conversation** — type (private/group), name, timestamps
- **ConversationMember** — links users to conversations (unique per pair)
- **Message** — conversationId, senderId, content, messageType, timestamps

## Features Implemented (Day 1)

- Full auth flow: register, login, JWT issuance
- Password hashing with bcrypt
- Auth middleware protecting private routes
- User profile fetch/update (restricted to safe fields)
- Chat data models designed with correct relationships
- Frontend auth UI: login, register, protected dashboard, profile edit
- Swagger API documentation

## Real-Time Messaging (Socket.io)

### Setup

Socket.io is attached to the same HTTP server as Express — no separate port or service needed. Backend `.env` requires the same `JWT_SECRET` used for REST auth, since socket connections are authenticated with the same tokens.

No additional environment variables are needed beyond what's listed above; `CLIENT_URL`/CORS config is shared between REST and Socket.io.

### How It Works

- On login, the frontend establishes a single authenticated socket connection using the JWT.
- Opening a conversation joins its Socket.io room (`join_conversation`); leaving it removes the socket from that room (`leave_conversation`).
- Sending a message (`send_message`) validates membership and content server-side, persists it to MongoDB, then broadcasts it to everyone in the room (`receive_message`) — including the sender.
- Message history loads via `GET /api/conversations/:conversationId/messages` before joining the room, so users see prior messages immediately, with new messages arriving in real time afterward.

### Socket Events

| Event                 | Direction       | Payload                                                |
| --------------------- | --------------- | ------------------------------------------------------ |
| `join_conversation`   | Client → Server | `{ conversationId }`                                   |
| `joined_conversation` | Server → Client | `{ conversationId }`                                   |
| `leave_conversation`  | Client → Server | `{ conversationId }`                                   |
| `send_message`        | Client → Server | `{ conversationId, content }`                          |
| `receive_message`     | Server → Client | `{ id, conversationId, senderId, content, createdAt }` |
| `error`               | Server → Client | `{ message }`                                          |

### Testing Real-Time Messaging

1. Open two separate browser profiles or an incognito window alongside a normal window (regular tabs share `localStorage`, so two tabs of the same browser will conflict on auth tokens).
2. Log in as two different users, one per window.
3. Select each other from the user list to start a conversation.
4. Send messages from either side — they should appear instantly in both windows without a refresh.
5. Refresh either window mid-conversation — message history should persist via the REST endpoint.
