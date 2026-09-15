import { apiClient } from "./apiClient";
export const schoolApi = {
  list: () => apiClient.get("/schools"),
  detail: (id) => apiClient.get(`/schools/${id}`),
  create: (payload) => apiClient.post("/schools", payload),
  updateStatus: (id, status) =>
    apiClient.patch(`/schools/${id}/status`, { status }),
  remove: (id) => apiClient.delete(`/schools/${id}`),
  resetAdminPassword: (id) =>
    apiClient.post(`/schools/${id}/admin/reset-password`),
};
