import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";

export function ProtectedRoute() {
  const { user } = useAuthContext();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
