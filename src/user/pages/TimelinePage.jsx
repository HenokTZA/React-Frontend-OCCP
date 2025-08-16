import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";

export default function TimelinePage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      // your backend already exposes a tenant-scoped list
      const data = await fetchJson("/transactions/");
      setRows(data || []);
    })();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Recent charging sessions</h1>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>CP</th>
              <th>Connector</th>
              <th>Start</th>
              <th>End</th>
              <th>kWh</th>
              <th>Price @ start</th>
              <th>Total (if computed)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.cp}</td>
                <td>{r.connector_id ?? "—"}</td>
                <td>{r.Started ?? r.start_time}</td>
                <td>{r.Ended   ?? r.stop_time  }</td>
                <td>{(r.kWh ?? r.kwh ?? 0).toFixed ? (r.kWh || r.kwh).toFixed(3) : r.kWh ?? r.kwh ?? "—"}</td>
                <td>{r.price_kwh ?? "—"} €/kWh</td>
                <td>{r.total ?? "—"}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7}>No sessions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

