import { apiClient } from "./apiClient";
export const historyApi = {
  list: (params) => apiClient.get("/teacher/history", { params }),
  getSessionHistory: (id) =>
    apiClient.get(`/teacher/game-sessions/${id}/history`),
};
