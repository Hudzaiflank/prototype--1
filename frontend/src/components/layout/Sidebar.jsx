import { NavLink } from "react-router-dom";

const NAVIGATION = {
  SUPER_ADMIN: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Sekolah", to: "/schools" },
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

export function Sidebar({ role, onNavigate }) {
  return (
    <aside
      className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 px-4 py-6 md:block"
      aria-label="Sidebar"
    >
      <nav className="space-y-1">
        {(NAVIGATION[role] ?? []).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-sm transition ${
                isActive
                  ? "bg-amber-300 font-semibold text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-amber-200"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
