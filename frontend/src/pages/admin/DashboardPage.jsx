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
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Kelas", data?.classCount],
          ["Guru", data?.teacherCount],
          ["Room aktif", data?.activeRoomCount],
          ["Room selesai", data?.completedRoomCount],
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
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <h2 className="text-lg font-semibold">Game terbaru sekolah</h2>
        <div className="mt-4 space-y-3">
          {data?.recentGames?.length ? (
            data.recentGames.map((game) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"
                key={game.id}
              >
                <div>
                  <p className="font-semibold">Room {game.roomCode}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {game.createdAt
                      ? new Date(game.createdAt).toLocaleString("id-ID")
                      : "-"}
                  </p>
                </div>
                <span className="text-sm text-amber-200">{game.status}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">Belum ada game sekolah.</p>
          )}
        </div>
      </div>
    </section>
  );
}
