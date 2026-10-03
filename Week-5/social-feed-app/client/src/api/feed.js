import { api } from "./client";

export const getPersonalizedFeed = (page = 1) => api(`/feed?page=${page}`);
