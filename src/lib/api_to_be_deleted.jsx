// src/lib/api.js
export const API_ROOT = "/api";   // proxied by Vite

/** Return "Bearer <accessToken>" or undefined */
function authHeader() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Generic helper.
 *  - `opts` can include method / body / headers like native fetch.
 *  - Adds JSON headers + JWT header automatically.
 */
export async function fetchJson(path, opts = {}) {
  const res = await fetch(`${API_ROOT}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...opts.headers,
    },
    ...opts,
  });

  if (!res.ok) {
    // throw the raw body so callers can show server messages
    throw new Error(await res.text());
  }
  // Some endpoints (e.g. 201 Created) return empty body → guard
  return res.headers.get("content-type")?.includes("json") ? res.json() : null;
}


