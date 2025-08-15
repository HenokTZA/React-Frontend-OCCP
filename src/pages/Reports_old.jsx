/*********************************************************************
 * Reports.jsx – choose charge points, then create/download a report *
 *********************************************************************/
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchJson } from "@/lib/api";

export default function Reports() {
  const [cps, setCps] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [open, setOpen] = useState(false);

  // modal fields
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [tax, setTax] = useState("0");           // percent
  const [fmt, setFmt] = useState("pdf");         // 'pdf' | 'excel'
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchJson("/charge-points/").then(setCps);
  }, []);

  if (!cps) return <p className="p-8">Loading…</p>;

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(cps.map(c => c.id)));
  const clearAll  = () => setSelected(new Set());

  async function createReport() {
    if (!selected.size) { alert("Select at least one station."); return; }
    if (!start || !end) { alert("Pick start and end dates."); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/reports/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cp_ids: [...selected],
          start, end,
          tax_rate: Number(tax),     // percent from UI
          format: fmt,               // 'pdf' or 'excel'
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const blob = await fetchBlob("/reports/", {
  method: "POST",
  body: JSON.stringify({
    cp_ids: [...selected],
    start,
    end,
    tax_rate: Number(tax),
    format: fmt, // 'pdf' | 'excel'
  }),
});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      a.download = `report_${start}_${end}.${fmt === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Report</h1>
        <button
          className="px-3 py-1.5 rounded bg-slate-100"
          onClick={() => history.back()}
        >
          ← Back
        </button>
      </div>

      <div className="flex gap-3">
        <button className="px-3 py-1.5 rounded bg-slate-100" onClick={selectAll}>Select all</button>
        <button className="px-3 py-1.5 rounded bg-slate-100" onClick={clearAll}>Clear</button>
        <button
          className="ml-auto px-4 py-1.5 rounded bg-blue-600 text-white"
          onClick={() => setOpen(true)}
        >
          Create report
        </button>
      </div>

      <table className="w-full text-sm">
        <thead className="text-left border-b">
          <tr>
            <th className="w-10"></th>
            <th>ID</th>
            <th>Status</th>
            <th>Conn</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {cps.map(cp => (
            <tr key={cp.id} className="border-b last:border-0">
              <td>
                <input
                  type="checkbox"
                  checked={selected.has(cp.id)}
                  onChange={() => toggle(cp.id)}
                />
              </td>
              <td>{cp.id}</td>
              <td>{cp.status}</td>
              <td>{cp.connector_id}</td>
              <td>{cp.location || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && createPortal(
        <Modal onClose={() => setOpen(false)}>
          <h2 className="text-xl font-semibold mb-4">Report options</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Field label="Start date">
              <input
                type="date" value={start}
                className="mt-1 w-full border-b outline-none py-1"
                onChange={e => setStart(e.target.value)}
              />
            </Field>
            <Field label="End date">
              <input
                type="date" value={end}
                className="mt-1 w-full border-b outline-none py-1"
                onChange={e => setEnd(e.target.value)}
              />
            </Field>
            <Field label="Tax rate (%)">
              <input
                type="number" step="0.01" min="0"
                value={tax}
                className="mt-1 w-full border-b outline-none py-1"
                onChange={e => setTax(e.target.value)}
              />
            </Field>
            <Field label="Format">
              <select
                value={fmt}
                className="mt-1 w-full border-b outline-none py-1 bg-transparent"
                onChange={e => setFmt(e.target.value)}
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel (.xlsx)</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            <button className="px-4 py-1.5 rounded bg-slate-100" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="px-4 py-1.5 rounded bg-blue-600 text-white disabled:opacity-60"
              disabled={busy}
              onClick={createReport}
            >
              {busy ? "Creating…" : "Create"}
            </button>
          </div>
        </Modal>,
        document.body
      )}
    </div>
  );
}

/* small helpers (reuse your Modal style) */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="max-h-[90vh] w-[36rem] overflow-y-auto bg-white rounded shadow-lg p-6" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      {children}
    </label>
  );
}

