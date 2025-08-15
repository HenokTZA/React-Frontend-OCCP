// src/lib/api.js
/*****************************************************************
 * 🔥 ABSOLUTE API ROOT — HARD-CODED
 *     keep the “/api” suffix, no trailing slash afterwards.
 *****************************************************************/
const API_ROOT = "http://147.93.127.215:8000/api";

/** Build absolute URL from a relative path like "charge-points/" or "/charge-points/". */
function makeUrl(path) {
  return `${API_ROOT}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Read auth headers from localStorage token. */
export function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Generic JSON fetcher (GET/POST/PATCH/etc.), returns parsed JSON (or null for 204). */
export async function fetchJson(path, options = {}) {
  const url = makeUrl(path);

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    body: options.body,
  });

  if (!res.ok) {
    // Try to surface server error messages nicely
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const maybeJson = text ? JSON.parse(text) : null;
      if (maybeJson && (maybeJson.detail || maybeJson.error)) {
        detail = maybeJson.detail || maybeJson.error;
      }
    } catch {
      /* noop */
    }
    throw new Error(detail || `HTTP ${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/** Blob fetcher for file downloads (PDF/XLSX reports, etc.). */
export async function fetchBlob(path, options = {}) {
  const url = makeUrl(path);

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      // Only set content-type if we actually send a JSON body
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    body: options.body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  }
  return res.blob();
}

/** Convenience: POST JSON and parse JSON response. */
export function postJson(path, data, options = {}) {
  return fetchJson(path, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
    ...(options || {}),
  });
}

/** Convenience: PATCH JSON and parse JSON response. */
export function patchJson(path, data, options = {}) {
  return fetchJson(path, {
    method: "PATCH",
    body: JSON.stringify(data ?? {}),
    ...(options || {}),
  });
}

/** Trigger a download in the browser for a Blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

