const BASE = import.meta.env.VITE_API_BASE || ""; // e.g. https://your-api.com

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.error || res.statusText);
  return data;
}

export const ocppApi = {
  listChargePoints: () => api("/api/charge-points"),
  reset: (chargePointId, type = "Soft") =>
    api("/api/ocpp/commands/reset", {
      method: "POST",
      body: JSON.stringify({ chargePointId, type }),
    }),
  getDiagnostics: (chargePointId, location) =>
    api("/api/ocpp/commands/getDiagnostics", {
      method: "POST",
      body: JSON.stringify({ chargePointId, location }),
    }),
  firmwareStatusNotification: (chargePointId, status = "Idle") =>
    api("/api/ocpp/commands/firmwareStatusNotification", {
      method: "POST",
      body: JSON.stringify({ chargePointId, status }),
    }),
};

