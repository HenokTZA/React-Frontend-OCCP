import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login     from "./pages/Login";
import Signup    from "./pages/Signup";

function RequireAuth({ children }) {
  const loggedIn = !!localStorage.getItem("accessToken");
  return loggedIn ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/login"  element={<Login />} />
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

        <Route path="*" element={<h1 style={{textAlign:"center"}}>Not found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

