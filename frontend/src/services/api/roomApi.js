import { apiClient } from "./apiClient";
export const roomApi = {
  join: (roomCode) => apiClient.post("/public/rooms/join", { roomCode }),
  detail: (id) => apiClient.get(`/rooms/${id}`),
  open: (classId) => apiClient.post(`/classes/${classId}/rooms`),
};
