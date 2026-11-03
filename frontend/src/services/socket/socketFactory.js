import { io } from "socket.io-client";
import { WorkerSocket } from "./workerSocket";

const workerRealtimeUrl = import.meta.env.VITE_REALTIME_URL;

export function createSocket(namespace, auth, autoConnect = true) {
  if (workerRealtimeUrl) {
    const socket = new WorkerSocket(namespace, auth);
    if (autoConnect) socket.connect();
    return socket;
  }

  const gameUrl =
    import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000/game";
  const legacyUrl =
    namespace === "monitor"
      ? import.meta.env.VITE_MONITOR_SOCKET_URL ??
        gameUrl.replace(/\/game$/, "/monitor")
      : gameUrl;
  return io(legacyUrl, { auth, autoConnect });
}
