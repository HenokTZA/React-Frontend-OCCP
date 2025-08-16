import { useEffect, useMemo, useState } from "react";
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
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function MapPage() {
  const [cps, setCps] = useState([]);
  const points = useMemo(
    () => cps.filter(p => p.lat != null && p.lng != null),
    [cps]
  );

  useEffect(() => {
    (async () => {
      const data = await fetchJson("/charge-points/");
      setCps(data);
    })();
  }, []);

  return (
    <div className="h-full w-full">
      <MapContainer className="h-full" center={[9.0108, 38.7613]} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map(cp => (
          <Marker key={cp.id} position={[Number(cp.lat), Number(cp.lng)]} icon={markerIcon}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{cp.name || cp.id}</div>
                <div>Owner: <b>{cp.owner_username || "—"}</b></div>
                <div>Address: {cp.location || "—"}</div>
                <div>Price: {cp.price_per_kwh ?? "—"} €/kWh &nbsp; {cp.price_per_hour ?? "—"} €/h</div>
                <div>Status: <span className="badge">{cp.status}</span></div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

