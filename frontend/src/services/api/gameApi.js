import { apiClient } from "./apiClient";
export const gameApi = {
  state: (id) => apiClient.get(`/game-sessions/${id}`),
  startGame: (id) => apiClient.post(`/game-sessions/${id}/start`),
  pauseGame: (id) => apiClient.post(`/game-sessions/${id}/pause`),
  resumeGame: (id) => apiClient.post(`/game-sessions/${id}/resume`),
  revealCard: (sessionId, groupId, turnId) =>
    apiClient.post(
      `/game-sessions/${sessionId}/groups/${groupId}/turn/reveal`,
      { turnId },
    ),
  completeTurn: (sessionId, groupId, turnId) =>
    apiClient.post(
      `/game-sessions/${sessionId}/groups/${groupId}/turn/complete`,
      { turnId },
    ),
  finishGame: (id) => apiClient.post(`/game-sessions/${id}/finish`),
  addTeacherParticipant: (id, payload) =>
    apiClient.post(`/game-sessions/${id}/participants`, payload),
  groups: (id) => apiClient.get(`/game-sessions/${id}/groups`),
  currentTurn: (sessionId, groupId) =>
    apiClient.get(`/game-sessions/${sessionId}/groups/${groupId}/current-turn`),
  previewTeacherImport: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/game-sessions/teacher-input-preview", formData);
  },
  importTeacherParticipants: (sessionId, rows) =>
    apiClient.post(`/game-sessions/${sessionId}/participants/import`, { rows }),
  teacherParticipantTemplate: () =>
    apiClient.get("/game-sessions/teacher-input-template", {
      responseType: "blob",
    }),
};
