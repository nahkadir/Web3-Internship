import { api } from "./client";

export const getFeed = (page = 1, limit = 10) =>
  api(`/posts?page=${page}&limit=${limit}`);
export const createPost = (payload) =>
  api("/posts", { method: "POST", body: payload });
export const updatePost = (id, payload) =>
  api(`/posts/${id}`, { method: "PATCH", body: payload });
export const deletePost = (id) => api(`/posts/${id}`, { method: "DELETE" });
