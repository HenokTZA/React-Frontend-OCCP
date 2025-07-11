// src/routes.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login      from './components/auth/Login';
import Signup     from './components/auth/Signup';
import Dashboard  from './components/dashboard/Dashboard';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login     />} />
        <Route path="/signup"   element={<Signup    />} />
        <Route path="/"         element={<Dashboard />} />
        {/* 404 fallback */}
        <Route path="*"         element={<h1>Not found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}


