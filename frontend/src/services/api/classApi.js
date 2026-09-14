import { apiClient } from "./apiClient";
export const classApi = {
  list: () => apiClient.get("/classes"),
  detail: (id) => apiClient.get(`/classes/${id}`),
  create: (payload) => apiClient.post("/classes", payload),
};
