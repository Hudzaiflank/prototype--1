import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";

export function ProtectedRoute() {
  const { user, isLoading } = useAuthContext();
  const location = useLocation();
  if (isLoading) return null;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
