import { apiClient } from "./apiClient";
export const teacherApi = {
  list: () => apiClient.get("/teachers"),
  detail: (id) => apiClient.get(`/teachers/${id}`),
  create: (payload) => apiClient.post("/teachers", payload),
  resetPassword: (id) => apiClient.post(`/teachers/${id}/reset-password`),
  import: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/teachers/import", formData);
  },
  previewImport: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/teachers/import/preview", formData);
  },
  template: () =>
    apiClient.get("/teachers/import/template", { responseType: "blob" }),
};
