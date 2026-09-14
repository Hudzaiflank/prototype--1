import { apiClient } from "./apiClient";
export const gameApi = {
  state: (id) => apiClient.get(`/game-sessions/${id}`),
  startGame: (id) => apiClient.post(`/game-sessions/${id}/start`),
  pauseGame: (id) => apiClient.post(`/game-sessions/${id}/pause`),
  resumeGame: (id) => apiClient.post(`/game-sessions/${id}/resume`),
  revealCard: (sessionId, groupId) =>
    apiClient.post(`/game-sessions/${sessionId}/groups/${groupId}/turn/reveal`),
  completeTurn: (sessionId, groupId) =>
    apiClient.post(
      `/game-sessions/${sessionId}/groups/${groupId}/turn/complete`,
    ),
  finishGame: (id) => apiClient.post(`/game-sessions/${id}/finish`),
};
