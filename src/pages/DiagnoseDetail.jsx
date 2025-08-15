// src/pages/DiagnoseDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchJson } from "@/lib/api";

export default function DiagnoseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cp, setCp] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchJson(`/charge-points/${id}/`)
      .then(setCp)
      .catch(() => navigate("/diagnose"));
  }, [id]);

  async function send(action, params = {}) {
    setMsg("sending…");
    try {
      const out = await fetchJson(`/charge-points/${id}/command/`, {
        method: "POST",
        body: JSON.stringify({ action, params }),
      });
      setMsg(`${action} → ${out.detail || "queued"}`);
    } catch (e) {
      setMsg(e.message || "error");
    }
  }

  if (!cp) return <p className="p-8">Loading…</p>;

  const ask = (q) => window.prompt(q) ?? "";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diagnose → CP {cp.id}</h1>
        <Link to="/diagnose" className="link">Back to list</Link>
      </div>

      {msg && <p className="text-sm text-slate-500">{msg}</p>}

      <div className="space-y-2">
        {/* Reset (OCPP: type is Soft|Hard) */}
        <button
          className="btn"
          onClick={() => {
            const type = ask('Reset type? (Soft/Hard)').trim() || "Soft";
            send("Reset", { type });
          }}
        >
          Reset
        </button>

        {/* GetDiagnostics (needs a location URL; others optional) */}
        <button
          className="btn"
          onClick={() => {
            const location = ask("Diagnostics upload URL?");
            if (!location) return;
            // Optional prompts:
            // const retries = Number(ask("Retries? (blank=default)")) || undefined;
            // const retryInterval = Number(ask("Retry interval (s)? (blank=default)")) || undefined;
            // const startTime = ask("Start ISO (blank=none)") || undefined;
            // const stopTime  = ask("Stop ISO (blank=none)") || undefined;
            send("GetDiagnostics", { location /*, retries, retryInterval, startTime, stopTime*/ });
          }}
        >
          GetDiagnostics
        </button>

        {/* FirmwareStatusNotification (normally CP→CSMS; use only if your backend accepts this action) */}
        <button
          className="btn"
          onClick={() => {
            const status = ask(
              "Firmware status? (Idle, Downloading, Downloaded, Installing, Installed, DownloadFailed, InstallationFailed)"
            ).trim() || "Idle";
            send("FirmwareStatusNotification", { status });
          }}
        >
          FirmwareStatusNotification
        </button>
      </div>
    </div>
  );
}



