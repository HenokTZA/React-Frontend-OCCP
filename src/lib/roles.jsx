import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export function Protected({ children }) {
  const { loading, isAuth } = useAuth();
  if (loading) return null;                 // or a spinner
  return isAuth ? children : <Navigate to="/login" replace />;
}

export function RequireRole({ allow, redirect, children }) {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return allow.includes(user.role) ? children : <Navigate to={redirect} replace />;
}

