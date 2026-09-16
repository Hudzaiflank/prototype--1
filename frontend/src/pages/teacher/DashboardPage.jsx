import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../../services/api/dashboardApi";

export function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .teacher()
      .then(({ data }) => setDashboard(data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ??
            "Dashboard belum dapat dimuat.",
        ),
      );
  }, []);

  return (
    <section className="space-y-8" aria-labelledby="teacher-dashboard-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Teacher space
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="teacher-dashboard-title">
          Dashboard Guru
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Buka room dan pantau permainan kelas kamu.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-400/50 bg-rose-950/30 p-4 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Kelas" value={dashboard?.classes?.length ?? "-"} />
        <Metric
          label="Room aktif"
          value={dashboard?.activeRooms?.length ?? "-"}
        />
        <Metric
          label="Game dijeda"
          value={dashboard?.pausedGames?.length ?? "-"}
        />
        <Metric
          label="Room selesai"
          value={dashboard?.completedRoomCount ?? "-"}
        />
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <h2 className="text-lg font-semibold">Room aktif</h2>
        <div className="mt-4 space-y-3">
          {dashboard?.activeRooms?.length ? (
            dashboard.activeRooms.map((room) => (
              <div
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={room.id}
              >
                <div>
                  <p className="font-semibold">Room {room.code}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Game session: {room.gameSessionId ?? "Belum dibuat"}
                  </p>
                </div>
                {room.gameSessionId ? (
                  <Link
                    className="rounded-lg bg-amber-300 px-4 py-2 text-center text-sm font-bold text-slate-950"
                    to={`/teacher/rooms/${room.id}/monitor?sessionId=${room.gameSessionId}`}
                  >
                    Monitor game
                  </Link>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">Belum ada room aktif.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-amber-300">{value}</p>
    </div>
  );
}
