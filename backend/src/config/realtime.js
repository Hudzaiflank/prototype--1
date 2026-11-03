let socketServer = null;
let realtimeDispatcher = null;

export function setSocketServer(server) {
  socketServer = server;
}

export function setRealtimeDispatcher(dispatcher) {
  realtimeDispatcher = dispatcher;
}

function dispatch(message, fallback) {
  if (realtimeDispatcher) {
    realtimeDispatcher(message).catch((error) =>
      console.error("Realtime event dispatch failed", error),
    );
    return;
  }
  fallback();
}

export function emitGameEvent(gameSessionId, event, payload) {
  dispatch(
    { scope: "game", id: gameSessionId, event, payload },
    () => socketServer?.of("/game").to(`game:${gameSessionId}`).emit(event, payload),
  );
}

export function emitTeacherGameEvent(gameSessionId, event, payload) {
  dispatch(
    { scope: "teacher", id: gameSessionId, event, payload },
    () =>
      socketServer
        ?.of("/game")
        .to(`teacher-game:${gameSessionId}`)
        .emit(event, payload),
  );
}

export function emitGroupEvent(gameSessionId, groupId, event, payload) {
  dispatch(
    { scope: "group", id: gameSessionId, groupId, event, payload },
    () => socketServer?.of("/game").to(`group:${groupId}`).emit(event, payload),
  );
}

export function emitRequestLog(payload) {
  dispatch(
    { scope: "monitor", id: "monitor", event: "request-log", payload },
    () => socketServer?.of("/monitor").emit("request-log", payload),
  );
}
