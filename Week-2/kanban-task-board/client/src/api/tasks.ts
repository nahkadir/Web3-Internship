import type { Task } from "../../types";

const BASE_URL = "https://kanban-task-board-api-gilt.vercel.app/api/tasks";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
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

export const getTasks = async (token: string): Promise<Task[]> => {
  const res = await fetch(BASE_URL, {
    method: "GET",
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
