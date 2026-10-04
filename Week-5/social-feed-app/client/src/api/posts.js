import { api } from "./client";

export const getFeed = (page = 1, limit = 10, search = "") =>
  api(
    `/posts?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
  );
export const createPost = (payload) =>
  api("/posts", { method: "POST", body: payload });
export const updatePost = (id, payload) =>
  api(`/posts/${id}`, { method: "PATCH", body: payload });
export const deletePost = (id) => api(`/posts/${id}`, { method: "DELETE" });
export const likePost = (id) => api(`/posts/${id}/like`, { method: "POST" });
export const unlikePost = (id) =>
  api(`/posts/${id}/like`, { method: "DELETE" });
