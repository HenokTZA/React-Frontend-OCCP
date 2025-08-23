// src/user/pages/CPDetailPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { fetchJson } from "@/lib/api";

export default function CPDetailPage({ byCode = false }) {
  const { cpId, code } = useParams();
  const [search] = useSearchParams();

  const [cp, setCp] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [processedSession, setProcessedSession] = useState(false);

  const isCharging = useMemo(() => cp?.status === "Charging", [cp?.status]);
  const cpRef = useRef(null);
  useEffect(() => {
    cpRef.current = cp;
  }, [cp]);

  async function refresh() {
    // NOTE: /by-code/ only works if you add that backend route; otherwise use id
    const path = byCode
      ? `/public/charge-points/by-code/${encodeURIComponent(code)}/`
      : `/public/charge-points/${encodeURIComponent(cpId)}/`;
    const data = await fetchJson(path);
    setCp(data);
    return data;
  }

  // Poll helper (used after stop to flip button back)
  async function pollUntilNotCharging(timeoutMs = 15000, everyMs = 1000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const data = await refresh();
      if (data?.status !== "Charging") return true;
      await new Promise((r) => setTimeout(r, everyMs));
    }
    return false;
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();

        // If Stripe redirected back with ?session_id=..., handle once then strip it
        const sessionId = search.get("session_id");
        if (sessionId && !processedSession) {
          setProcessedSession(true);
          setBusy(true);
          try {
            await fetchJson(
              `/public/charge-points/${encodeURIComponent(cpId)}/start-after-checkout/`,
              {
                method: "POST",
                body: JSON.stringify({ session_id: sessionId }),
              }
            );
            // Remove query param so refresh won't re-trigger start
            window.history.replaceState({}, "", window.location.pathname);
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
  }, [byCode, cpId, code, processedSession]);

  // While charging, poll periodically for live kWh / status
  useEffect(() => {
    if (!cp || cp.status !== "Charging") return;
    const id = setInterval(() => {
      refresh().catch(() => {});
    }, 2000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cp?.status]);

  async function onStart() {
    setBusy(true);
    try {
      // You can compute amount from tariff or add a UI selector; default €5
      const { url } = await fetchJson(
        `/public/charge-points/${encodeURIComponent(cpId)}/checkout/`,
        { method: "POST", body: JSON.stringify({ amount_cents: 500, currency: "eur" }) }
      );
      window.location.href = url; // redirect to Stripe Checkout
    } finally {
      setBusy(false);
    }
  }

  async function onStop() {
    setBusy(true);
    try {
      // Optimistic UI: reflect transition immediately
      setCp((prev) => (prev ? { ...prev, status: "Finishing" } : prev));
      await fetchJson(`/public/charge-points/${encodeURIComponent(cpId)}/stop/`, {
        method: "POST",
      });
      await pollUntilNotCharging(); // ensure button flips back reliably
    } finally {
      setBusy(false);
    }
  }

  if (err) return <div className="p-4">{err}</div>;
  if (!cp) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 max-w-2xl space-y-4">
      <Link to="/app/map" className="link">
        ← Back to map
      </Link>
      <h1 className="text-2xl font-semibold">
        {cp.name || `CP #${cp.pk ?? cp.id}`}
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <div>
              <b>Owner:</b> {cp.owner_username || "—"}
            </div>
            <div>
              <b>Address:</b> {cp.location || "—"}
            </div>
            <div>
              <b>Status:</b> <span className="badge">{cp.status}</span>
            </div>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body">
            <div>
              <b>Price (energy):</b> {cp.price_per_kwh ?? "—"} €/kWh
            </div>
            <div>
              <b>Price (time):</b> {cp.price_per_hour ?? "—"} €/h
            </div>
            <div>
              <b>Updated:</b>{" "}
              {cp.updated ? new Date(cp.updated).toLocaleString() : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Session info + controls */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm opacity-70">Session energy</div>
              <div className="text-2xl font-semibold">
                {Number(cp.current_kwh || 0).toFixed(3)} kWh
              </div>
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
        <div className="text-sm opacity-70">
          Coords: {cp.lat}, {cp.lng}
        </div>
      )}
    </div>
  );
}

