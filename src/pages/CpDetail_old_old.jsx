import { useEffect, useState }   from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchJson }              from "@/lib/api";

export default function CpDetail() {
  const { id }        = useParams();           // cp-id from URL
  const navigate      = useNavigate();

  const [cp,  setCp]  = useState(null);
  const [msg, setMsg] = useState(null);        // feedback banner

  /* ── fetch CP once on mount ───────────────────────────────────────── */
  useEffect(() => {
    fetchJson(`/charge-points/${id}/`)
      .then(setCp)
      .catch(() => navigate("/"));             // unknown id → dash
  }, [id, navigate]);

  /* ── helper: POST a command, coercing numeric strings → numbers ──── */
  async function send(action, params = {}) {
    // convert "123" → 123 for every payload field that is all-digits
    const cleaned = Object.fromEntries(
      Object.entries(params).map(([k, v]) => [
        k,
        typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v,
      ]),
    );

    setMsg("sending…");
    try {
      const out = await fetchJson(
        `/charge-points/${id}/command/`,
        { method: "POST", body: JSON.stringify({ action, params: cleaned }) },
      );
      setMsg(`${action}: ${out.detail || "queued"}`);
    } catch (e) {
      setMsg(e.message || "error");
    }
  }

  if (!cp) return <p className="p-8">Loading…</p>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">CP {cp.id}</h1>

      {msg && <p className="text-sm text-slate-500">{msg}</p>}

      <div className="space-y-2">
        <button
          className="btn"
          onClick={() =>
            send("ChangeAvailability", {
              connectorId: cp.connector_id,
              type: "Inoperative",
            })
          }
        >
          ChangeAvailability (Inoperative)
        </button>

        <button
          className="btn"
          onClick={() =>
            send("RemoteStartTransaction", {
              connectorId: cp.connector_id,
              idTag: "demo",
            })
          }
        >
          RemoteStartTransaction
        </button>

        <button
          className="btn"
          onClick={() => {
            const tx = prompt("Transaction-ID to stop?");
            if (tx) send("RemoteStopTransaction", { transactionId: tx });
          }}
        >
          RemoteStopTransaction
        </button>

        <button
          className="btn"
          onClick={() =>
            send("UpdateFirmware", {
              location: "http://example.com/fw.bin",
              retrieveDate: new Date().toISOString(),
            })
          }
        >
          UpdateFirmware
        </button>
      </div>
    </div>
  );
}

