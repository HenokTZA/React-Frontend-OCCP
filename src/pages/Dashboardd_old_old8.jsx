/**********************************************************************
 * Dashboard.jsx – prices + location stored in DB (no localStorage)   *
 *********************************************************************/
import { useEffect, useState, useRef } from "react";
import { createPortal }        from "react-dom";
import { fetchJson }           from "@/lib/api";
import { useAuth }             from "@/lib/auth";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ✅ use package entry + css (no deep path)
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

// fix missing marker icons when bundling
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });



/* ─────────────── helpers ────────────────────────────────────────── */
const fmt = d => (d ? new Date(d).toLocaleString() : "—");
const cpKey = (cp) => cp?.pk ?? cp?.id;



/** one-liner wrapper around fetchJson for PATCHing a CP row */
function patchCP(pk, body) {
  return fetchJson(`/charge-points/${encodeURIComponent(pk)}/`, {
    method : "PATCH",
    body   : JSON.stringify(body),
  });
}

/* ────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  /* server-side data */
  const [me,  setMe ] = useState(null);
  const [cps, setCps] = useState(null);
  const [sessions,setSes]=useState(null);

  /* menu / modal UI state */
  const [menuOpen ,setMenu ] = useState(null);   // cp id | null (⋮ menu)
  const [editCP  ,setEdit ] = useState(null);    // cp id | null (price modal)
  const [locCP   ,setLocCP] = useState(null);    // cp id | null (location modal)

  /* temp input fields inside the two modals */
  const [tmpK,setTmpK]  = useState("");
  const [tmpH,setTmpH]  = useState("");
  const [tmpL,setTmpL]  = useState("");

  // add inside Dashboard() with the other temp inputs
  const [tmpLat, setTmpLat] = useState(null);
  const [tmpLng, setTmpLng] = useState(null);


  /* login + first fetch */
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    fetchJson("/me").then(setMe).catch(() => logout());
  }, []);

  /* load + poll every 5 s */
  useEffect(() => {
    if (!me?.tenant_ws) return;
    const load = () =>
      Promise
        .all([fetchJson("/charge-points/"), fetchJson("/sessions/")])
        .then(([c, s]) => { setCps(c); setSes(s); });

    load();
    const t = setInterval(load, 5_000);
    return () => clearInterval(t);
  }, [me]);

  async function handleLogout() {
    try {
      await logout();              // clear session client/server
      navigate("/login"); 
    } finally {
      navigate("/login", { replace: true }); // go to login, prevent back nav
    }
  }


  /* optimistic UI helpers ----------------------------------------- */
  async function updatePrices(pk) {
    const pkwh = Number(tmpK) || 0;
    const ph = Number(tmpH) || 0;
    await patchCP(pk, { price_per_kwh: pkwh, price_per_hour: ph });
    setCps(arr => arr.map(c =>
      cpKey(c) === pk ? { ...c, price_per_kwh: pkwh, price_per_hour: ph } : c
    ));
  }

  async function updateLocation(pk) {
  const location = tmpL.trim();
  const body = { location };
  if (tmpLat != null && tmpLng != null) {
    body.lat = tmpLat;
    body.lng = tmpLng;
  }
  await patchCP(pk, body);
  setCps(arr => arr.map(c => (cpKey(c) === pk ? { ...c, ...body } : c)));
}

