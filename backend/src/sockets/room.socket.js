export function registerRoomSocket(namespace) {
  namespace.on("connection", (socket) => {
    socket.emit("room-state", { status: "CONNECTED" });
  });
}
