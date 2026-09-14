import { apiClient } from "./apiClient";
export const teacherApi = {
  list: () => apiClient.get("/teachers"),
  detail: (id) => apiClient.get(`/teachers/${id}`),
  create: (payload) => apiClient.post("/teachers", payload),
};
