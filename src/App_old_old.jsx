// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login     from "./pages/Login";
import Signup    from "./pages/Signup";
import { isAuthenticated } from "./lib/auth";

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/login"  element={<Login />}  />
      <Route path="/signup" element={<Signup />} />

      {/* protected */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      {/* 404 */}
      <Route path="*" element={<h1 style={{textAlign:'center'}}>Not found</h1>} />
    </Routes>
  );
}

