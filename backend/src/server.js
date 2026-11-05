import http from "node:http";
import { createApp } from "./app.js";
import { createSocketServer } from "./config/socket.js";
import { env } from "./config/env.js";
import { pool } from "./config/database.js";
import { cleanupExpiredGameData } from "./services/retention.service.js";

const httpServer = http.createServer(createApp());
const socketServer = createSocketServer(httpServer);
httpServer.listen(env.port, () =>
  console.log(`PhillyoGo backend listening on port ${env.port}`),
);

let isShuttingDown = false;
async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully`);
  clearInterval(retentionInterval);
  socketServer.close();
  await new Promise((resolve) => httpServer.close(resolve));
  await pool.end();
}

process.once("SIGTERM", () => {
  shutdown("SIGTERM").catch((error) => {
    console.error("Graceful shutdown failed", error);
    process.exitCode = 1;
  });
});
process.once("SIGINT", () => {
  shutdown("SIGINT").catch((error) => {
    console.error("Graceful shutdown failed", error);
    process.exitCode = 1;
  });
});

const retentionInterval = setInterval(
  () => {
    cleanupExpiredGameData().catch((error) =>
      console.error("Retention cleanup failed", error),
    );
  },
  24 * 60 * 60 * 1000,
);
retentionInterval.unref();
