import { useEffect, useState } from "react";
import ConnectorCard from "./components/dashboard/ConnectorCard";
import SessionTable from "./components/dashboard/SessionTable";
import { fetchJson } from "./lib/api";

export default function App() {
  const [cps, setCps] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [cpData, sesData] = await Promise.all([
        fetchJson("/charge-points"),
        fetchJson("/sessions?limit=20")
      ]);
      setCps(cpData);
      setSessions(sesData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <h1 className="text-3xl font-semibold">EV Charging Dashboard</h1>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cps.map((cp) => (
          <ConnectorCard key={cp.id} cp={cp} />
        ))}
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-medium mb-4">Recent Sessions</h2>
        {loading ? <p>Loading…</p> : <SessionTable sessions={sessions} />}
      </div>
    </div>
  );
}

