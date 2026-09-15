import { useEffect, useState } from "react";
import { dashboardApi } from "../../services/api/dashboardApi";

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    dashboardApi
      .admin()
      .then(({ data: response }) => setData(response.data))
      .catch(() => setError("Dashboard belum dapat dimuat."));
  }, []);
  return (
    <section className="space-y-8" aria-labelledby="admin-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          School management
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="admin-title">
          Dashboard Admin
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Kelola kelas, guru, dan room sekolah.
        </p>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Kelas", data?.classCount],
          ["Guru", data?.teacherCount],
          ["Room aktif", data?.activeRoomCount],
        ].map(([label, value]) => (
          <div
            className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
            key={label}
          >
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-amber-300">
              {value ?? "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
