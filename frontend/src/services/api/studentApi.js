import { apiClient } from "./apiClient";

export const studentApi = {
  list: () => apiClient.get("/students"),
  history: (id) => apiClient.get(`/students/${id}/history`),
};