// src/lib/api.js
/*****************************************************************
 * 🔥  ABSOLUTE API ROOT — HARD-CODED
 *     keep the “/api” suffix, no trailing slash afterwards.
 *****************************************************************/
const API_ROOT = "http://147.93.127.215:8000/api";

export async function fetchJson(path, options = {}) {
  // allow both “charge-points/” and “/charge-points/”
  const url = `${API_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;

  const token = localStorage.getItem("accessToken");

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}


