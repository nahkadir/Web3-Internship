const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors; // [{ field, message }] from backend validation
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include", // sends the httpOnly auth cookie
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data.message || "Something went wrong",
      res.status,
      data.errors || [],
    );
  }
  return data;
}
