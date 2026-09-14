let socketServer = null;

export function setSocketServer(server) {
  socketServer = server;
}

export function emitGameEvent(gameSessionId, event, payload) {
  socketServer?.of("/game").to(`game:${gameSessionId}`).emit(event, payload);
}

export function emitTeacherGameEvent(gameSessionId, event, payload) {
  socketServer
    ?.of("/game")
    .to(`teacher-game:${gameSessionId}`)
    .emit(event, payload);
}

export function emitGroupEvent(groupId, event, payload) {
  socketServer?.of("/game").to(`group:${groupId}`).emit(event, payload);
}
