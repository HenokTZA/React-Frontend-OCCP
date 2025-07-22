import { useEffect, useState } from "react";
import { fetchJson }           from "@/lib/api";
import { useAuth }             from "@/lib/auth";

/* helper ──────────────────────────────────────────────────────────────── */
function fmt(dt) {
  // nice fallback ↴
  return dt ? new Date(dt).toLocaleString() : "—";
}

export default function Dashboard() {
  /* ──────────────────────────────────────────────────────────────────── */
  /* 1. tenant info, cps, sessions                                       */
  /* ──────────────────────────────────────────────────────────────────── */
  const [me,       setMe]       = useState(null);
  const [cps,      setCps]      = useState(null);   // null = loading
  const [sessions, setSessions] = useState(null);

  const POLL_MS = 5_000;

  const { logout } = useAuth();                    // kick-out helper

  /* who am I? ---------------------------------------------------------- */
  useEffect(() => {
    fetchJson("/me")
      .then(setMe)
      .catch(err => { console.error(err); logout(); });
  }, []);

  /* once we know there *is* a tenant → load data ----------------------- */
  useEffect(() => {
    if (!me?.tenant_ws) return;                   // nothing to load yet
    Promise.all([
      fetchJson("/charge-points/"),
      fetchJson("/sessions/"),
    ])
      .then(([cpList, sessionList]) => {
        setCps(cpList);
        setSessions(sessionList);
      })
      .catch(console.error);
  }, [me]);

  useEffect(() => {
    if (!me?.tenant_ws) return;                 // still not ready
    const t = setInterval(() => {
      Promise.all([fetchJson("/charge-points/"),
                   fetchJson("/sessions/")])
        .then(([cpList, sessionList]) => {
          setCps(cpList);
          setSessions(sessionList);
        })
        .catch(console.error);
    }, POLL_MS);
    return () => clearInterval(t);              // tidy up on unmount
  }, [me]);

  /* ────────────────────────── UI states ────────────────────────────── */
  if (!me)                   return <p className="p-8">Loading…</p>;
  if (!me.tenant_ws)         return <p className="p-8">You don’t own a tenant yet — contact an administrator.</p>;
  if (!cps || !sessions)     return <p className="p-8">Loading charge-points…</p>;

  /* ───────────────────────── dashboard ─────────────────────────────── */
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* websocket URL */}
      <div>
        <p className="mb-1">Connect your charge-points to:</p>
        <code className="block p-2 bg-slate-100 rounded">
          {me.tenant_ws.replace(/^ws:\/\/[^/]+/, "ws://147.93.127.215:9000")}
        </code>
      </div>

      {/* charge-points */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Charge-points</h2>
        {cps.length === 0 ? (
          <p>No charge-points yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th>ID</th><th>Status</th><th>Connector</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {cps.map(cp => (
                <tr key={cp.id} 
                    className="border-b last:border-0 cursor-pointer hover:bg-slate-100"
                    onClick={() => location.href = `/cp/${cp.id}`}
                >
                  <td>{cp.id}</td>
                  <td>{cp.status}</td>
                  <td>{cp.connector_id}</td>
                  <td>{fmt(cp.updated)}</td>
                  <td>{new Date(cp.updated).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* recent sessions */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Recent sessions</h2>
        {sessions.length === 0 ? (
          <p>No sessions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th>ID</th><th>CP</th><th>kWh</th><th>Started</th><th>Stopped</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="border-b last:border-0">
                  <td>{s.id}</td>
                  <td>{s.cp}</td>
                  <td>{(s.kWh ?? 0).toFixed(3)}</td>
                  <td>{fmt(s.Started)}</td>
                  <td>{fmt(s.Ended)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

