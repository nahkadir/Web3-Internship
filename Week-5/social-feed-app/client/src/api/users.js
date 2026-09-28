import { api } from "./client";

export const getMyProfile = () => api("/users/me");
