import { api } from "./client";

export const getComments = (postId, page = 1, limit = 20) =>
  api(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
export const createComment = (postId, content) =>
  api(`/posts/${postId}/comments`, { method: "POST", body: { content } });
export const updateComment = (id, content) =>
  api(`/comments/${id}`, { method: "PATCH", body: { content } });
export const deleteComment = (id) =>
  api(`/comments/${id}`, { method: "DELETE" });
