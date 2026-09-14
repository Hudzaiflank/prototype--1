const requests = new Map();

export function rateLimit({ limit = 60, windowMs = 60_000 } = {}) {
  return (request, response, next) => {
    const key = request.ip ?? request.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const entry = requests.get(key);
    if (!entry || now - entry.startedAt >= windowMs) {
      requests.set(key, { startedAt: now, count: 1 });
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
