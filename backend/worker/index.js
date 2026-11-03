import { createServer } from "node:http";
import { httpServerHandler } from "cloudflare:node";
import { env as appEnv } from "../src/config/env.js";
import { configureDatabase } from "../src/config/database.js";
import { setRealtimeDispatcher } from "../src/config/realtime.js";
import { cleanupExpiredGameData } from "../src/services/retention.service.js";
import { GameRealtime } from "./realtime.js";

export { GameRealtime };

const server = createServer();
server.listen(8787);
const handleHttp = httpServerHandler({ port: 8787 });

function getRealtimeStub(namespace, id) {
  const objectId = namespace.idFromName(id);
  return namespace.get(objectId);
}

function configureRuntime(bindings) {
  configureDatabase(bindings.HYPERDRIVE.connectionString);
  setRealtimeDispatcher(async ({ scope, id, event, payload, groupId }) => {
    const namespace = bindings.GAME_REALTIME;
    const objectName = scope === "monitor" ? "monitor" : String(id);
    const stub = getRealtimeStub(namespace, objectName);
    const response = await stub.fetch("https://internal/broadcast", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, event, payload, groupId }),
    });
    if (!response.ok)
      throw new Error(`Realtime broadcast failed with status ${response.status}`);
  });
}

function routeRealtime(request, bindings, url) {
  const origin = request.headers.get("origin");
  if (origin && !appEnv.frontendUrls.includes(origin))
    return new Response("Origin not allowed", { status: 403 });

  if (url.pathname === "/realtime/monitor") {
    return forwardWebSocket(request, bindings, "monitor");
  }

  const gameSessionId = url.searchParams.get("gameSessionId");
  if (url.pathname !== "/realtime/game" || !gameSessionId)
    return new Response("Game session is required", { status: 400 });

  const numericSessionId = Number(gameSessionId);
  if (!Number.isSafeInteger(numericSessionId) || numericSessionId <= 0)
    return new Response("Invalid game session", { status: 400 });

  return forwardWebSocket(request, bindings, String(numericSessionId));
}

function forwardWebSocket(request, bindings, objectName) {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket")
    return new Response("WebSocket upgrade required", { status: 426 });
  const stub = getRealtimeStub(bindings.GAME_REALTIME, objectName);
  return stub.fetch(request);
}

export default {
  async fetch(request, bindings, context) {
    configureRuntime(bindings);
    const url = new URL(request.url);
    if (url.pathname.startsWith("/realtime/"))
      return routeRealtime(request, bindings, url);
    return handleHttp(request, bindings, context);
  },
  scheduled(_event, bindings, context) {
    configureRuntime(bindings);
    context.waitUntil(
      cleanupExpiredGameData().catch((error) =>
        console.error("Scheduled game data cleanup failed", error),
      ),
    );
  },
};
