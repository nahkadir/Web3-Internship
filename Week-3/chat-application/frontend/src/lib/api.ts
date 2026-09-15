// api.ts centralizes all the repetitive fetch logic, while files like tasks.ts/users.ts focus only on which API endpoint they need to call.

const API_URL = import.meta.env.VITE_API_URL;

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: object;
};

export const apiRequest = async (
  endpoint: string,
  options: ApiOptions = {},
) => {
  const token = localStorage.getItem("token");
  // If the user is logged in, their JWT token is retrieved so it can be sent to the backend

  // individual API files only need to provide the endpoint
  console.log("API_URL:", API_URL);
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
