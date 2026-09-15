import { apiClient } from "./apiClient";
export const topicApi = {
  list: () => apiClient.get("/topics"),
  create: (payload) => apiClient.post("/topics", payload),
  update: (id, payload) => apiClient.patch(`/topics/${id}`, payload),
  remove: (id) => apiClient.delete(`/topics/${id}`),
};
