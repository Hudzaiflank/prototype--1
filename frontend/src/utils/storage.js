const PARTICIPANT_SESSION_KEY = "phillyogo.participantSessionId";
export const getParticipantSession = () =>
  sessionStorage.getItem(PARTICIPANT_SESSION_KEY);
export const setParticipantSession = (value) =>
  sessionStorage.setItem(PARTICIPANT_SESSION_KEY, value);
export const clearParticipantSession = () =>
  sessionStorage.removeItem(PARTICIPANT_SESSION_KEY);
