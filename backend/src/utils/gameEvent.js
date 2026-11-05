import crypto from "node:crypto";

export function toPublicGameEvent(state) {
  const occurredAt = new Date().toISOString();
  return {
    eventId: crypto.randomUUID(),
    occurredAt,
    serverTimestamp: Date.now(),
    id: state.id,
    status: state.status,
    stateVersion: state.stateVersion ?? null,
    gameMode: state.gameMode,
    groupCount: state.groupCount,
    participantCount: state.participants?.length ?? 0,
  };
}