/*
function LocationPickerModal({
  address, setAddress,
  lat, setLat, lng, setLng,
  onCancel, onSave,
}) {
  const mapRef = useState(null)[0];
  const mapDiv = useState(null)[0];
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // create a stable ref for the div
  const setMapDiv = el => { if (!mapDiv) { LocationPickerModal.mapDiv = el; } };

  // init map once when modal mounts
  useEffect(() => {
    if (map) return;
    const el = LocationPickerModal.mapDiv;
    if (!el) return;

    const start = [lat ?? 46.948, lng ?? 7.4474]; // fallback center (Bern)
    const m = L.map(el, { zoomControl: true }).setView(start, lat && lng ? 15 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(m);

    // geocoder control on map
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      geocoder: L.Control.Geocoder.nominatim()
    })
    .on('markgeocode', (e) => {
      const c = e.geocode.center;
      placeMarker(c.lat, c.lng, m);
      setAddress(e.geocode.name ?? address);
      m.setView(c, 16);
    })
    .addTo(m);

    // click to set marker
    m.on('click', (e) => placeMarker(e.latlng.lat, e.latlng.lng, m));

    setMap(m);

    // fix sizing inside modal
    setTimeout(() => m.invalidateSize(), 0);

    return () => m.remove();
  }, [map]);

  function placeMarker(a, b, m) {
    if (!marker) {
      const mk = L.marker([a, b], { draggable: true }).addTo(m);
      mk.on('dragend', () => {
        const p = mk.getLatLng();
        setLat(Number(p.lat.toFixed(6)));
        setLng(Number(p.lng.toFixed(6)));
        reverse(p.lat, p.lng);
      });
      setMarker(mk);
    } else {
      marker.setLatLng([a, b]);
    }
    setLat(Number(a.toFixed(6)));
    setLng(Number(b.toFixed(6)));
    reverse(a, b);
  }

  // reverse geocode to fill the address box
  function reverse(a, b) {
    const nominatim = L.Control.Geocoder.nominatim();
    nominatim.reverse({lat: a, lng: b}, 18, (res) => {
      if (res && res[0] && res[0].name) setAddress(res[0].name);
    });
  }

  // simple “enter to geocode” for the input
  function geocodeFromInput(e) {
    if (e.key !== 'Enter' || !map) return;
    e.preventDefault();
    const nominatim = L.Control.Geocoder.nominatim();
    nominatim.geocode(address, (results) => {
      if (!results || !results[0]) return;
      const c = results[0].center || results[0].bbox?.getCenter?.();
      if (c) {
        placeMarker(c.lat, c.lng, map);
        map.setView(c, 16);
      }
    });
  }

  return (
    <Modal onClose={onCancel}>
      <h2 className="text-xl font-semibold mb-4">Set location</h2>

      <div className="mb-6 p-4 rounded shadow border space-y-3">
        <Field
          label="Address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={geocodeFromInput}
        />
        <div
          ref={setMapDiv}
          className="rounded"
          style={{ height: 380 }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"  value={lat ?? ''}  onChange={() => {}} />
          <Field label="Longitude" value={lng ?? ''} onChange={() => {}} />
        </div>
        <p className="text-xs text-slate-500">
          Search, click the map, or drag the pin. We’ll save this address (and coordinates if supported).
        </p>
      </div>

      <ModalButtons onCancel={onCancel} onSave={onSave} />
    </Modal>
  );
}
*/







