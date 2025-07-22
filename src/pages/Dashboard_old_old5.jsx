import { useEffect, useState } from "react";
import { fetchJson }           from "@/lib/api";
import { useAuth }             from "@/lib/auth";

/* helpers ─────────────────────────────────────────────────────────── */
const fmt = dt => (dt ? new Date(dt).toLocaleString() : "—");

/* localStorage helpers (avoid copy-pasting key names) */
const LS_KWH = "cp_price_kwh";
const LS_HOUR = "cp_price_hour";
const LS_LOC  = "cp_location";
const loadLS  = key => {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); }
  catch { return {}; }
};
const saveLS  = (key, obj) => localStorage.setItem(key, JSON.stringify(obj));

/* ────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [me,       setMe]        = useState(null);
  const [cps,      setCps]       = useState(null);
  const [sessions, setSessions]  = useState(null);

  /* per-CP metadata we manage locally */
  const [priceKwh, setPriceKwh]  = useState(() => loadLS(LS_KWH));
  const [priceHr,  setPriceHr ]  = useState(() => loadLS(LS_HOUR));
  const [locMap,   setLocMap ]   = useState(() => loadLS(LS_LOC));

  /* which CP’s ⋮ menu is open, if any */
  const [menuOpen, setMenuOpen]  = useState(null);

  /* auth ----------------------------------------------------------- */
  const { logout } = useAuth();
  useEffect(() => {
    fetchJson("/me")
      .then(setMe)
      .catch(err => { console.error(err); logout(); });
  }, []);

  /* data fetch & polling ------------------------------------------ */
  useEffect(() => {
    if (!me?.tenant_ws) return;
    const load = () =>
      Promise.all([fetchJson("/charge-points/"), fetchJson("/sessions/")])
        .then(([cpList, sessionList]) => { setCps(cpList); setSessions(sessionList); })
        .catch(console.error);
    load();
    const t = setInterval(load, 5_000);
    return () => clearInterval(t);
  }, [me]);

  /* update helpers ------------------------------------------------- */
  const updatePrice = (id, kwh, hr) => {
    const nextKwh = { ...priceKwh, [id]: kwh };
    const nextHr  = { ...priceHr,  [id]: hr  };
    setPriceKwh(nextKwh);  saveLS(LS_KWH, nextKwh);
    setPriceHr(nextHr);    saveLS(LS_HOUR, nextHr);
  };
  const updateLoc = (id, loc) => {
    const next = { ...locMap, [id]: loc };
    setLocMap(next);       saveLS(LS_LOC, next);
  };

  /* UI states ------------------------------------------------------ */
  if (!me)               return <p className="p-8">Loading…</p>;
  if (!me.tenant_ws)     return <p className="p-8">You don’t own a tenant yet — contact an administrator.</p>;
  if (!cps || !sessions) return <p className="p-8">Loading charge-points…</p>;

  /* ─────────────────────────── render ──────────────────────────── */
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* websocket url */}
      <div>
        <p className="mb-1">Connect your charge-points to:</p>
        <code className="block p-2 bg-slate-100 rounded">
          {me.tenant_ws.replace(/^ws:\/\/[^/]+/, "ws://147.93.127.215:9000")}
        </code>
      </div>

      {/* charge-points table */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Charge-points</h2>
        {cps.length === 0 ? (
          <p>No charge-points yet.</p>
        ) : (
          <table className="w-full text-sm relative">
            <thead className="text-left border-b">
              <tr>
                <th>ID</th><th>Status</th><th>Connector</th>
                <th>Updated</th>
                <th className="text-right">€/kWh</th>
                <th className="text-right">€/h</th>
                <th></th>{/* menu col */}
              </tr>
            </thead>
            <tbody>
              {cps.map(cp => {
                const id = cp.id;
                const k  = priceKwh[id] ?? "";
                const h  = priceHr[id]  ?? "";
                return (
                  <tr key={id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="cursor-pointer" onClick={() => location.href=`/cp/${id}`}>{id}</td>
                    <td>{cp.status}</td>
                    <td>{cp.connector_id}</td>
                    <td>{fmt(cp.updated)}</td>
                    <td className="text-right">{k || "—"}</td>
                    <td className="text-right">{h || "—"}</td>
                    <td className="relative">
                      <button
                        className="px-2 text-lg leading-none select-none"
                        onClick={() => setMenuOpen(m => m===id ? null : id)}
                      >⋮</button>

                      {menuOpen === id && (
                        <div
                          className="absolute right-0 z-10 mt-1 w-40 bg-white border rounded shadow"
                          onMouseLeave={() => setMenuOpen(null)}
                        >
                          <Item
                            label="✏️  Edit connector"
                            onClick={() => {
                              const pK = prompt("Price per kWh (€)", k) ?? k;
                              const pH = prompt("Price per hour (€)", h) ?? h;
                              updatePrice(id, Number(pK)||0, Number(pH)||0);
                              setMenuOpen(null);
                            }}
                          />
                          <Item
                            label="📍 Set location"
                            onClick={() => {
                              const loc = prompt("Location", locMap[id] ?? "") ?? "";
                              updateLoc(id, loc.trim());
                              setMenuOpen(null);
                            }}
                          />
                          <Item label="👥 Define users"   onClick={()=>setMenuOpen(null)} disabled/>
                          <Item label="🗓️  Define times" onClick={()=>setMenuOpen(null)} disabled/>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* recent sessions ------------------------------------------------ */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Recent sessions</h2>
        {sessions.length === 0 ? (
          <p>No sessions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left border-b">
              <tr>
                <th>ID</th><th>CP</th><th>kWh</th>
                <th>Started</th><th>Stopped</th>
                <th className="text-right">Total (€)</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const kwh   = Number(s.kWh ?? 0);
                const price = priceKwh[s.cp] ?? 0;
                const total = price ? (kwh * price).toFixed(2) : "—";
                return (
                  <tr key={s.id} className="border-b last:border-0">
                    <td>{s.id}</td>
                    <td>{s.cp}</td>
                    <td>{kwh.toFixed(3)}</td>
                    <td>{fmt(s.Started)}</td>
                    <td>{fmt(s.Ended)}</td>
                    <td className="text-right">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/* small helper component for menu rows */
const Item = ({ label, onClick, disabled=false }) => (
  <button
    disabled={disabled}
    onClick={!disabled ? onClick : undefined}
    className={
      "w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 disabled:text-slate-400"
    }
  >
    {label}
  </button>
);

