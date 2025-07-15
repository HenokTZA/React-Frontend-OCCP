import { useEffect, useState }  from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchJson }             from "@/lib/api";

export default function CpDetail() {
  const { id }       = useParams();      // cp id from URL
  const navigate     = useNavigate();
  const [cp, setCp]  = useState(null);
  const [msg, setMsg]= useState(null);   // command feedback

  /* fetch CP once on mount */
  useEffect(() => {
    fetchJson(`/charge-points/${id}/`)
      .then(setCp)
      .catch(() => navigate("/"));       // unknown id → back to dash
  }, [id]);

  /* helper to send a command */
  async function send(action, params = {}) {
    setMsg("sending…");
    try {
      const out = await fetchJson(
        `/charge-points/${id}/command/`,
        { method:"POST", body: JSON.stringify({ action, params }) }
      );
      setMsg(`${action} → ${out.detail || "ok"}`);
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
        <button className="btn" onClick={() => send("ChangeAvailability",
                       {connectorId: cp.connector_id, type:"Inoperative"})}>
          ChangeAvailability (Inoperative)
        </button>

        <button className="btn" onClick={() => send("RemoteStartTransaction",
                       {connectorId: cp.connector_id, idTag:"demo"})}>
          RemoteStartTransaction
        </button>

        <button className="btn" onClick={() => send("RemoteStopTransaction",
                       {transactionId: prompt("tx-id?")})}>
          RemoteStopTransaction
        </button>

        <button className="btn" onClick={() => send("UpdateFirmware",
                       {location:"http://example.com/fw.bin", retrieveDate:new Date().toISOString()})}>
          UpdateFirmware
        </button>
      </div>
    </div>
  );
}

