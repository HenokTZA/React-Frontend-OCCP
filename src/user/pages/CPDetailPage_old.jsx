import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchJson } from "@/lib/api";

export default function CPDetailPage() {
  const { cpId } = useParams();
  const [cp, setCp] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson(`/charge-points/${cpId}/`);
        setCp(data);
      } catch (e) {
        setErr("Failed to load charge point");
      }
    })();
  }, [cpId]);

  if (err) return <div className="p-4">{err}</div>;
  if (!cp) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <Link to="/app/map" className="link">← Back to map</Link>
      <h1 className="text-2xl font-semibold">{cp.name || `CP #${cp.id}`}</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <div><b>Owner:</b> {cp.owner_username || "—"}</div>
            <div><b>Address:</b> {cp.location || "—"}</div>
            <div><b>Status:</b> <span className="badge">{cp.status}</span></div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <div><b>Price (energy):</b> {cp.price_per_kwh ?? "—"} €/kWh</div>
            <div><b>Price (time):</b> {cp.price_per_hour ?? "—"} €/h</div>
            <div><b>Updated:</b> {cp.updated ? new Date(cp.updated).toLocaleString() : "—"}</div>
          </div>
        </div>
      </div>

      {cp.lat != null && cp.lng != null && (
        <div className="text-sm opacity-70">Coords: {cp.lat}, {cp.lng}</div>
      )}
    </div>
  );
}

