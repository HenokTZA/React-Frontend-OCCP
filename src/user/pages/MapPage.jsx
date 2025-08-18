// src/user/pages/MapPage.jsx
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
    map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng])), { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function MapPage() {
  const [cps, setCps] = useState([]);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson("/public/charge-points/");
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
        .map(p => ({ ...p, _id: p.pk ?? p.id }))
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p._id),
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
          const to = `/app/map/${encodeURIComponent(cp._id)}`;
          return (
            <Marker
              key={String(cp._id)}
              position={[cp.lat, cp.lng]}
              icon={markerIcon}
              eventHandlers={{ click: () => navigate(to) }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{cp.name || cp.pk}</div>
                  <div>Owner: <b>{cp.owner_username || "—"}</b></div>
                  <div>Address: {cp.location || "—"}</div>
                  <div>Price: {cp.price_per_kwh ?? "—"} €/kWh · {cp.price_per_hour ?? "—"} €/h</div>
                  <div>Status: <span className="badge">{cp.status}</span></div>
                  <div className="pt-2">
                    <Link className="link" to={to}>View details →</Link>
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

