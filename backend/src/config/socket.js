import { Server } from "socket.io";
import { env } from "./env.js";
import { registerSocketHandlers } from "../sockets/index.js";

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.frontendUrl, credentials: true },
  });
  registerSocketHandlers(io);
  return io;
}
