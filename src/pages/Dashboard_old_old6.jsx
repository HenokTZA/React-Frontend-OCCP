/**********************************************************************
 * Dashboard.jsx  – with “Edit connector” modal                       *
 *********************************************************************/
import { useEffect, useState } from "react";
import { createPortal }        from "react-dom";
import { fetchJson }           from "@/lib/api";
import { useAuth }             from "@/lib/auth";

/* ─────────────── helpers ────────────────────────────────────────── */
const fmt = d => (d ? new Date(d).toLocaleString() : "—");
const LS_KWH = "cp_price_kwh";
const LS_HOUR= "cp_price_hour";
const LS_LOC = "cp_location";
const load   = key => { try { return JSON.parse(localStorage.getItem(key)||"{}"); }
                        catch { return {}; } };
const save   = (key,obj)=> localStorage.setItem(key,JSON.stringify(obj));

/* ────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  /* server data */
  const [me, setMe]         = useState(null);
  const [cps, setCps]       = useState(null);
  const [sessions,setSess ] = useState(null);

  /* client-side extras */
  const [kwh, setKwh]   = useState(()=>load(LS_KWH));
  const [hour,setHour ] = useState(()=>load(LS_HOUR));
  const [loc ,setLoc  ] = useState(()=>load(LS_LOC));

  /* UI state */
  const [menuOpen,setMenu]   = useState(null);     // cp id | null
  const [modalCP,setModalCP] = useState(null);     // cp id | null
  const [tmpK ,setTmpK]      = useState("");       // controlled inputs
  const [tmpH ,setTmpH]      = useState("");

  /* auth + first fetch */
  const { logout } = useAuth();
  useEffect(()=>{ fetchJson("/me").then(setMe).catch(()=>logout()); },[]);

  /* load + poll */
  useEffect(()=>{
    if(!me?.tenant_ws) return;
    const load=()=>Promise.all([
      fetchJson("/charge-points/"), fetchJson("/sessions/")
    ]).then(([c,s])=>{setCps(c); setSess(s);});
    load();
    const t=setInterval(load,5_000);
    return ()=>clearInterval(t);
  },[me]);

  /* helpers to persist */
  const updPrice=(id,pk,ph)=>{
    const nk={...kwh ,[id]:pk};
    const nh={...hour,[id]:ph};
    setKwh(nk); save(LS_KWH,nk);
    setHour(nh);save(LS_HOUR,nh);
  };
  const updLoc =(id,l)=>{
    const nl={...loc,[id]:l};
    setLoc(nl); save(LS_LOC,nl);
  };

  /* early returns */
  if(!me)                return <p className="p-8">Loading…</p>;
  if(!me.tenant_ws)      return <p className="p-8">You don’t own a tenant yet.</p>;
  if(!cps||!sessions)    return <p className="p-8">Loading charge-points…</p>;

  /* ─────────────── render ───────────────────────────────────────── */
  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* websocket url */}
      <div>
        <p className="mb-1">Connect your charge-points to:</p>
        <code className="block p-2 bg-slate-100 rounded">
          {me.tenant_ws.replace(/^ws:\/\/[^/]+/,"ws://147.93.127.215:9000")}
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
            {cps.map(cp=>{
              const id=cp.id;
              return (
                <tr key={id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="cursor-pointer" onClick={()=>location.href=`/cp/${id}`}>{id}</td>
                  <td>{cp.status}</td>
                  <td>{cp.connector_id}</td>
                  <td>{fmt(cp.updated)}</td>
                  <td className="text-right">{kwh[id] ?? "—"}</td>
                  <td className="text-right">{hour[id]?? "—"}</td>
                  <td className="relative">
                    <button className="px-2 text-lg" onClick={()=>setMenu(m=>m===id?null:id)}>⋮</button>
                    {menuOpen===id && (
                      <ul
                        className="absolute right-0 z-10 mt-1 w-48 bg-white border rounded shadow"
                        onMouseLeave={()=>setMenu(null)}
                      >
                        <Li label="✏️  Edit connector" cb={()=>{
                          setTmpK(kwh[id]??"");
                          setTmpH(hour[id]??"");
                          setModalCP(id); setMenu(null);
                        }}/>
                        <Li label="📍 Set location" cb={()=>{
                          const l=prompt("Location",loc[id]??"") ?? "";
                          updLoc(id,l.trim()); setMenu(null);
                        }}/>
                        <Li label="👥 Define users" disabled/>
                        <Li label="🗓️  Define times" disabled/>
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
            <tr><th>ID</th><th>CP</th><th>kWh</th><th>Started</th><th>Stopped</th>
                <th className="text-right">Total (€)</th></tr>
          </thead>
          <tbody>
            {sessions.map(s=>{
              const k=Number(s.kWh??0);
              const p=kwh[s.cp]??0;
              const t=p?(k*p).toFixed(2):"—";
              return(
                <tr key={s.id} className="border-b last:border-0">
                  <td>{s.id}</td><td>{s.cp}</td><td>{k.toFixed(3)}</td>
                  <td>{fmt(s.Started)}</td><td>{fmt(s.Ended)}</td>
                  <td className="text-right">{t}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Modal, rendered into <body> so it escapes table overflow */}
      {modalCP && createPortal(
        <Modal onClose={()=>setModalCP(null)}>
          <h2 className="text-xl font-semibold mb-4">Edit connector</h2>

          {/* Prices card */}
          <div className="mb-6 p-4 rounded shadow border">
            <h3 className="font-medium mb-4">Prices</h3>
            <div className="grid grid-cols-2 gap-6">
              <Field
                label="Price per kWh"
                value={tmpK}
                onChange={e=>setTmpK(e.target.value)}
              />
              <Field
                label="Price per h"
                value={tmpH}
                onChange={e=>setTmpH(e.target.value)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-1.5 rounded bg-slate-100"
              onClick={()=>setModalCP(null)}
            >Cancel</button>
            <button
              className="px-4 py-1.5 rounded bg-blue-600 text-white"
              onClick={()=>{
                updPrice(modalCP,Number(tmpK)||0,Number(tmpH)||0);
                setModalCP(null);
              }}
            >Save</button>
          </div>
        </Modal>
      ,document.body)}
    </div>
  );
}

/* ————————————————— components ————————————————— */
const Li=({label,cb,disabled})=>(
  <li>
    <button
      disabled={disabled}
      onClick={cb}
      className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 disabled:text-slate-400"
    >{label}</button>
  </li>
);

/* simple full-screen overlay modal */
const Modal=({children,onClose})=>(
  <div
    className="fixed inset-0 z-20 flex items-center justify-center bg-black/30"
    onClick={onClose}
  >
    <div
      className="max-h-[90vh] w-[36rem] overflow-y-auto bg-white rounded shadow-lg p-6"
      onClick={e=>e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

/* labeled input */
const Field=({label,value,onChange})=>(
  <label className="block">
    <span className="text-sm text-slate-600">{label}</span>
    <div className="flex items-center border-b focus-within:border-blue-500">
      <input
        type="number" step="0.01"
        className="flex-1 px-1 py-1 outline-none"
        value={value} onChange={onChange}
      />
      <span className="pr-1 text-xs text-slate-500">€</span>
    </div>
  </label>
);

