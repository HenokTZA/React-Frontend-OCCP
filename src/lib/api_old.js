// src/lib/api.js
//------------------------------------------------------------
// Tiny wrapper around fetch() that
//  • prepends API_ROOT once (no double “/api/api” issues)
//  • attaches Authorization: Bearer <token> if we have one
//  • throws parsed JSON error bodies so callers can show feedback
//------------------------------------------------------------
export const API_ROOT = "/api";      // vite.config.js proxies this to :8000

export async function fetchJson(path, options = {}) {
  // strip any leading /api so we don't double it
  const cleanPath = path.replace(/^\/?api\/?/, "");
  const url       = `${API_ROOT}/${cleanPath.replace(/^\/+/, "")}`;

  const access    = localStorage.getItem("access");   // saved after login
  const headers   = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(access && { Authorization: `Bearer ${access}` }),
  };

  const res = await fetch(url, { ...options, headers });

  // ––––– handle non-2xx responses –––––
  if (!res.ok) {
    let detail;
    try {
      detail = await res.json();    // DRF error bodies are JSON
    } catch {
      detail = { detail: await res.text() };
    }
    throw detail;                   // caller can inspect .detail etc.
  }

  // 204 No Content → return null
  if (res.status === 204) return null;

  return res.json();
}

