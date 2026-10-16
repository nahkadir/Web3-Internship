import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { canAccessTicket } from "../services/ticketAccess.js";

const getCookie = (header = "", name) => {
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
};

let io = null;

export const ticketRoom = (ticketId) => `ticket:${ticketId}`;
export const userRoom = (userId) => `user:${userId}`;

// no-ops when sockets aren't running (e.g. REST-only tests)
export const emitTo = (rooms, event, payload) => {
  io?.to(rooms).emit(event, payload);
};

export const removeUserFromTicket = (userId, ticketId) => {
  io?.in(userRoom(userId)).socketsLeave(ticketRoom(ticketId));
};

const publicUser = (u) => ({ _id: u.id, name: u.name, role: u.role });

// distinct users currently in a room, ignoring one socket
const usersInRoom = async (room, ignoreSocketId) => {
  const sockets = await io.in(room).fetchSockets();
  const users = new Map();
  for (const s of sockets) {
    if (s.id !== ignoreSocketId)
      users.set(s.data.user.id, publicUser(s.data.user));
  }
  return users;
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // 1) authenticate every connection using the same httpOnly cookie as the REST API
  io.use(async (socket, next) => {
    try {
      const token = getCookie(socket.handshake.headers.cookie, "token");
      if (!token) return next(new Error("Not authenticated"));
      const { id } = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(id);
      if (!user || !user.isActive) return next(new Error("Not authenticated"));
      socket.data.user = { id: user.id, name: user.name, role: user.role };
      next();
    } catch {
      next(new Error("Not authenticated"));
    }
  });

  io.on("connection", (socket) => {
    const me = socket.data.user;
    socket.join(userRoom(me.id)); // personal room for events like "you were assigned a ticket"

    const announceLeft = async (room) => {
      const others = await usersInRoom(room, socket.id);
      // only announce when this was the user's last open tab/connection in the room
      if (!others.has(me.id)) {
        io.to(room).emit("user_left", {
          ticketId: room.slice("ticket:".length),
          user: publicUser(me),
        });
      }
    };

    // 2) rooms: join only if the database says this user may access the ticket
    socket.on("join_ticket", async (ticketId, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
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
