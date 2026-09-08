export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "in-progress" | "done";

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  owner: string;
  assignedUser: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  name: string;
  email: string;
}
