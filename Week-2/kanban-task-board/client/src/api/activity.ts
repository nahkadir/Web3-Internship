export interface ActivityEntry {
  _id: string;
  task: string;
  user: { _id: string; name: string; email: string };
  action: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

const BASE_URL = "http://localhost:5000/api";

export const getActivity = async (
  taskId: string,
  token: string,
): Promise<ActivityEntry[]> => {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}/activity`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed to fetch activity");
  return result;
};
