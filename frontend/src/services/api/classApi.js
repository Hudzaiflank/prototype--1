import { apiClient } from "./apiClient";
export const classApi = {
  list: () => apiClient.get("/classes"),
  detail: (id) => apiClient.get(`/classes/${id}`),
  listAssigned: () => apiClient.get("/teacher/classes"),
  detailAssigned: (id) => apiClient.get(`/teacher/classes/${id}`),
  create: (payload) => apiClient.post("/classes", payload, { headers: { "Content-Type": "multipart/form-data" } }),
  previewStudents: (file, academicYear) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("academicYear", academicYear);
    return apiClient.post("/classes/preview-students", formData, { headers: { "Content-Type": "multipart/form-data" } });
  },
  downloadStudentTemplate: () => apiClient.get("/classes/student-template", { responseType: "blob" }),
  students: (id) => apiClient.get(`/classes/${id}/students`),
  resetStudents: (id) => apiClient.post(`/classes/${id}/students/reset`),
  promote: (payload) => apiClient.post("/classes/promote", payload),
  resetLevel: (payload) => apiClient.post("/classes/reset-level", payload),
  update: (id, payload) => apiClient.patch(`/classes/${id}`, payload),
  assignTeacher: (classId, teacherId) =>
    apiClient.post(`/classes/${classId}/teachers`, { teacherId }),
  removeTeacher: (classId, teacherId) =>
    apiClient.delete(`/classes/${classId}/teachers/${teacherId}`),
};
