import { apiClient } from "./apiClient";

export const requestLogApi = {
  list: () => apiClient.get("/super-admin/request-logs"),
  listWebsocket: () => apiClient.get("/super-admin/websocket-logs"),
};