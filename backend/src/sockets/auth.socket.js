import { verifyAccessToken } from "../utils/token.js";
import { findParticipantBySession } from "../repositories/room.repository.js";

export function registerSocketAuth(namespace) {
  namespace.use(async (socket, next) => {
    try {
      const { token, participantSessionId, gameSessionId } =
        socket.handshake.auth ?? {};
      if (token) {
        const user = verifyAccessToken(token);
        if (user.role !== "TEACHER")
          return next(new Error("Teacher socket authorization required"));
        socket.data.identity = {
          kind: "TEACHER",
          user,
        };
        return next();
      }
      if (!participantSessionId || !gameSessionId)
        return next(new Error("Socket authentication required"));
      const participant = await findParticipantBySession(
        gameSessionId,
        participantSessionId,
      );
      if (!participant) return next(new Error("Participant session not found"));
      socket.data.identity = { kind: "STUDENT", participant };
      next();
    } catch {
      next(new Error("Socket authentication failed"));
    }
  });
}
