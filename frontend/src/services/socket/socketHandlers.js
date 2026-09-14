export function subscribe(socket, event, handler) {
  socket?.on(event, handler);
  return () => socket?.off(event, handler);
}
