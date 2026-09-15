import { apiClient } from "./apiClient";

export const dashboardApi = {
  teacher: () => apiClient.get("/teacher/dashboard"),
  admin: () => apiClient.get("/admin/dashboard"),
  superAdmin: () => apiClient.get("/super-admin/dashboard"),
};
