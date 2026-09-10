import type { Task } from "../../types";

const BASE_URL = "http://localhost:5000/api/tasks";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assignedUser?: string;
}

export const createTask = async (
  data: CreateTaskInput,
  token: string,
): Promise<Task> => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to create task");
  }

  return result;
};

export interface TaskFilters {
  priority?: string;
  assignedTo?: string;
  status?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
}

export const getTasks = async (
  token: string,
  filters?: TaskFilters,
): Promise<Task[]> => {
  const params = new URLSearchParams();
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.assignedTo) params.set("assignedTo", filters.assignedTo);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);

  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`${BASE_URL}${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to fetch tasks");
  }

  return result;
};

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assignedUser?: string;
}

export const updateTask = async (
  id: string,
  data: UpdateTaskInput,
  token: string,
): Promise<Task> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to update task");
  }

  return result;
};

export const deleteTask = async (id: string, token: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to delete task");
  }
};
