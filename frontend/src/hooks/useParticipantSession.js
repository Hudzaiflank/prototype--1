import { getParticipantSession, setParticipantSession } from "../utils/storage";

export function useParticipantSession() {
  return {
    sessionId: getParticipantSession(),
    setSessionId: setParticipantSession,
  };
}
