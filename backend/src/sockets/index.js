import { Server } from "socket.io";

export function registerSocketHandlers(io) {
  const game = io.of("/game");
  game.on("connection", (socket) => {
    socket.emit("state-snapshot", { status: "CONNECTED" });
  });
}
