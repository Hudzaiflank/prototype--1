import { apiClient } from "./apiClient";
export const historyApi = {
  getSessionHistory: (id) =>
    apiClient.get(`/teacher/game-sessions/${id}/history`),
};
