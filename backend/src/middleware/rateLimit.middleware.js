const requests = new Map();
let requestsSinceCleanup = 0;

function cleanupExpiredRequests(now) {
  if (requests.size < 1000 && requestsSinceCleanup < 1000) return;
  requestsSinceCleanup = 0;
  for (const [key, entry] of requests) {
    if (entry.expiresAt <= now) requests.delete(key);
  }
}

export function rateLimit({
  limit = 60,
  windowMs = 60_000,
  keyGenerator,
} = {}) {
  return (request, response, next) => {
    const identityKey = keyGenerator?.(request);
    const routeKey = `${request.method}:${request.baseUrl}${request.path}`;
    const key =
      identityKey ??
      `${routeKey}:${request.ip ?? request.socket.remoteAddress ?? "unknown"}`;
    const now = Date.now();
    requestsSinceCleanup += 1;
    cleanupExpiredRequests(now);
    const entry = requests.get(key);
    if (!entry || now - entry.startedAt >= windowMs) {
      requests.set(key, {
        startedAt: now,
        expiresAt: now + windowMs,
        count: 1,
      });
      return next();
    }
    entry.count += 1;
    if (entry.count > limit)
      return response
        .status(429)
        .json({
          success: false,
          message: "Too many requests",
          error: { code: "RATE_LIMITED", details: {} },
        });
    next();
  };
}
