import { registerSocketAuth } from "./auth.socket.js";
import { registerGameSocket } from "./game.socket.js";

export function registerSocketHandlers(io) {
  const game = io.of("/game");
  registerSocketAuth(game);
  registerGameSocket(game);
}
