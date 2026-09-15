import { apiClient } from "./apiClient";
export const authApi = {
  login: (payload) => apiClient.post("/auth/login", payload),
  refresh: () => apiClient.post("/auth/refresh"),
  me: () => apiClient.get("/auth/me"),
  logout: () => apiClient.post("/auth/logout"),
};
