import { verifyAccessToken } from "../utils/token.js";
import { ROLES } from "../constants/roles.js";

export function registerMonitorSocket(namespace) {
  namespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const user = token ? verifyAccessToken(token) : null;
      if (user?.role !== ROLES.SUPER_ADMIN)
        return next(new Error("Super admin authorization required"));
      socket.data.identity = { kind: ROLES.SUPER_ADMIN, user };
      next();
    } catch {
      next(new Error("Socket authentication failed"));
    }
  });
}