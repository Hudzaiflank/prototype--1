import crypto from "node:crypto";

export function toPublicGameEvent(state) {
  return {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    id: state.id,
    status: state.status,
    stateVersion: state.stateVersion ?? null,
    gameMode: state.gameMode,
    groupCount: state.groupCount,
    participantCount: state.participants?.length ?? 0,
  };
}
