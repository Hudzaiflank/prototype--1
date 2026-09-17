import { addRequestLog } from "../services/request-log.service.js";
import { emitRequestLog } from "../config/realtime.js";

export function requestLogMiddleware(request, response, next) {
  const startedAt = Date.now();
  response.on("finish", () => {
    const forwardedFor = request.headers["x-forwarded-for"];
    const ip =
      request.headers["cf-connecting-ip"] ??
      (typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0].trim()
        : null) ??
      request.socket.remoteAddress ??
      "unknown";
    const entry = addRequestLog({
      timestamp: new Date().toISOString(),
      ip,
      userAgent: request.get("user-agent") ?? "unknown",
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
    });
    emitRequestLog(entry);
  });
  next();
}