import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { historyApi } from "../../services/api/historyApi";
import { formatDateTime } from "../../utils/formatters";

export function RoomHistoryPage() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    historyApi
      .list({ page: 1, limit: 50 })
      .then(({ data }) => setHistory(data.data?.rows ?? data.data ?? []))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ?? "History belum dapat dimuat.",
        ),
      );
  }, []);
  return (
    <section className="space-y-6" aria-labelledby="history-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Teacher space
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="history-title">
          Riwayat permainan
        </h1>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="space-y-3">
        {history.map((item) => (
          <div
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            key={item.id}
          >
            <div>
              <p className="font-semibold">Room {item.roomCode ?? "-"}</p>
              <p className="mt-1 text-xs text-slate-400">{item.status}</p>
            </div>
            <div className="text-right">
              <span className="block text-xs text-slate-400">{formatDateTime(item.finishedAt ?? item.createdAt)}</span>
              <Link className="mt-2 block text-xs text-amber-200" to={`/teacher/history/${item.sessionId}`}>Lihat detail</Link>
            </div>
          </div>
        ))}
      </div>
      {!history.length && !error ? (
        <p className="text-sm text-slate-400">Belum ada history.</p>
      ) : null}
    </section>
  );
}
