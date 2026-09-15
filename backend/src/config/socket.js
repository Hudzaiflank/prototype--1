import { Server } from "socket.io";
import { env } from "./env.js";
import { registerSocketHandlers } from "../sockets/index.js";
import { setSocketServer } from "./realtime.js";

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.frontendUrls, credentials: true },
  });
  registerSocketHandlers(io);
  setSocketServer(io);
  return io;
}
