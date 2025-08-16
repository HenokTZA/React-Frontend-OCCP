import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchJson } from "@/lib/api";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

// Use any available identifier for details: pk -> id -> code/cp_id
function cpDetailId(cp) {
  return cp?.pk ?? cp?.id ?? cp?.code ?? cp?.cp_id ?? null;
}

export default function MapPage() {
  const [cps, setCps] = useState([]);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson("/charge-points/");
        setCps(Array.isArray(data) ? data : []);
      } catch {
        setErr("Failed to load charge points");
      }
    })();
  }, []);

  const points = useMemo(
    () =>
      (cps || [])
        .map(p => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }))
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [cps]
  );

  return (
    <div className="h-full w-full">
      {err && <div className="p-2 text-sm text-red-600">{err}</div>}
      <MapContainer className="h-full" center={[9.0108, 38.7613]} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map(cp => {
          const detailId = cpDetailId(cp);
          const to = detailId ? `/app/map/${encodeURIComponent(detailId)}` : null;
          return (
            <Marker
              key={String(detailId ?? `${cp.lat},${cp.lng}`)}
              position={[cp.lat, cp.lng]}
              icon={markerIcon}
              eventHandlers={to ? { click: () => navigate(to) } : undefined}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{cp.name || detailId}</div>
                  <div>Owner: <b>{cp.owner_username || "—"}</b></div>
                  <div>Address: {cp.location || "—"}</div>
                  <div>Price: {cp.price_per_kwh ?? "—"} €/kWh · {cp.price_per_hour ?? "—"} €/h</div>
                  <div>Status: <span className="badge">{cp.status}</span></div>
                  <div className="pt-2">
                    {to ? (
                      <Link className="link" to={to}>View details →</Link>
                    ) : (
                      <span className="opacity-60 text-sm">Details unavailable</span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

