import { useEffect, useState } from "react";
import { socketClient } from "../services/socket/socketClient";

export function useSocket(options = {}) {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const socket = socketClient.connect(options);
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socketClient.disconnect();
    };
  }, [options]);
  return { socket: socketClient.getSocket(), connected };
}
