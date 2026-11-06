import { addRequestLog } from "../services/request-log.service.js";
import { emitRequestLog } from "../config/realtime.js";

function getSocketIp(socket) {
  const headers = socket.handshake.headers;
  const forwardedFor = headers["x-forwarded-for"];
  return (
    headers["cf-connecting-ip"] ??
    (typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : null) ??
    socket.handshake.address ??
    "unknown"
  );
}

function getIdentity(socket) {
  const identity = socket.data.identity;
  if (!identity) return { kind: "UNKNOWN" };
  if (identity.kind === "TEACHER" || identity.kind === "SUPER_ADMIN") {
    return {
      kind: identity.kind,
      userId: identity.user?.userId ?? "unknown",
    };
  }
  if (identity.kind === "STUDENT") {
    return {
      kind: identity.kind,
      participantId: identity.participant?.id ?? "unknown",
      sessionId: identity.participant?.sessionId ?? "unknown",
    };
  }
  return { kind: identity.kind };
}

function addSocketLog(socket, event, startedAt, status = "SUCCESS") {
  const entry = addRequestLog({
    type: "WS",
    timestamp: new Date().toISOString(),
    ip: getSocketIp(socket),
    userAgent: socket.handshake.headers["user-agent"] ?? "unknown",
    method: "SOCKET",
    path: socket.nsp.name,
    event,
    socketId: socket.id,
    identity: getIdentity(socket),
    status,
    statusCode: status === "ERROR" ? 500 : 200,
    durationMs: Date.now() - startedAt,
  });
  emitRequestLog(entry);
}

function instrumentSocket(socket) {
  const originalOn = socket.on.bind(socket);
  socket.on = (event, listener) => {
    if (event === "disconnect" || typeof listener !== "function")
      return originalOn(event, listener);

    return originalOn(event, function instrumentedListener(...args) {
      const startedAt = Date.now();
      try {
        const result = listener.apply(this, args);
        if (result && typeof result.then === "function") {
          return result.then(
            (value) => {
              addSocketLog(socket, event, startedAt);
              return value;
            },
            (error) => {
              addSocketLog(socket, event, startedAt, "ERROR");
              throw error;
            },
          );
        }
        addSocketLog(socket, event, startedAt);
        return result;
      } catch (error) {
        addSocketLog(socket, event, startedAt, "ERROR");
        throw error;
      }
    });
  };

  addSocketLog(socket, "connect", Date.now());
  originalOn("disconnect", (reason) => {
    addSocketLog(socket, "disconnect", Date.now(), reason ? "CLOSED" : "SUCCESS");
  });
}

export function registerSocketLogging(namespace) {
  namespace.on("connection", instrumentSocket);
}
