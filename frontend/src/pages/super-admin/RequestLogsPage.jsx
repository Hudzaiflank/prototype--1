import { useEffect, useState } from "react";
import { requestLogApi } from "../../services/api/requestLogApi";
import { createMonitorSocket } from "../../services/socket/monitorSocketClient";
import { getAccessToken } from "../../utils/storage";

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}

export function RequestLogsPage() {
  const [logs, setLogs] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    requestLogApi.list().then(({ data }) => {
      if (active) setLogs(data.data);
    });
    const socket = createMonitorSocket(getAccessToken());
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleRequestLog = (entry) =>
      setLogs((current) => [entry, ...current].slice(0, 500));
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("request-log", handleRequestLog);
    return () => {
      active = false;
      socket.disconnect();
    };
  }, []);

  return (
    <section className="space-y-6" aria-labelledby="request-logs-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Live monitoring
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="request-logs-title">
            Request Logs
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Log realtime dari backend melalui Cloudflare Tunnel.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          {connected ? "Connected" : "Connecting"}
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">User-Agent</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr className="border-b border-slate-900" key={log.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                  {formatTime(log.timestamp)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-amber-200">
                  {log.ip}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="mr-2 text-slate-500">{log.method}</span>
                  {log.path}
                </td>
                <td className="px-4 py-3">{log.statusCode}</td>
                <td className="px-4 py-3">{log.durationMs} ms</td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-400">
                  {log.userAgent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Belum ada request.
          </p>
        ) : null}
      </div>
    </section>
  );
}