export function hasActiveParticipantSessionConflict(
  existingParticipant,
  requestedSessionId,
) {
  return Boolean(
    existingParticipant &&
      existingParticipant.status === "CONNECTED" &&
      existingParticipant.sessionId !== requestedSessionId,
  );
}
