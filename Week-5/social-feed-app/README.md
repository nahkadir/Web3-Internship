# Social Media Feed App

A full-stack social media feed application built with the MERN stack, featuring authentication, posts, likes, comments, follow relationships, a personalized feed, and real-time-style notifications.

## Features

- JWT-based authentication (httpOnly cookies)
- User profiles with avatar, bio, and edit support
- Create, edit, delete posts with optional images
- Like/unlike posts
- Comment on posts, with edit/delete
- Follow/unfollow users, with followers/following lists
- Personalized feed (followed users + your own posts) alongside a global feed
- User and post search
- Notifications for likes, comments, and follows, with unread tracking
- Fully responsive UI (desktop three-column layout, mobile bottom nav)
- Swagger API documentation

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Zod, Swagger
- **Frontend:** React, Vite, React Router, Tailwind CSS, lucide-react

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in your values
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Environment Variables

### Server (`server/.env`)

| Variable         | Description                   |
| ---------------- | ----------------------------- |
| `NODE_ENV`       | `development` or `production` |
| `PORT`           | Server port                   |
| `MONGO_URI`      | MongoDB connection string     |
| `JWT_SECRET`     | Secret for signing JWTs       |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d`     |
| `CLIENT_URL`     | Frontend origin, for CORS     |
| `SERVER_URL`     | Backend's own public URL      |

### Client (`client/.env`)

| Variable       | Description                                            |
| -------------- | ------------------------------------------------------ |
| `VITE_API_URL` | Backend API base URL, e.g. `http://localhost:5000/api` |

## Database Setup

Point `MONGO_URI` at a local MongoDB instance or a MongoDB Atlas cluster. Collections and indexes are created automatically by Mongoose on first run — no manual migration needed.

## API Overview

Full interactive documentation is available at `/api-docs` when running in development. Core endpoint groups:

- `POST/GET /api/auth/*` — register, login, logout, session check
- `GET/PATCH /api/users/*` — profiles, search
- `POST/DELETE /api/users/:id/follow`, `GET /api/users/:id/followers|following`
- `POST/GET/PATCH/DELETE /api/posts/*`
- `POST/DELETE /api/posts/:id/like`
- `POST/GET/PATCH/DELETE /api/posts/:id/comments`, `/api/comments/:id`
- `GET /api/feed` — personalized feed
- `GET/PATCH /api/notifications/*`

## Local Development

Run backend (`npm run dev` in `server/`) and frontend (`npm run dev` in `client/`) simultaneously. Frontend defaults to `http://localhost:5173`, backend to `http://localhost:5000`.

## Production Deployment

1. Set all server env vars for production (see table above), using a real `CLIENT_URL` and a strong `JWT_SECRET`.
2. Set `client/.env.production` with your deployed backend's `VITE_API_URL`.
3. Build the frontend: `npm run build` in `client/` — deploy the resulting `dist/` folder as a static site.
4. Deploy the backend with `npm start` as the start command.
5. Confirm CORS: `CLIENT_URL` on the backend must exactly match the deployed frontend's origin.
6. Confirm cookies work cross-origin: `secure: true` and `sameSite: "none"` require HTTPS on both ends in production.
