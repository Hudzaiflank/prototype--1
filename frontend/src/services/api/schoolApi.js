import { apiClient } from "./apiClient";
export const schoolApi = {
  list: () => apiClient.get("/schools"),
  detail: (id) => apiClient.get(`/schools/${id}`),
  create: (payload) => apiClient.post("/schools", payload),
};
