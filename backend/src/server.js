import http from "node:http";
import { createApp } from "./app.js";
import { createSocketServer } from "./config/socket.js";
import { env } from "./config/env.js";
import { cleanupExpiredGameData } from "./services/retention.service.js";

const httpServer = http.createServer(createApp());
createSocketServer(httpServer);
httpServer.listen(env.port, () =>
  console.log(`PhillyoGo backend listening on port ${env.port}`),
);

const retentionInterval = setInterval(
  () => {
    cleanupExpiredGameData().catch((error) =>
      console.error("Retention cleanup failed", error),
    );
  },
  24 * 60 * 60 * 1000,
);
retentionInterval.unref();
