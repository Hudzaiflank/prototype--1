import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { historyApi } from "../../services/api/historyApi";
import { formatDateTime } from "../../utils/formatters";

export function HistoryDetailPage() {
  const { sessionId } = useParams();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    historyApi
      .getSessionHistory(sessionId)
      .then(({ data }) => setRows(data.data ?? []))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ??
            "Detail history belum dapat dimuat.",
        ),
      );
  }, [sessionId]);

  return (
    <section className="space-y-6" aria-labelledby="history-detail-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Teacher space
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="history-detail-title">
            Detail history permainan
          </h1>
        </div>
        <Link className="text-sm text-amber-200" to="/teacher/history">
          Kembali ke history
        </Link>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-4 py-3">Turn</th>
              <th className="px-4 py-3">Kelompok</th>
              <th className="px-4 py-3">Peserta</th>
              <th className="px-4 py-3">Diisi oleh</th>
              <th className="px-4 py-3">Permasalahan</th>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="border-b border-slate-800/70"
                key={row.assignmentId}
              >
                <td className="px-4 py-3">
                  {row.turnNumber ?? row.sequenceNumber}
                </td>
                <td className="px-4 py-3">{row.groupNumber ?? "-"}</td>
                <td className="px-4 py-3">{row.participantName}</td>
                <td className="px-4 py-3">{row.problemAuthorName ?? "-"} {row.problemAuthorNisn ? `- ${row.problemAuthorNisn}` : ""}</td>
                <td className="max-w-md px-4 py-3">{row.problemContent}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatDateTime(
                    row.turnCompletedAt ?? row.turnStartedAt ?? row.assignedAt,
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.turnStatus ?? row.assignmentStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !error ? (
          <p className="p-5 text-sm text-slate-400">
            Belum ada detail history.
          </p>
        ) : null}
      </div>
    </section>
  );
}
