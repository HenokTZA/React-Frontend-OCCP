// src/pages/DiagnoseList.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchJson } from "@/lib/api";

export default function DiagnoseList() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchJson("/charge-points/")
      .then((data) => setItems(Array.isArray(data) ? data : data.results || []))
      .catch((e) => setErr(e.message || "failed to load"));
  }, []);

  const filtered = items.filter((cp) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      String(cp.id).includes(q) ||
      (cp.name && cp.name.toLowerCase().includes(s)) ||
      (cp.serialNumber && cp.serialNumber.toLowerCase().includes(s))
    );
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diagnose → Charge Points</h1>
        <button className="link" onClick={() => nav(-1)}>Back</button>
      </div>

      <input
        className="input input-bordered w-full max-w-xl"
        placeholder="Search by name or ID…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {err && <p className="text-sm text-red-500">{err}</p>}

      <div className="grid gap-3">
        {filtered.map((cp) => (
          <Link
            key={cp.id}
            to={`/diagnose/${cp.id}`}
            className="p-4 rounded-xl border hover:shadow transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{cp.name || `CP ${cp.id}`}</div>
                <div className="text-sm text-slate-500">
                  ID: {cp.id}
                  {cp.serialNumber ? ` · SN: ${cp.serialNumber}` : ""}
                </div>
              </div>
              <span className="badge">{cp.status || "Unknown"}</span>
            </div>
          </Link>
        ))}
      </div>

      {!err && filtered.length === 0 && (
        <p className="text-slate-500">No charge points found.</p>
      )}
    </div>
  );
}



