import { Outlet } from "react-router-dom";

export function StudentLayout() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#1a0f28] text-[#fdf6e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,#4a2a63_0%,transparent_48%),radial-gradient(circle_at_bottom_left,#1a4fc766,transparent_38%),radial-gradient(circle_at_bottom_right,#c22e2e55,transparent_38%)]" />
      <div className="relative z-10 min-h-screen">
        <Outlet />
      </div>
    </main>
  );
}
