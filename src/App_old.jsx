// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Login     from "./pages/Login.jsx";
import Signup    from "./pages/Signup.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* protected */}
        <Route path="/" element={<Dashboard />} />

        {/* fallback */}
        <Route path="*" element={<h1 style={{ textAlign: "center" }}>Not found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

