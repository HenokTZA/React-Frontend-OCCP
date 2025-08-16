import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function NearbyPage() {
  const [me, setMe]   = useState(null);
  const [cps, setCps] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => setMe(null),
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    (async () => {
      const data = await fetchJson("/charge-points/");
      setCps(data.filter(p => p.lat != null && p.lng != null));
    })();
  }, []);

  const list = (me && cps.length)
    ? cps
        .map(p => ({ ...p, _dist: haversineKm(me.lat, me.lng, Number(p.lat), Number(p.lng)) }))
        .sort((a, b) => a._dist - b._dist)
    : cps;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Nearby stations</h1>
      {!me && <div className="text-sm opacity-60">We couldn’t get your location — showing unsorted list.</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {list.map(p => (
          <div key={p.id} className="card bg-base-200">
            <div className="card-body">
              <div className="font-semibold">{p.name || p.id}</div>
              <div className="text-sm">Owner: {p.owner_username || "—"}</div>
              <div className="text-sm">Address: {p.location || "—"}</div>
              <div className="text-sm">Price: {p.price_per_kwh ?? "—"} €/kWh · {p.price_per_hour ?? "—"} €/h</div>
              <div className="text-sm">Status: <span className="badge">{p.status}</span></div>
              {typeof p._dist === "number" && <div className="text-xs opacity-60">{p._dist.toFixed(2)} km</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

