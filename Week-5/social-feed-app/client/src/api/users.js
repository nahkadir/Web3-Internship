import { api } from "./client";

export const getMyProfile = () => api("/users/me");
export const updateMyProfile = (payload) =>
  api("/users/me", { method: "PATCH", body: payload });
export const getPublicProfile = (id) => api(`/users/${id}`);
export const searchUsers = (search, page = 1) =>
  api(`/users?search=${encodeURIComponent(search)}&page=${page}`);
export const followUser = (id) =>
  api(`/users/${id}/follow`, { method: "POST" });
export const unfollowUser = (id) =>
  api(`/users/${id}/follow`, { method: "DELETE" });
export const getFollowers = (id, page = 1) =>
  api(`/users/${id}/followers?page=${page}`);
export const getFollowing = (id, page = 1) =>
  api(`/users/${id}/following?page=${page}`);
