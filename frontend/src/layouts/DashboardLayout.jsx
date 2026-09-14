import { Outlet } from "react-router-dom";

export function DashboardLayout({ role }) {
  return (
    <div data-role={role} className="min-h-screen">
      <Outlet />
    </div>
  );
}
