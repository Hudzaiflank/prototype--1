import { apiClient } from "./apiClient";

export const requestLogApi = {
  list: () => apiClient.get("/super-admin/request-logs"),
};