import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CpDetail   from "@/pages/CpDetail.jsx";
import ForgotPassword        from "./pages/ForgotPassword";
import ResetPasswordConfirm  from "./pages/ResetPasswordConfirm";
import Reports from "./pages/Reports";
import DiagnoseList from "@/pages/DiagnoseList.jsx";
import DiagnoseDetail from "@/pages/DiagnoseDetail.jsx";

function ProtectedRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/cp/:id"    element={<CpDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/diagnose" element={<DiagnoseList />} />
      <Route path="/diagnose" element={<DiagnoseList />} />
      <Route path="/diagnose/:id" element={<DiagnoseDetail />} />
      <Route
        path="/reset-password/:uid/:token"
        element={<ResetPasswordConfirm />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
   <Route
  path="/reports"
  element={
    <ProtectedRoute>
      <Reports />
    </ProtectedRoute>
  }
/>

    </Routes>
  );
}


