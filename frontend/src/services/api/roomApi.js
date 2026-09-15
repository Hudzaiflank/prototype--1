import { apiClient } from "./apiClient";
export const roomApi = {
  join: (roomCode) => apiClient.post("/public/rooms/join", { roomCode }),
  registerParticipant: (sessionId, payload) =>
    apiClient.post(`/public/game-sessions/${sessionId}/participants`, payload),
  submitProblem: (sessionId, payload) =>
    apiClient.post(`/public/game-sessions/${sessionId}/problems`, payload),
  studentState: (sessionId, participantSessionId) =>
    apiClient.get(`/public/game-sessions/${sessionId}/state`, {
      headers: { "x-participant-session-id": participantSessionId },
    }),
  detail: (id) => apiClient.get(`/rooms/${id}`),
  open: (classId) => apiClient.post(`/classes/${classId}/rooms`),
  createSession: (roomId, payload) =>
    apiClient.post(`/rooms/${roomId}/game-sessions`, payload),
  close: (roomId) => apiClient.post(`/rooms/${roomId}/close`),
};
