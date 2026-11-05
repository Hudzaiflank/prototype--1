import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { PageSkeleton } from "../components/common/PageSkeleton";

export function ProtectedRoute() {
  const { user, isLoading } = useAuthContext();
  const location = useLocation();
  if (isLoading) return <PageSkeleton />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
