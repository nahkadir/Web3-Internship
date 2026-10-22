import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { canAccessTicket } from "../services/ticketAccess.js";

let io = null;

export const ticketRoom = (ticketId) => `ticket:${ticketId}`;
export const userRoom = (userId) => `user:${userId}`;

export const emitTo = (rooms, event, payload) => {
  io?.to(rooms).emit(event, payload);
};

export const removeUserFromTicket = (userId, ticketId) => {
  io?.in(userRoom(userId)).socketsLeave(ticketRoom(ticketId));
};

const publicUser = (u) => ({ _id: u.id, name: u.name, role: u.role });

const usersInRoom = async (room, ignoreSocketId) => {
  const sockets = await io.in(room).fetchSockets();
  const users = new Map();
  for (const s of sockets) {
    if (s.id !== ignoreSocketId)
      users.set(s.data.user.id, publicUser(s.data.user));
  }
  return users;
};

const getCookie = (header = "", name) => {
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
};

// a short-lived socket token (cross-domain setups) or the normal login cookie (same-site setups)
const userIdFromHandshake = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken) {
    const decoded = jwt.verify(authToken, env.jwtSecret);
    if (decoded.purpose !== "socket") throw new Error("Wrong token type");
    return decoded.id;
  }
  const cookieToken = getCookie(socket.handshake.headers.cookie, "token");
  if (!cookieToken) throw new Error("No token");
  const decoded = jwt.verify(cookieToken, env.jwtSecret);
  if (decoded.purpose) throw new Error("Wrong token type");
  return decoded.id;
};

const MAX_TICKET_ROOMS = 20;
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_EVENTS = 40;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrls, credentials: true },
    maxHttpBufferSize: 1e5, // 100 KB per message, so nobody can push huge payloads
  });

  io.engine.on("connection_error", (err) =>
    logger.warn("Socket engine error", {
      code: err.code,
      message: err.message,
    }),
  );

  io.use(async (socket, next) => {
    try {
      const user = await User.findById(userIdFromHandshake(socket));
      if (!user || !user.isActive) return next(new Error("Not authenticated"));
      socket.data.user = { id: user.id, name: user.name, role: user.role };
      next();
    } catch {
      next(new Error("Not authenticated"));
    }
  });

  io.on("connection", (socket) => {
    const me = socket.data.user;
    socket.join(userRoom(me.id));

    // errors on one connection are logged and contained; they never reach the process
    socket.on("error", (err) =>
      logger.warn("Socket error", { userId: me.id, error: err.message }),
    );

    let windowStart = Date.now();
    let count = 0;
    socket.use((packet, next) => {
      const now = Date.now();
      if (now - windowStart > RATE_WINDOW_MS) {
        windowStart = now;
        count = 0;
      }
      if (++count > RATE_MAX_EVENTS)
        return next(new Error("Rate limit exceeded"));
      next();
    });

    const announceLeft = async (room) => {
      const others = await usersInRoom(room, socket.id);
      if (!others.has(me.id)) {
        io.to(room).emit("user_left", {
          ticketId: room.slice("ticket:".length),
          user: publicUser(me),
        });
      }
    };

    socket.on("join_ticket", async (ticketId, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const joined = [...socket.rooms].filter((r) =>
          r.startsWith("ticket:"),
        ).length;
        if (joined >= MAX_TICKET_ROOMS)
          return reply({ ok: false, message: "Too many open tickets" });

        if (!(await canAccessTicket(me.id, ticketId))) {
          return reply({
            ok: false,
            message: "Ticket not found or access denied",
          });
        }
        const room = ticketRoom(ticketId);
        const present = await usersInRoom(room, socket.id);
        const firstConnection = !present.has(me.id);
        await socket.join(room);
        present.set(me.id, publicUser(me));
        if (firstConnection)
          socket
            .to(room)
            .emit("user_joined", { ticketId, user: publicUser(me) });
        reply({ ok: true, presence: [...present.values()] });
      } catch {
        reply({ ok: false, message: "Could not join ticket" });
      }
    });

    socket.on("leave_ticket", async (ticketId, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        if (typeof ticketId === "string") {
          const room = ticketRoom(ticketId);
          if (socket.rooms.has(room)) {
            await socket.leave(room);
            await announceLeft(room);
          }
        }
        reply({ ok: true });
      } catch {
        reply({ ok: false });
      }
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms].filter((r) => r.startsWith("ticket:"));
      rooms.forEach((room) => announceLeft(room).catch(() => {}));
    });
  });

  return io;
};
