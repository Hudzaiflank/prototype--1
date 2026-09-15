import { apiClient } from "./apiClient";
export const classApi = {
  list: () => apiClient.get("/classes"),
  detail: (id) => apiClient.get(`/classes/${id}`),
  listAssigned: () => apiClient.get("/teacher/classes"),
  detailAssigned: (id) => apiClient.get(`/teacher/classes/${id}`),
  create: (payload) => apiClient.post("/classes", payload),
  update: (id, payload) => apiClient.patch(`/classes/${id}`, payload),
  assignTeacher: (classId, teacherId) =>
    apiClient.post(`/classes/${classId}/teachers`, { teacherId }),
  removeTeacher: (classId, teacherId) =>
    apiClient.delete(`/classes/${classId}/teachers/${teacherId}`),
};
