import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";

export function RoleRoute({ roles }) {
  const { user, isLoading } = useAuthContext();
  if (isLoading) return null;
  return user && roles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to={user ? "/dashboard" : "/login"} replace />
  );
}
