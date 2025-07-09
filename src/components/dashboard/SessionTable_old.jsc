export default function SessionTable({ sessions }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-muted">
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
        {sessions.map((s) => (
          <tr key={s.id} className="border-b last:border-none">
            <td>{s.id}</td>
            <td>{s.cpId}</td>
            <td>{s.user}</td>
            <td>{s.kwh.toFixed(2)}</td>
            <td>{new Date(s.start).toLocaleString()}</td>
            <td>{s.stop ? new Date(s.stop).toLocaleString() : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

