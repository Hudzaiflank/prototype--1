import http from "node:http";
import { createApp } from "./app.js";
import { createSocketServer } from "./config/socket.js";
import { env } from "./config/env.js";

const httpServer = http.createServer(createApp());
createSocketServer(httpServer);
httpServer.listen(env.port, () =>
  console.log(`PhillyoGo backend listening on port ${env.port}`),
);
