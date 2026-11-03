import { createSocket } from "./socketFactory";

let socket;
let socketAuth;
export const socketClient = {
  connect: (auth) => {
    const nextAuth = JSON.stringify(auth);
    if (socket && socketAuth !== nextAuth) socket.disconnect();
    if (!socket || socketAuth !== nextAuth) {
      socket = createSocket("game", auth, false);
      socketAuth = nextAuth;
    }
    if (socket.auth !== undefined) socket.auth = auth;
    socket.connect();
    return socket;
  },
  disconnect: () => {
    socket?.disconnect();
    socket = null;
    socketAuth = null;
  },
  getSocket: () => socket,
  isConnected: () => Boolean(socket?.connected),
};
