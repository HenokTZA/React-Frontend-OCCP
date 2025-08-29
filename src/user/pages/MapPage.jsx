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

  // Filter UI state
  const [filterOpen, setFilterOpen] = useState(false);

  const [energyOp, setEnergyOp] = useState("any"); // any | lte | gte
  const [energyVal, setEnergyVal] = useState("");  // string input, parse to number

  const [timeOp, setTimeOp] = useState("any");     // any | lte | gte
  const [timeVal, setTimeVal] = useState("");

  const [statusSelected, setStatusSelected] = useState([]); // array of lowercased statuses

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

  const allPoints = useMemo(
    () =>
      (cps || [])
        .map(p => ({
          ...p,
          lat: Number(p.lat),
          lng: Number(p.lng),
          _id: p.pk ?? p.id,
          _price_kwh: p.price_per_kwh != null ? Number(p.price_per_kwh) : NaN,
          _price_hour: p.price_per_hour != null ? Number(p.price_per_hour) : NaN,
          _status_lc: (p.status || "").toString().trim().toLowerCase(),
        }))
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p._id),
    [cps]
  );

  const availableStatuses = useMemo(() => {
    const s = new Set();
    for (const p of allPoints) if (p._status_lc) s.add(p._status_lc);
    // fallback common statuses if none present yet
    if (s.size === 0) {
      ["available", "preparing", "charging", "finishing", "unavailable", "faulted", "reserved", "suspendedev", "suspendedevse"].forEach(v => s.add(v));
    }
    return Array.from(s).sort();
  }, [allPoints]);

  const isFiltering =
    (energyOp !== "any" && energyVal.trim() !== "") ||
    (timeOp !== "any" && timeVal.trim() !== "") ||
    statusSelected.length > 0;

  const filteredPoints = useMemo(() => {
    if (!isFiltering) return allPoints;

    const eVal = Number(energyVal);
    const tVal = Number(timeVal);
    const wantEnergy = energyOp !== "any" && Number.isFinite(eVal);
    const wantTime = timeOp !== "any" && Number.isFinite(tVal);
    const wantStatus = statusSelected.length > 0;

    return allPoints.filter(p => {
      // Price (energy)
      if (wantEnergy) {
        if (!Number.isFinite(p._price_kwh)) return false;
        if (energyOp === "lte" && !(p._price_kwh <= eVal)) return false;
        if (energyOp === "gte" && !(p._price_kwh >= eVal)) return false;
      }
      // Price (time)
      if (wantTime) {
        if (!Number.isFinite(p._price_hour)) return false;
        if (timeOp === "lte" && !(p._price_hour <= tVal)) return false;
        if (timeOp === "gte" && !(p._price_hour >= tVal)) return false;
      }
      // Status
      if (wantStatus) {
        if (!statusSelected.includes(p._status_lc)) return false;
      }
      return true;
    });
  }, [allPoints, isFiltering, energyOp, energyVal, timeOp, timeVal, statusSelected]);

  function toggleStatus(valLc) {
    setStatusSelected(prev => {
      if (prev.includes(valLc)) return prev.filter(v => v !== valLc);
      return [...prev, valLc];
    });
  }

  function clearFilters() {
    setEnergyOp("any");
    setEnergyVal("");
    setTimeOp("any");
    setTimeVal("");
    setStatusSelected([]);
  }

  return (
    <div className="h-full w-full relative">
      {/* Top-right filter button */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        {isFiltering && (
          <span className="badge badge-secondary">
            Filters on ({filteredPoints.length}/{allPoints.length})
          </span>
        )}
        <button
          className="btn btn-sm btn-outline"
          onClick={() => setFilterOpen(true)}
          type="button"
        >
          Filter
        </button>
        {isFiltering && (
          <button
            className="btn btn-sm"
            type="button"
            onClick={clearFilters}
            title="Clear all filters"
          >
            Clear
          </button>
        )}
      </div>

      {err && <div className="p-2 text-sm text-red-600">{err}</div>}

      <MapContainer className="h-full" center={[9.0108, 38.7613]} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={filteredPoints} />
        {filteredPoints.map(cp => {
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
                  <div className="font-semibold">{cp.name || cp._id}</div>
                  <div>Owner: <b>{cp.owner_username || "—"}</b></div>
                  <div>Address: {cp.location || "—"}</div>
                  <div>
                    Price: {Number.isFinite(cp._price_kwh) ? cp._price_kwh : "—"} €/kWh ·{" "}
                    {Number.isFinite(cp._price_hour) ? cp._price_hour : "—"} €/h
                  </div>
                  <div>Status: <span className="badge">{cp.status || "—"}</span></div>
                  <div className="pt-2">
                    <Link className="link" to={to}>View details →</Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Filter modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-base-100 rounded-xl shadow-xl w-[95%] max-w-xl p-5">
            <h3 className="text-lg font-semibold mb-4">Filter charge points</h3>

            {/* Price (energy) */}
            <div className="mb-4 grid grid-cols-[110px_1fr_1fr] gap-2 items-center">
              <label className="font-medium">Energy €/kWh</label>
              <select
                className="select select-bordered"
                value={energyOp}
                onChange={e => setEnergyOp(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="lte">Below or equal</option>
                <option value="gte">Above or equal</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 10.00"
                className="input input-bordered"
                value={energyVal}
                onChange={e => setEnergyVal(e.target.value)}
                disabled={energyOp === "any"}
              />
            </div>

            {/* Price (time) */}
            <div className="mb-4 grid grid-cols-[110px_1fr_1fr] gap-2 items-center">
              <label className="font-medium">Time €/h</label>
              <select
                className="select select-bordered"
                value={timeOp}
                onChange={e => setTimeOp(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="lte">Below or equal</option>
                <option value="gte">Above or equal</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 5.00"
                className="input input-bordered"
                value={timeVal}
                onChange={e => setTimeVal(e.target.value)}
                disabled={timeOp === "any"}
              />
            </div>

            {/* Status */}
            <div className="mb-4">
              <div className="font-medium mb-2">Status</div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
                {availableStatuses.map(s => {
                  const checked = statusSelected.includes(s);
                  const label = s.charAt(0).toUpperCase() + s.slice(1);
                  return (
                    <label key={s} className="cursor-pointer flex items-center gap-2 border rounded-lg px-3 py-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={checked}
                        onChange={() => toggleStatus(s)}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm opacity-70">
                Showing {filteredPoints.length} of {allPoints.length}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setFilterOpen(false)}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Close (X) */}
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
              onClick={() => setFilterOpen(false)}
              type="button"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

