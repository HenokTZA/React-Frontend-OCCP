import { useEffect, useState } from "react";
import { fetchJson }           from "@/lib/api";
import { useAuth }             from "@/lib/auth";

export default function Dashboard() {
  /* ──────────────────────────────────────────────────────────────────── */
  /* 1.  tenant info, cps, sessions                                     */
  /* ──────────────────────────────────────────────────────────────────── */
  const [me,        setMe]        = useState(null);
  const [cps,       setCps]       = useState(null);   // null = loading
  const [sessions,  setSessions]  = useState(null);

  const { logout } = useAuth();                      // kick-out helper

  // first call: who am I?
  useEffect(() => {
    fetchJson("/me")
      .then(setMe)
      .catch(err => { console.error(err); logout(); });
  }, []);

  // once we know the user owns a tenant ⇒ fetch its data
  useEffect(() => {
    if (!me?.tenant_ws) return;                      // nothing to load yet

    Promise.all([
      fetchJson("/charge-points/"),
      fetchJson("/sessions/"),
    ])
      .then(([cpList, sessionList]) => {
        setCps(cpList);
        setSessions(sessionList);
      })
      .catch(console.error);                         // keep simple
  }, [me]);

  /* ────────────────────────── UI states ────────────────────────────── */
  if (!me)                    return <p className="p-8">Loading…</p>;
  if (!me.tenant_ws)          return <p className="p-8">You don’t own a tenant yet — contact an administrator.</p>;
  if (!cps || !sessions)      return <p className="p-8">Loading charge-points…</p>;

  /* ───────────────────────── dashboard ─────────────────────────────── */
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* websocket URL */}
      <div>
        <p className="mb-1">Connect your charge-points to:</p>
        <code className="block p-2 bg-slate-100 rounded">
          {me.tenant_ws.replace(/^ws:\/\/[^/]+/, "ws://147.92.127.215:9000")}
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
                <tr key={cp.id} className="border-b last:border-0">
                  <td>{cp.id}</td>
                  <td>{cp.status}</td>
                  <td>{cp.connector_id}</td>
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
                <tr key={s.tx_id} className="border-b last:border-0">
                  <td>{s.tx_id}</td>
                  <td>{s.cp}</td>
                  <td>{(s.kwh || 0).toFixed(3)}</td>
                  <td>{new Date(s.start_time).toLocaleString()}</td>
                  <td>{s.stop_time ? new Date(s.stop_time).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

