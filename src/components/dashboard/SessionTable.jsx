import React from "react";

export default function SessionTable({ sessions }) {
  if (!Array.isArray(sessions)) {
    // you could also return a spinner or “Loading…” here
    return null;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>CP</th>
          <th>User</th>
          <th>kWh</th>
          <th>Started</th>
          <th>Ended</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => {
          // grab your fields; guard against missing
          const id      = s.id      ?? "-";
          const cp      = s.cp      ?? "-";
          const user    = s.user    ?? "-";
          const kWh     = typeof s.kWh === "number" ? s.kWh : null;
          const started = s.Started ? new Date(s.Started) : null;
          const ended   = s.Ended   ? new Date(s.Ended)   : null;

          return (
            <tr key={id}>
              <td>{id}</td>
              <td>{cp}</td>
              <td>{user}</td>
              <td>{kWh !== null ? kWh.toFixed(2) : "—"}</td>
              <td>{started ? started.toLocaleString() : "—"}</td>
              <td>{ended   ? ended.toLocaleString()   : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

