import mongoose from "mongoose";
import { env } from "./env.js";

let connection = null;

export const connectDB = () => {
  if (!connection) {
    connection = mongoose
      .connect(env.databaseUrl)
      .then(() => console.log("MongoDB connected"))
      .catch((err) => {
        connection = null;
        throw err;
      });
  }
  return connection;
};
