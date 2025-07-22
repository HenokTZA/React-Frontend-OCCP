// src/pages/CpDetail.jsx
import { useEffect, useState }  from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchJson }             from "@/lib/api";

export default function CpDetail() {
  const { id }       = useParams();          // cp id from URL
  const navigate     = useNavigate();
  const [cp, setCp]  = useState(null);
  const [msg, setMsg]= useState(null);       // command feedback

  /* ── load CP once ─────────────────────────────────────────────── */
  useEffect(() => {
    fetchJson(`/charge-points/${id}/`)
      .then(setCp)
      .catch(() => navigate("/"));           // unknown id → back
  }, [id]);

  /* ── helper to queue a command via REST ───────────────────────── */
  async function send(action, params = {}) {
    setMsg("sending…");
    try {
      const out = await fetchJson(
        `/charge-points/${id}/command/`,
        {
          method : "POST",
          body   : JSON.stringify({ action, params })
        }
      );
      setMsg(`${action} → ${out.detail || "queued"}`);
    } catch (e) {
      setMsg(e.message || "error");
    }
  }

  if (!cp) return <p className="p-8">Loading…</p>;

  /* ── tiny helpers for prompts ─────────────────────────────────── */
  const ask = q => window.prompt(q) ?? "";
  const int = q => Number(ask(q));

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Charge-point&nbsp;{cp.id}</h1>

      {msg && <p className="text-sm text-slate-500">{msg}</p>}

      <div className="space-y-2">

        {/* existing four -------------------------------------------------- */}
        <button className="btn"
          onClick={() => send("ChangeAvailability",
                    { connectorId: cp.connector_id, type:"Inoperative" })}>
          ChangeAvailability (Inoperative)
        </button>

        <button className="btn"
          onClick={() => send("RemoteStartTransaction",
                    { connectorId: cp.connector_id, idTag:"demo" })}>
          RemoteStartTransaction
        </button>

        <button className="btn"
          onClick={() => send("RemoteStopTransaction",
                    { transactionId: int("Stop Tx ID?") })}>
          RemoteStopTransaction
        </button>

        <button className="btn"
          onClick={() => send("UpdateFirmware",
                    { location:"http://example.com/fw.bin",
                      retrieveDate: new Date().toISOString() })}>
          UpdateFirmware
        </button>

        {/* ───── NEW COMMANDS ────────────────────────────────────────── */}
        <hr className="my-4" />

        <button className="btn"
          onClick={() => send("GetConfiguration",
                    { key: ask("Key (empty = all)?") })}>
          GetConfiguration
        </button>

        <button className="btn"
          onClick={() => {
            const key   = ask("Config key?");
            const value = ask("New value?");
            if (key) send("ChangeConfiguration", { key, value });
          }}>
          ChangeConfiguration
        </button>

        <button className="btn"
          onClick={() => send("GetLocalListVersion")}>
          GetLocalListVersion
        </button>

        <button className="btn"
          onClick={() => {
            /* super-minimal ChargingProfile example (TxDefault) */
            const profile = {
              chargingProfileId : 1,
              stackLevel        : 0,
              chargingProfilePurpose : "TxProfile",
              chargingProfileKind    : "Absolute",
              chargingSchedule : {
                duration     : 300,
                startSchedule: new Date().toISOString(),
                chargingRateUnit: "A",
                chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }]
              }
            };
            send("SetChargingProfile", {
              connectorId: cp.connector_id,
              csChargingProfiles: profile
            });
          }}>
          SetChargingProfile&nbsp;(demo 16 A)
        </button>

        <button className="btn"
          onClick={() => send("ClearChargingProfile",
                    { id: int("profileId? (0 = ALL)") || 0 })}>
          ClearChargingProfile
        </button>

        <button className="btn"
          onClick={() => send("GetCompositeSchedule",
                    { connectorId: cp.connector_id,
                      duration   : int("Horizon (sec)?") || 3600 })}>
          GetCompositeSchedule
        </button>
      </div>
    </div>
  );
}

