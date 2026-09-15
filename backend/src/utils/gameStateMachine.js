const GAME_TRANSITIONS = {
  WAITING: {
    start: "PLAYING",
  },
  PLAYING: {
    pause: "PAUSED",
    finish: "FINISHED",
  },
  PAUSED: {
    resume: "PLAYING",
    finish: "FINISHED",
  },
  FINISHED: {},
};

export function validateGameTransition(currentStatus, action) {
  const transition = GAME_TRANSITIONS[currentStatus]?.[action];
  if (!transition) {
    return { ok: false, nextStatus: null, reason: "INVALID_GAME_TRANSITION" };
  }

  return { ok: true, nextStatus: transition };
}
