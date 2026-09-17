import { io } from "socket.io-client";

export function createMonitorSocket(token) {
  const configuredUrl = import.meta.env.VITE_MONITOR_SOCKET_URL;
  const fallbackUrl =
    import.meta.env.VITE_SOCKET_URL?.replace(/\/game$/, "/monitor") ??
    "http://localhost:3000/monitor";
  return io(configuredUrl ?? fallbackUrl, {
    auth: { token },
    autoConnect: true,
  });
}