import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";

export function RoleRoute({ roles }) {
  const { user } = useAuthContext();
  return user && roles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}