/*
function LocationPickerModal({
  address, setAddress,
  lat, setLat, lng, setLng,
  onCancel, onSave,
}) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;

    const start = [lat ?? 46.948, lng ?? 7.4474]; // Bern fallback
    const map = L.map(mapDivRef.current, { zoomControl: true })
      .setView(start, lat && lng ? 15 : 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    L.Control.geocoder({
      defaultMarkGeocode: false,
      geocoder: L.Control.Geocoder.nominatim(),
    })
      .on("markgeocode", (e) => {
        const c = e.geocode.center;
        placeMarker(c.lat, c.lng, map);
        if (e.geocode.name) setAddress(e.geocode.name);
        map.setView(c, 16);
      })
      .addTo(map);

    map.on("click", (e) => placeMarker(e.latlng.lat, e.latlng.lng, map));

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [lat, lng, setAddress]);

  function placeMarker(a, b, map) {
    if (!markerRef.current) {
      const mk = L.marker([a, b], { draggable: true }).addTo(map);
      mk.on("dragend", () => {
        const p = mk.getLatLng();
        setLat(Number(p.lat.toFixed(6)));
        setLng(Number(p.lng.toFixed(6)));
        reverseGeocode(p.lat, p.lng);
      });
      markerRef.current = mk;
    } else {
      markerRef.current.setLatLng([a, b]);
    }
    setLat(Number(a.toFixed(6)));
    setLng(Number(b.toFixed(6)));
    reverseGeocode(a, b);
  }

  function reverseGeocode(a, b) {
    const nominatim = L.Control.Geocoder.nominatim();
    nominatim.reverse({ lat: a, lng: b }, 18, (res) => {
      if (res?.[0]?.name) setAddress(res[0].name);
    });
  }

  function geocodeFromInput(e) {
    if (e.key !== "Enter" || !mapRef.current) return;
    e.preventDefault();
    const nominatim = L.Control.Geocoder.nominatim();
    nominatim.geocode(address, (results) => {
      const best = results?.[0];
      const c = best?.center ?? best?.bbox?.getCenter?.();
      if (!c) return;
      placeMarker(c.lat, c.lng, mapRef.current);
      mapRef.current.setView(c, 16);
    });
  }

  return (
    <Modal onClose={onCancel}>
      <h2 className="text-xl font-semibold mb-4">Set location</h2>

      <div className="mb-6 p-4 rounded shadow border space-y-3">
        <Field
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={geocodeFromInput}
        />
        <div
          ref={mapDivRef}
          className="rounded border"
          style={{ height: 380, width: "100%" }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"  value={lat ?? ""}  onChange={() => {}} />
          <Field label="Longitude" value={lng ?? ""} onChange={() => {}} />
        </div>
        <p className="text-xs text-slate-500">
          Search, click the map, or drag the pin. We’ll save this address and, if available, its exact coordinates.
        </p>
      </div>

      <ModalButtons onCancel={onCancel} onSave={onSave} />
    </Modal>
  );
}
*/






/*
function LocationPickerModal({
  address, setAddress,
  lat, setLat, lng, setLng,
  onCancel, onSave,
}) {
  const mapDivRef   = useRef(null);
  const mapRef      = useRef(null);   // L.Map
  const markerRef   = useRef(null);   // L.Marker
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // init once
    if (!mapDivRef.current || mapRef.current) return;

    const start = [lat ?? 46.948, lng ?? 7.4474]; // Bern fallback
    const map = L.map(mapDivRef.current, { zoomControl: true }).setView(start, lat && lng ? 15 : 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    // prevent map click/scroll from closing the modal/backdrop
    L.DomEvent.disableClickPropagation(mapDivRef.current);
    L.DomEvent.disableScrollPropagation(mapDivRef.current);

    // geocoder
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      geocoder: L.Control.Geocoder.nominatim(),
    })
      .on("markgeocode", (e) => {
        const c = e.geocode.center;
        placeMarker(c.lat, c.lng);
        setAddress(e.geocode.name ?? address);
        map.setView(c, 16);
      })
      .addTo(map);

    // click to set marker
    map.on("click", (e) => placeMarker(e.latlng.lat, e.latlng.lng));

    mapRef.current = map;
    setReady(true);

    // fix sizing after modal paint
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      // full cleanup to avoid callbacks firing on a removed map
      map.off();
      geocoder.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapDivRef.current]);

  function placeMarker(a, b) {
    const map = mapRef.current;
    if (!map) return;

    if (!markerRef.current) {
      const mk = L.marker([a, b], { draggable: true }).addTo(map);
      mk.on("dragend", () => {
        const p = mk.getLatLng();
        setLat(Number(p.lat.toFixed(6)));
        setLng(Number(p.lng.toFixed(6)));
        reverse(p.lat, p.lng);
      });
      markerRef.current = mk;
    } else {
      markerRef.current.setLatLng([a, b]);
    }
    setLat(Number(a.toFixed(6)));
    setLng(Number(b.toFixed(6)));
    reverse(a, b);
  }

  function reverse(a, b) {
    const nominatim = L.Control.Geocoder.nominatim();
    nominatim.reverse({ lat: a, lng: b }, 18, (res) => {
      if (res?.[0]?.name) setAddress(res[0].name);
    });
  }

  function geocodeFromInput(e) {
    if (e.key !== "Enter" || !mapRef.current) return;
    e.preventDefault();
    const nominatim = L.Control.Geocoder.nominatim();
    nominatim.geocode(address, (results) => {
      const c = results?.[0]?.center || results?.[0]?.bbox?.getCenter?.();
      if (c) {
        placeMarker(c.lat, c.lng);
        mapRef.current.setView(c, 16);
      }
    });
  }

  return (
    <Modal onClose={onCancel}>
      <h2 className="text-xl font-semibold mb-4">Set location</h2>

      <div className="mb-6 p-4 rounded shadow border space-y-3">
        <Field
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={geocodeFromInput}
        />
        <div
          ref={mapDivRef}
          className="rounded"
          style={{ height: 380 }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"  value={lat ?? ""}  readOnly />
          <Field label="Longitude" value={lng ?? ""} readOnly />
        </div>
        <p className="text-xs text-slate-500">
          Search, click the map, or drag the pin. We’ll save this address (and coordinates if supported).
        </p>
      </div>

      <ModalButtons onCancel={onCancel} onSave={onSave} />
    </Modal>
  );
}
*/







