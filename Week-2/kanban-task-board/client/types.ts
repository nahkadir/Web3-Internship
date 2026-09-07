export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "in-progress" | "done";

export interface Task {
  id: number;
  title: string;
  priority: Priority;
  status: Status;
}

export interface User {
  name: string;
  email: string;
}
