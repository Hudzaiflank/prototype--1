import { getRequestLogs } from "../services/request-log.service.js";

export function list(_request, response) {
  response.json({ success: true, data: getRequestLogs() });
}