import { CheckCircle, XCircle } from "lucide-react";

const statusMap = {
  Available: { color: "text-green-500", Icon: CheckCircle },
  Charging: { color: "text-yellow-500", Icon: CheckCircle },
  Faulted: { color: "text-red-500", Icon: XCircle }
};

export default function ConnectorCard({ cp }) {
  const S = statusMap[cp.status] || statusMap.Available;
  return (
    <div className="rounded-xl shadow p-4 flex justify-between bg-white">
      <div>
        <h3 className="font-medium">{cp.name}</h3>
        <p className="text-sm text-muted">
          Connector {cp.connectorId} · {cp.status}
        </p>
      </div>
      <S.Icon className={`w-6 h-6 ${S.color}`} />
    </div>
  );
}

