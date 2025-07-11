export const API_ROOT = "/api";

export async function fetchJson(path, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("accessToken");
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...headers,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  // if 204 No Content, return null
  return res.status === 204 ? null : res.json();
}


