import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { MobileMenu } from "../components/layout/MobileMenu";
import { Sidebar } from "../components/layout/Sidebar";

const NAVIGATION = {
  SUPER_ADMIN: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Sekolah", to: "/schools" },
    { label: "Request Logs", to: "/request-logs" },
  ],
  ADMIN: [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Kelas", to: "/admin/classes" },
    { label: "Guru", to: "/admin/teachers" },
    { label: "Topik", to: "/admin/problems" },
  ],
  TEACHER: [
    { label: "Dashboard", to: "/teacher/dashboard" },
    { label: "Kelas Saya", to: "/teacher/classes" },
    { label: "Riwayat", to: "/teacher/history" },
  ],
};

export function DashboardLayout({ role }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const items = NAVIGATION[role] ?? [];

  return (
    <div data-role={role} className="min-h-screen bg-slate-900 text-slate-100">
      <Header onMenuClick={() => setMobileMenuOpen((current) => !current)} />
      {mobileMenuOpen ? (
        <MobileMenu items={items} onClose={() => setMobileMenuOpen(false)} />
      ) : null}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar role={role} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
