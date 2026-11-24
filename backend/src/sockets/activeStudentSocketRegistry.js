export function createActiveStudentSocketRegistry() {
  const activeSockets = new Map();

  return {
    claim(participantId, socket) {
      const key = String(participantId);
      if (activeSockets.has(key)) return false;
      activeSockets.set(key, socket);
      return true;
    },
    release(participantId, socket) {
      const key = String(participantId);
      if (activeSockets.get(key) === socket) activeSockets.delete(key);
    },
  };
}
