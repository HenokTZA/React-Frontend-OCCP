import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import MapPage from "./pages/MapPage";
import NearbyPage from "./pages/NearbyPage";
import ProfilePage from "./pages/ProfilePage";
import TimelinePage from "./pages/TimelinePage";
import CPDetailPage from "./pages/CPDetailPage";

export default function NormalUserApp() {
  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-base-200 border-r">
        <div className="p-4 text-xl font-semibold">EV</div>
        <nav className="flex flex-col gap-1 px-2">
          <NavLink to="map"      className="btn btn-ghost justify-start">Map</NavLink>
          <NavLink to="nearby"   className="btn btn-ghost justify-start">Nearby</NavLink>
          <NavLink to="profile"  className="btn btn-ghost justify-start">Profile</NavLink>
          <NavLink to="timeline" className="btn btn-ghost justify-start">Timeline</NavLink>
        </nav>
      </aside>

      <main className="flex-1">
        <Routes>
          <Route index element={<Navigate to="map" />} />
          <Route path="map" element={<MapPage />} />
          <Route path="map/:cpId" element={<CPDetailPage />} />   {/* ← detail page */}
          <Route path="map/by-code/:code" element={<CPDetailPage byCode />} /> {/* ← add */}
          <Route path="nearby" element={<NearbyPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="*" element={<h1 className="p-4">Not found</h1>} />
        </Routes>
      </main>
    </div>
  );
}

