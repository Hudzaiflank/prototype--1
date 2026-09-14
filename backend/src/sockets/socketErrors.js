export function socketErrorPayload(error) {
  return {
    code: error.code ?? "SOCKET_ERROR",
    message: error.message ?? "Socket action failed",
  };
}
