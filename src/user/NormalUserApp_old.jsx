import { NavLink, Routes, Route, Navigate, useLocation } from "react-router-dom";
import MapPage     from "./pages/MapPage";
import NearbyPage  from "./pages/NearbyPage";
import ProfilePage from "./pages/ProfilePage";
import TimelinePage from "./pages/TimelinePage";

export default function NormalUserApp() {
  const location = useLocation();
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-base-200 border-r">
        <div className="p-4 text-xl font-semibold">EV</div>
        <nav className="flex flex-col gap-1 px-2">
          <NavLink to="map"      className="btn btn-ghost justify-start">Map</NavLink>
          <NavLink to="nearby"   className="btn btn-ghost justify-start">Nearby</NavLink>
          <NavLink to="profile"  className="btn btn-ghost justify-start">Profile</NavLink>
          <NavLink to="timeline" className="btn btn-ghost justify-start">Timeline</NavLink>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1">
        <Routes location={location}>
          <Route index element={<Navigate to="map" />} />
          <Route path="map"      element={<MapPage />} />
          <Route path="nearby"   element={<NearbyPage />} />
          <Route path="profile"  element={<ProfilePage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="*"        element={<h1>Not found</h1>} />
        </Routes>
      </main>
    </div>
  );
}

