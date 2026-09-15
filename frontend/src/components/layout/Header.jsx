import { useAuthContext } from "../../hooks/useAuthContext";

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin Sekolah",
  TEACHER: "Guru",
};

export function Header({ onMenuClick }) {
  const { user, logout } = useAuthContext();

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 md:hidden"
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu"
        >
          Menu
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            MindPlay
          </p>
          <p className="hidden text-xs text-slate-400 sm:block">
            Ruang bermain dan refleksi
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-100">
            {user?.fullName ?? user?.email}
          </p>
          <p className="text-xs text-slate-400">
            {ROLE_LABELS[user?.role] ?? user?.role}
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-amber-300 hover:text-amber-200"
          type="button"
          onClick={logout}
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
