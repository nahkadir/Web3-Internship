export interface Comment {
  _id: string;
  task: string;
  author: { _id: string; name: string; email: string };
  content: string;
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const getComments = async (
  taskId: string,
  token: string,
): Promise<Comment[]> => {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to fetch comments");
  return result;
};

export const createComment = async (
  taskId: string,
  content: string,
  token: string,
): Promise<Comment> => {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to add comment");
  return result;
};

export const updateComment = async (
  commentId: string,
  content: string,
  token: string,
): Promise<Comment> => {
  const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to update comment");
  return result;
};

export const deleteComment = async (
  commentId: string,
  token: string,
): Promise<void> => {
  const res = await fetch(`${BASE_URL}/comments/${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to delete comment");
};
