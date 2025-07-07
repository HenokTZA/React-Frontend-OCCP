export const API_ROOT = "/api";          // Vite proxy rewrites to backend

export async function fetchJson(path) {
  const res = await fetch(`${API_ROOT}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

