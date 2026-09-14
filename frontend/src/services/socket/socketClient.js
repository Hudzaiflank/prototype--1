import { io } from "socket.io-client";

let socket;
export const socketClient = {
  connect: (auth) => {
    socket ??= io(
      import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000/game",
      { autoConnect: false },
    );
    socket.auth = auth;
    socket.connect();
    return socket;
  },
  disconnect: () => socket?.disconnect(),
  getSocket: () => socket,
  isConnected: () => Boolean(socket?.connected),
};
