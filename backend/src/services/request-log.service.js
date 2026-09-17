const MAX_LOGS = 500;
const requestLogs = [];
let nextId = 1;

export function addRequestLog(log) {
  const entry = { id: nextId++, ...log };
  requestLogs.unshift(entry);
  if (requestLogs.length > MAX_LOGS) requestLogs.length = MAX_LOGS;
  return entry;
}

export function getRequestLogs() {
  return [...requestLogs];
}