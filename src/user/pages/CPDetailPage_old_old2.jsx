import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { fetchJson } from "@/lib/api";

export default function CPDetailPage({ byCode = false }) {
  const { cpId, code } = useParams();
  const [search] = useSearchParams();
  const [cp, setCp]   = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const isCharging = useMemo(() => cp?.status === "Charging", [cp]);

  async function refresh() {
    const path = byCode
      ? `/public/charge-points/by-code/${encodeURIComponent(code)}/` // only if you add this backend route
      : `/public/charge-points/${encodeURIComponent(cpId)}/`;
    const data = await fetchJson(path);
    setCp(data);
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();

        // If we returned from Stripe success, confirm payment and start charging
        const sessionId = search.get("session_id");
        if (sessionId) {
          setBusy(true);
          try {
            await fetchJson(`/public/charge-points/${encodeURIComponent(cpId)}/start-after-checkout/`, {
              method: "POST",
              body: JSON.stringify({ session_id: sessionId }),
            });
            await refresh();
          } finally {
            setBusy(false);
          }
        }
      } catch (e) {
        setErr("Forbidden or not found");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byCode, cpId, code]);

  async function onStart() {
    setBusy(true);
    try {
      // You can compute amount from cp.price_per_hour or expose a picker; default 5 EUR
      const { url } = await fetchJson(`/public/charge-points/${encodeURIComponent(cpId)}/checkout/`, {
        method: "POST",
        body: JSON.stringify({ amount_cents: 500, currency: "eur" }),
      });
      window.location.href = url; // redirect to Stripe
    } finally {
      setBusy(false);
    }
  }

  async function onStop() {
    setBusy(true);
    try {
      await fetchJson(`/public/charge-points/${encodeURIComponent(cpId)}/stop/`, { method: "POST" });
      // give the OCSP → status pipeline a moment or poll until it flips
      setTimeout(refresh, 1200);
    } finally {
      setBusy(false);
    }
  }

  if (err) return <div className="p-4">{err}</div>;
  if (!cp) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <Link to="/app/map" className="link">← Back to map</Link>
      <h1 className="text-2xl font-semibold">{cp.name || `CP #${cp.pk ?? cp.id}`}</h1>

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

      {/* Session info */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm opacity-70">Session energy</div>
              <div className="text-2xl font-semibold">{(cp.current_kwh ?? 0).toFixed(3)} kWh</div>
            </div>
            <div className="flex gap-2">
              {!isCharging ? (
                <button
                  className={`btn btn-primary ${busy ? "btn-disabled" : ""}`}
                  disabled={busy || cp.status === "Faulted"}
                  onClick={onStart}
                >
                  {busy ? "Redirecting…" : "Start Charging"}
                </button>
              ) : (
                <button
                  className={`btn btn-error ${busy ? "btn-disabled" : ""}`}
                  disabled={busy}
                  onClick={onStop}
                >
                  {busy ? "Stopping…" : "Stop Charging"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {cp.lat != null && cp.lng != null && (
        <div className="text-sm opacity-70">Coords: {cp.lat}, {cp.lng}</div>
      )}
    </div>
  );
}

