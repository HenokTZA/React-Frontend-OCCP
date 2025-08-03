/**********************************************************************
 * Dashboard.jsx – prices + location stored in DB (no localStorage)   *
 *********************************************************************/
import { useEffect, useState } from "react";
import { createPortal }        from "react-dom";
import { fetchJson }           from "@/lib/api";
import { useAuth }             from "@/lib/auth";

/* ─────────────── helpers ────────────────────────────────────────── */
const fmt = d => (d ? new Date(d).toLocaleString() : "—");

/** one-liner wrapper around fetchJson for PATCHing a CP row */
function patchCP(id, body) {
  return fetchJson(`/charge-points/${id}/`, {
    method : "PATCH",
    body   : JSON.stringify(body),
  });
}

/* ────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  /* server-side data */
  const [me,  setMe ] = useState(null);
  const [cps, setCps] = useState(null);
  const [sessions,setSes]=useState(null);

  /* menu / modal UI state */
  const [menuOpen ,setMenu ] = useState(null);   // cp id | null (⋮ menu)
  const [editCP  ,setEdit ] = useState(null);    // cp id | null (price modal)
  const [locCP   ,setLocCP] = useState(null);    // cp id | null (location modal)

  /* temp input fields inside the two modals */
  const [tmpK,setTmpK]  = useState("");
  const [tmpH,setTmpH]  = useState("");
  const [tmpL,setTmpL]  = useState("");

  /* login + first fetch */
  const { logout } = useAuth();
  useEffect(() => {
    fetchJson("/me").then(setMe).catch(() => logout());
  }, []);

  /* load + poll every 5 s */
  useEffect(() => {
    if (!me?.tenant_ws) return;
    const load = () =>
      Promise
        .all([fetchJson("/charge-points/"), fetchJson("/sessions/")])
        .then(([c, s]) => { setCps(c); setSes(s); });

    load();
    const t = setInterval(load, 5_000);
    return () => clearInterval(t);
  }, [me]);

  /* optimistic UI helpers ----------------------------------------- */
  async function updatePrices(id) {
    const pk = Number(tmpK) || 0;
    const ph = Number(tmpH) || 0;
    await patchCP(id, { price_per_kwh: pk, price_per_hour: ph });
    setCps(arr => arr.map(c =>
      c.id === id ? { ...c, price_per_kwh: pk, price_per_hour: ph } : c
    ));
  }

  async function updateLocation(id) {
    const location = tmpL.trim();
    await patchCP(id, { location });
    setCps(arr => arr.map(c =>
      c.id === id ? { ...c, location } : c
    ));
  }

  /* early returns */
  if (!me)             return <p className="p-8">Loading…</p>;
  if (!me.tenant_ws)   return <p className="p-8">You don’t own a tenant yet.</p>;
  if (!cps || !sessions) return <p className="p-8">Loading charge-points…</p>;

  /* ─────────────── render ───────────────────────────────────────── */
  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* websocket url */}
      <div>
        <p className="mb-1">Connect your charge-points to:</p>
        <code className="block p-2 bg-slate-100 rounded">
          {me.tenant_ws.replace(/^ws:\/\/[^/]+/, "ws://147.93.127.215:9000")}
        </code>
      </div>

      {/* charge-points */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Charge-points</h2>

        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th>ID</th><th>Status</th><th>Conn</th><th>Updated</th>
              <th className="text-right">€/kWh</th>
              <th className="text-right">€/h</th><th></th>
            </tr>
          </thead>
          <tbody>
  {cps.map(cp => {
    const fmtPrice = v =>
      v == null ? "—" : Number(v).toFixed(3);     // 3 dec for kWh
    const fmtHour  = v =>
      v == null ? "—" : Number(v).toFixed(2);     // 2 dec for €/h

    return (
      <tr
        key={cp.id}
        className="border-b last:border-0 hover:bg-slate-50"
      >
        {/* ── ident / quick-link ───────────────────────── */}
        <td
          className="cursor-pointer"
          onClick={() => (location.href = `/cp/${cp.id}`)}
        >
          {cp.id}
        </td>

        {/* ── live status coming from the backend ─────── */}
        <td>{cp.status}</td>
        <td>{cp.connector_id}</td>
        <td>{fmt(cp.updated)}</td>

        {/* ── persisted prices ────────────────────────── */}
        <td className="text-right">{fmtPrice(cp.price_per_kwh)}</td>
        <td className="text-right">{fmtHour(cp.price_per_hour)}</td>

        {/* ── “⋮” context menu ───────────────────────── */}
        <td className="relative">
          <button
            className="px-2 text-lg"
            onClick={() => setMenu(m => (m === cp.id ? null : cp.id))}
          >
            ⋮
          </button>

          {menuOpen === cp.id && (
            <ul
              className="absolute right-0 z-10 mt-1 w-48 bg-white border rounded shadow"
              onMouseLeave={() => setMenu(null)}
            >
              <Li
                label="✏️  Edit connector"
                cb={() => {
                  /* pre-fill modal fields with CURRENT values */
                  setTmpK(cp.price_per_kwh  ?? "");
                  setTmpH(cp.price_per_hour ?? "");
                  setEdit(cp.id);
                  setMenu(null);
                }}
              />
              <Li
                label="📍 Set location"
                cb={() => {
                  setTmpL(cp.location ?? "");
                  setLocCP(cp.id);
                  setMenu(null);
                }}
              />
              <Li label="👥 Define users"  disabled />
              <Li label="🗓️  Define times" disabled />
            </ul>
          )}
        </td>
      </tr>
    );
  })}
</tbody>

        </table>
      </section>

      {/* recent sessions */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Recent sessions</h2>

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
              const cp = cps.find(c => c.id === s.cp);          // look up price
              const k  = Number(s.kWh ?? 0);
              const tot = cp?.price_per_kwh
                ? (k * cp.price_per_kwh).toFixed(2)
                : "—";

              return (
                <tr key={s.id} className="border-b last:border-0">
                  <td>{s.id}</td><td>{s.cp}</td><td>{k.toFixed(3)}</td>
                  <td>{fmt(s.Started)}</td><td>{fmt(s.Ended)}</td>
                  <td className="text-right">{tot}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ── price modal ───────────────────────────────────────────── */}
      {editCP && createPortal(
        <Modal onClose={() => setEdit(null)}>
          <h2 className="text-xl font-semibold mb-4">Edit connector</h2>

          <div className="mb-6 p-4 rounded shadow border">
            <h3 className="font-medium mb-4">Prices</h3>
            <div className="grid grid-cols-2 gap-6">
              <Field
                label="Price per kWh (€)"
                value={tmpK}
                onChange={e => setTmpK(e.target.value)}
              />
              <Field
                label="Price per h  (€)"
                value={tmpH}
                onChange={e => setTmpH(e.target.value)}
              />
            </div>
          </div>

          <ModalButtons
            onCancel={() => setEdit(null)}
            onSave={async () => {
              await updatePrices(editCP);
              setEdit(null);
            }}
          />
        </Modal>,
        document.body
      )}

      {/* ── location modal ────────────────────────────────────────── */}
      {locCP && createPortal(
        <Modal onClose={() => setLocCP(null)}>
          <h2 className="text-xl font-semibold mb-4">Set location</h2>

          <div className="mb-6 p-4 rounded shadow border">
            <Field
              label="Location / address"
              value={tmpL}
              onChange={e => setTmpL(e.target.value)}
            />
            <p className="mt-2 text-xs text-slate-500">
              Saved in the backend and shared with everyone on this tenant.
            </p>
          </div>

          <ModalButtons
            onCancel={() => setLocCP(null)}
            onSave={async () => {
              await updateLocation(locCP);
              setLocCP(null);
            }}
          />
        </Modal>,
        document.body
      )}
    </div>
  );
}

/* ——————————— small presentational helpers ——————————— */
const Li = ({ label, cb, disabled }) => (
  <li>
    <button
      disabled={disabled}
      onClick={cb}
      className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 disabled:text-slate-400"
    >
      {label}
    </button>
  </li>
);

const Modal = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-20 flex items-center justify-center bg-black/30"
    onClick={onClose}
  >
    <div
      className="max-h-[90vh] w-[34rem] overflow-y-auto bg-white rounded shadow-lg p-6"
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const Field = ({ label, value, onChange }) => (
  <label className="block">
    <span className="text-sm text-slate-600">{label}</span>
    <input
      className="mt-1 w-full border-b outline-none focus:border-blue-500 py-1"
      value={value}
      onChange={onChange}
    />
  </label>
);

const ModalButtons = ({ onCancel, onSave }) => (
  <div className="flex justify-end gap-3">
    <button
      className="px-4 py-1.5 rounded bg-slate-100"
      onClick={onCancel}
    >
      Cancel
    </button>
    <button
      className="px-4 py-1.5 rounded bg-blue-600 text-white"
      onClick={onSave}
    >
      Save
    </button>
  </div>
);

