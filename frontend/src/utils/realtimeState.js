export function isNewerRealtimeState(current, incoming) {
  const currentVersion = Number(current?.stateVersion);
  const incomingVersion = Number(incoming?.stateVersion);
  if (!Number.isFinite(currentVersion) || !Number.isFinite(incomingVersion))
    return true;
  return incomingVersion >= currentVersion;
}

export function mergeRealtimeState(current, incoming) {
  if (!current || !incoming) return incoming ?? current;
  if (!isNewerRealtimeState(current, incoming)) return current;

  if (incoming.eventId) return { ...current, ...incoming };
  return incoming;
}
