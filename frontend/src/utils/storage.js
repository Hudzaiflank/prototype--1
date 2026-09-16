const PARTICIPANT_SESSION_KEY = "phillyogo.participantSessionId";
const STUDENT_ROOM_KEY = "phillyogo.studentRoom";
const STUDENT_NAME_KEY = "phillyogo.studentName";
const ACCESS_TOKEN_KEY = "phillyogo.accessToken";
const USER_KEY = "phillyogo.user";

export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (value) =>
  sessionStorage.setItem(ACCESS_TOKEN_KEY, value);
export const clearAccessToken = () =>
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
export const getStoredUser = () => {
  const value = sessionStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
export const setStoredUser = (value) =>
  sessionStorage.setItem(USER_KEY, JSON.stringify(value));
export const clearStoredUser = () => sessionStorage.removeItem(USER_KEY);

export const clearAuthStorage = () => {
  clearAccessToken();
  clearStoredUser();
};

const getStudentStorageValue = (key) => {
  const persistentValue = localStorage.getItem(key);
  if (persistentValue !== null) return persistentValue;
  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue !== null) localStorage.setItem(key, sessionValue);
  return sessionValue;
};

export const getParticipantSession = () =>
  getStudentStorageValue(PARTICIPANT_SESSION_KEY);
export const setParticipantSession = (value) =>
  localStorage.setItem(PARTICIPANT_SESSION_KEY, value);
export const clearParticipantSession = () => {
  localStorage.removeItem(PARTICIPANT_SESSION_KEY);
  sessionStorage.removeItem(PARTICIPANT_SESSION_KEY);
};
export const getStudentRoom = () => {
  const value = getStudentStorageValue(STUDENT_ROOM_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
export const setStudentRoom = (value) =>
  localStorage.setItem(STUDENT_ROOM_KEY, JSON.stringify(value));
export const getStudentName = () => getStudentStorageValue(STUDENT_NAME_KEY);
export const setStudentName = (value) =>
  localStorage.setItem(STUDENT_NAME_KEY, value);
export const clearStudentSession = () => {
  clearParticipantSession();
  localStorage.removeItem(STUDENT_ROOM_KEY);
  localStorage.removeItem(STUDENT_NAME_KEY);
  sessionStorage.removeItem(STUDENT_ROOM_KEY);
  sessionStorage.removeItem(STUDENT_NAME_KEY);
};
