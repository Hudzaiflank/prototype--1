import { createSocket } from "./socketFactory";

export function createMonitorSocket(token) {
  return createSocket("monitor", { token });
}