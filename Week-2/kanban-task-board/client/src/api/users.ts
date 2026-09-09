// Frontend counterpart to the Express route
// It's the function React will actually call to fetch users from the backend.

export interface User {
  _id: string;
  name: string;
  email: string;
}

const BASE_URL = "https://kanban-task-board-api-gilt.vercel.app/api/users";

export const getUsers = async (token: string): Promise<User[]> => {
  const res = await fetch(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to fetch users");
  }

  return result;
};
