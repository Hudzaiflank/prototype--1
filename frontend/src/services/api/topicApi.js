import { apiClient } from "./apiClient";
export const topicApi = {
  list: () => apiClient.get("/topics"),
  create: (payload) => apiClient.post("/topics", payload),
};
