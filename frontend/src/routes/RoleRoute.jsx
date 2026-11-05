import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { PageSkeleton } from "../components/common/PageSkeleton";

export function RoleRoute({ roles }) {
  const { user, isLoading } = useAuthContext();
  if (isLoading) return <PageSkeleton />;
  return user && roles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to={user ? "/dashboard" : "/login"} replace />
  );
}
