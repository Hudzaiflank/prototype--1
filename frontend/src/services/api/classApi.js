import { apiClient } from "./apiClient";
export const classApi = {
  list: () => apiClient.get("/classes"),
  detail: (id) => apiClient.get(`/classes/${id}`),
  listAssigned: () => apiClient.get("/teacher/classes"),
  detailAssigned: (id) => apiClient.get(`/teacher/classes/${id}`),
  create: (payload) => apiClient.post("/classes", payload),
};
