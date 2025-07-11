import { useEffect, useState } from "react";
import { fetchJson }          from "@/lib/api";
import { useAuth }            from "@/lib/auth";

export default function Dashboard() {
  /* ------------------------------------------------------------------ */
  /* 1.  fetch /api/me/ once after login                                */
  /* ------------------------------------------------------------------ */
  const [me, setMe] = useState(null);
  const { logout }  = useAuth();           // ← handy if fetch fails (token)

  useEffect(() => {
    fetchJson("/me")
      .then(setMe)
      .catch(err => {
        console.error(err);
        logout();                          // token expired? → kick user out
      });
  }, []);

  /* ------------------------------------------------------------------ */
  /* 2.  loading state                                                  */
  /* ------------------------------------------------------------------ */
  if (!me) return <p className="p-8">Loading…</p>;

  /* ------------------------------------------------------------------ */
  /* 3.  user owns **no** tenant yet                                    */
  /* ------------------------------------------------------------------ */
  if (!me.tenant_ws) {
    return (
      <p className="p-8">
        You don’t own a tenant yet – contact an administrator.
      </p>
    );
  }

  /* ------------------------------------------------------------------ */
  /* 4.  regular dashboard                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* ── unique WebSocket URL ───────────────────────────────────── */}
      <div>
        <p className="mb-1">Connect your charge-points to:</p>
        <code className="block p-2 bg-slate-100 rounded">
          {me.tenant_ws.replace(/^ws:\/\/[^/]+/, "ws://147.92.127.215:9000")}
        </code>
      </div>

      {/* TODO: render charge-points + recent sessions here */}
    </div>
  );
}


