import { Outlet } from "react-router-dom";

export function StudentLayout() {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  );
}