function LocationPickerModal({ address, setAddress, lat, setLat, lng, setLng, onCancel, onSave }) {
  const mapDivRef = useRef(null);
  const mapRef    = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // prevent double init
    if (!mapDivRef.current || mapRef.current) return;
    // make sure container is actually in DOM
    if (!mapDivRef.current.isConnected) return;

    const start = [lat ?? 46.948, lng ?? 7.4474];
    const map = L.map(mapDivRef.current, {
      zoomControl: true,
      // ↓ turn off animations that can tick after unmount
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      inertia: false,
    }).setView(start, lat && lng ? 15 : 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    // keep modal clicks from propagating to overlay
    L.DomEvent.disableClickPropagation(mapDivRef.current);
    L.DomEvent.disableScrollPropagation(mapDivRef.current);

    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
      geocoder: L.Control.Geocoder.nominatim(),
    })
      .on("markgeocode", (e) => {
        const c = e.geocode.center;
        placeMarker(c.lat, c.lng);
        setAddress(e.geocode.name ?? address);
        if (mapRef.current) mapRef.current.setView(c, 16);
      })
      .addTo(map);

    map.on("click", (e) => placeMarker(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;

    // sizing fix after mount
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      // cleanup in the right order, and null refs
      try { geocoder.off(); } catch {}
      try { markerRef.current?.remove(); } catch {}
      try { map.off(); } catch {}
      try { map.remove(); } catch {}
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [address, lat, lng, setAddress]);

  function placeMarker(a, b) {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      const mk = L.marker([a, b], { draggable: true }).addTo(map);
      mk.on("dragend", () => {
        const p = mk.getLatLng();
        setLat(Number(p.lat.toFixed(6)));
        setLng(Number(p.lng.toFixed(6)));
        reverse(p.lat, p.lng);
      });
      markerRef.current = mk;
    } else {
      markerRef.current.setLatLng([a, b]);
    }
    setLat(Number(a.toFixed(6)));
    setLng(Number(b.toFixed(6)));
    reverse(a, b);
  }

  function reverse(a, b) {
    const nominatim = L.Control.Geocoder.nominatim();
    nominatim.reverse({ lat: a, lng: b }, 18, (res) => {
      if (res?.[0]?.name) setAddress(res[0].name);
    });
  }

  function geocodeFromInput(e) {
    if (e.key !== "Enter" || !mapRef.current) return;
    e.preventDefault();
    const nominatim = L.Control.Geocoder.nominatim();
    nominatim.geocode(address, (results) => {
      const c = results?.[0]?.center || results?.[0]?.bbox?.getCenter?.();
      if (c && mapRef.current) {
        placeMarker(c.lat, c.lng);
        mapRef.current.setView(c, 16);
      }
    });
  }

  return (
    <Modal onClose={onCancel}>
      <h2 className="text-xl font-semibold mb-4">Set location</h2>
      <div className="mb-6 p-4 rounded shadow border space-y-3">
        <Field label="Address" value={address}
               onChange={(e)=>setAddress(e.target.value)}
               onKeyDown={geocodeFromInput} />
        <div ref={mapDivRef} className="rounded" style={{ height: 380, width: "100%" }} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude"  value={lat ?? ""}  readOnly />
          <Field label="Longitude" value={lng ?? ""} readOnly />
        </div>
        <p className="text-xs text-slate-500">
          Search, click the map, or drag the pin. We’ll save this address (and coordinates if supported).
        </p>
      </div>
      <ModalButtons onCancel={onCancel} onSave={onSave} />
    </Modal>
  );
}

    



   
  





  /* early returns */
  if (!me)             return <p className="p-8">Loading…</p>;
  if (!me.tenant_ws)   return <p className="p-8">You don’t own a tenant yet.</p>;
  if (!cps || !sessions) return <p className="p-8">Loading charge-points…</p>;

  /* ─────────────── render ───────────────────────────────────────── */
  return (
    <div className="p-8 space-y-10">
      <h1 className="text-2xl font-bold flex items-center justify-between">
  <span>Dashboard</span>
  <Link
    to="/reports"
    className="px-4 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
  >
    Create report
  </Link>

<Link to="/diagnose" className="btn btn-outline">
          Diagnose
        </Link>
<button className="btn" onClick={handleLogout}>Logout</button>
</h1>

      {/* websocket url */}
      <div>
        <p className="mb-1">Connect your charge-points to:</p>
        <code className="block p-2 bg-slate-100 rounded">
          {me.tenant_ws.replace(/^ws:\/\/[^/]+/, "ws://147.93.127.215:9000")}
        </code>
      </div>

      {/* charge-points */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Charge-points</h2>

        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th>ID</th><th>Status</th><th>Conn</th><th>Updated</th>
              <th className="text-right">€/kWh</th>
              <th className="text-right">€/h</th><th></th>
            </tr>
          </thead>
          <tbody>
  {cps.map(cp => {
    const fmtPrice = v =>
      v == null ? "—" : Number(v).toFixed(3);     // 3 dec for kWh
    const fmtHour  = v =>
      v == null ? "—" : Number(v).toFixed(2);     // 2 dec for €/h

    return (
      <tr
        key={cp.id}
        className="border-b last:border-0 hover:bg-slate-50"
      >
        {/* ── ident / quick-link ───────────────────────── */}
        <td
          className="cursor-pointer"
          onClick={() => (location.href = `/cp/${cp.id}`)}
        >
          {cp.id}
        </td>

        {/* ── live status coming from the backend ─────── */}
        <td>{cp.status}</td>
        <td>{cp.connector_id}</td>
        <td>{fmt(cp.updated)}</td>

        {/* ── persisted prices ────────────────────────── */}
        <td className="text-right">{fmtPrice(cp.price_per_kwh)}</td>
        <td className="text-right">{fmtHour(cp.price_per_hour)}</td>

        {/* ── “⋮” context menu ───────────────────────── */}
        <td className="relative">
          <button
            className="px-2 text-lg"
            onClick={() => setMenu(m => (m === cp.id ? null : cp.id))}
          >
            ⋮
          </button>

          {menuOpen === cp.id && (
            <ul
              className="absolute right-0 z-10 mt-1 w-48 bg-white border rounded shadow"
              onMouseLeave={() => setMenu(null)}
            >
              <Li
                label="✏️  Edit connector"
                cb={() => {
                  /* pre-fill modal fields with CURRENT values */
                  setTmpK(cp.price_per_kwh  ?? "");
                  setTmpH(cp.price_per_hour ?? "");
                  setEdit(cp.id);
                  setMenu(null);
                }}
              />
              <Li
                label="📍 Set location"
                cb={() => {
                  setTmpL(cp.location ?? "");
                  setTmpLat(cp.lat ?? null);   // ok if your API doesn’t have these yet
                  setTmpLng(cp.lng ?? null);
                  setLocCP(cp.id);
                  setMenu(null);
                }}
              />
              <Li label="👥 Define users"  disabled />
              <Li label="🗓️  Define times" disabled />
            </ul>
          )}
        </td>
      </tr>
    );
  })}
</tbody>

        </table>
      </section>

      {/* recent sessions */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Recent sessions</h2>

        <table className="w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th>ID</th><th>CP</th><th>kWh</th>
              <th>Started</th><th>Stopped</th>
              <th className="text-right">Total (€)</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => {
              const cp = cps.find(c => c.id === s.cp);          // look up price
              const k  = Number(s.kWh ?? 0);
              const tot = cp?.price_per_kwh
                ? (k * cp.price_per_kwh).toFixed(2)
                : "—";

              return (
                <tr key={s.id} className="border-b last:border-0">
                  <td>{s.id}</td><td>{s.cp}</td><td>{k.toFixed(3)}</td>
                  <td>{fmt(s.Started)}</td><td>{fmt(s.Ended)}</td>
                  <td className="text-right">{tot}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ── price modal ───────────────────────────────────────────── */}
      {editCP && createPortal(
        <Modal onClose={() => setEdit(null)}>
          <h2 className="text-xl font-semibold mb-4">Edit connector</h2>

          <div className="mb-6 p-4 rounded shadow border">
            <h3 className="font-medium mb-4">Prices</h3>
            <div className="grid grid-cols-2 gap-6">
              <Field
                label="Price per kWh (€)"
                value={tmpK}
                onChange={e => setTmpK(e.target.value)}
              />
              <Field
                label="Price per h  (€)"
                value={tmpH}
                onChange={e => setTmpH(e.target.value)}
              />
            </div>
          </div>

          <ModalButtons
            onCancel={() => setEdit(null)}
            onSave={async () => {
              await updatePrices(editCP);
              setEdit(null);
            }}
          />
        </Modal>,
        document.body
      )}

      {locCP && createPortal(
  <LocationPickerModal
    address={tmpL} setAddress={setTmpL}
    lat={tmpLat} setLat={setTmpLat}
    lng={tmpLng} setLng={setTmpLng}
    onCancel={() => setLocCP(null)}
    onSave={async () => {
      await updateLocation(locCP);
      setLocCP(null);
    }}
  />,
  document.body
)}
      

    </div>
  );
}

/* ——————————— small presentational helpers ——————————— */
const Li = ({ label, cb, disabled }) => (
  <li>
    <button
      disabled={disabled}
      onClick={cb}
      className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 disabled:text-slate-400"
    >
      {label}
    </button>
  </li>
);

/*
const Modal = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-20 flex items-center justify-center bg-black/30"
    onClick={onClose}
  >
    <div
      className="max-h-[90vh] w-[34rem] overflow-y-auto bg-white rounded shadow-lg p-6"
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);
*/

const Modal = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-20 flex items-center justify-center bg-black/30"
    onClick={(e) => {
      // only close when clicking the backdrop itself
      if (e.target === e.currentTarget) onClose?.();
    }}
  >
    <div
      className="max-h-[90vh] w-[34rem] overflow-y-auto bg-white rounded shadow-lg p-6"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);


const Field = ({ label, value, onChange, ...rest }) => (
  <label className="block">
    <span className="text-sm text-slate-600">{label}</span>
    <input
      className="mt-1 w-full border-b outline-none focus:border-blue-500 py-1"
      value={value}
      onChange={onChange}
      {...rest}
    />
  </label>
);

const ModalButtons = ({ onCancel, onSave }) => (
  <div className="flex justify-end gap-3">
    <button
      className="px-4 py-1.5 rounded bg-slate-100"
      onClick={onCancel}
    >
      Cancel
    </button>
    <button
      className="px-4 py-1.5 rounded bg-blue-600 text-white"
      onClick={onSave}
    >
      Save
    </button>
  </div>
);

