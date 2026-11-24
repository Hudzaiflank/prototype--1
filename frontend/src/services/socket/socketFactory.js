import { io } from "socket.io-client";
import { WorkerSocket } from "./workerSocket";
import { socketNamespaceUrl } from "./socketUrl";

const workerRealtimeUrl = import.meta.env.VITE_REALTIME_URL;

export function createSocket(namespace, auth, autoConnect = true) {
  if (workerRealtimeUrl) {
    const socket = new WorkerSocket(namespace, auth);
    if (autoConnect) socket.connect();
    return socket;
  }

  const gameUrl = socketNamespaceUrl(
    import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000",
    "game",
  );
  const monitorSocketUrl = import.meta.env.VITE_MONITOR_SOCKET_URL;
  const legacyUrl =
    namespace === "monitor"
      ? monitorSocketUrl
        ? socketNamespaceUrl(monitorSocketUrl, "monitor")
        : gameUrl.replace(/\/game$/, "/monitor")
      : gameUrl;
  return io(legacyUrl, { auth, autoConnect });
}
