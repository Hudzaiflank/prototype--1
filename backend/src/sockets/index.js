import { registerSocketAuth } from "./auth.socket.js";
import { registerGameSocket } from "./game.socket.js";
import { registerMonitorSocket } from "./monitor.socket.js";
import { registerSocketLogging } from "./socket-log.middleware.js";

export function registerSocketHandlers(io) {
  const game = io.of("/game");
  registerSocketLogging(game);
  registerSocketAuth(game);
  registerGameSocket(game);
  const monitor = io.of("/monitor");
  registerSocketLogging(monitor);
  registerMonitorSocket(monitor);
}
