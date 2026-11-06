import {
  getHttpLogs,
  getWebsocketLogs,
} from "../services/request-log.service.js";

function sendLogs(getLogs, response) {
  response.json({ success: true, data: getLogs() });
}

export function list(_request, response) {
  sendLogs(getHttpLogs, response);
}

export function listWebsocket(_request, response) {
  sendLogs(getWebsocketLogs, response);
}