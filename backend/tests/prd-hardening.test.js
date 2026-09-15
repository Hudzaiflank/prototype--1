import test from "node:test";
import assert from "node:assert/strict";
import { toPublicGameEvent } from "../src/utils/gameEvent.js";
import { rateLimit } from "../src/middleware/rateLimit.middleware.js";
import { validateGameTransition } from "../src/utils/gameStateMachine.js";
import { SOCKET_EVENTS } from "../src/constants/socketEvents.js";

test("public game events do not expose assignments or problem authors", () => {
  const event = toPublicGameEvent({
    id: 10,
    status: "PLAYING",
    stateVersion: 3,
    gameMode: "ALL_STUDENTS",
    groupCount: null,
    participants: [{ id: 1 }],
    assignments: [{ problemAuthorId: 99, content: "private" }],
  });
  assert.equal(event.stateVersion, 3);
  assert.equal("assignments" in event, false);
  assert.equal("problemAuthorId" in event, false);
  assert.match(event.eventId, /^[0-9a-f-]{36}$/);
});

test("rate limiter rejects requests over its configured limit", () => {
  const middleware = rateLimit({ limit: 1, windowMs: 60_000 });
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {},
  };
  let nextCalls = 0;
  const next = () => {
    nextCalls += 1;
  };
  middleware({ ip: "hardening-test" }, response, next);
  middleware({ ip: "hardening-test" }, response, next);
  assert.equal(nextCalls, 1);
  assert.equal(response.statusCode, 429);
});

test("state machine allows valid transitions and blocks invalid ones", () => {
  assert.deepEqual(validateGameTransition("WAITING", "start"), {
    ok: true,
    nextStatus: "PLAYING",
  });
  assert.deepEqual(validateGameTransition("PLAYING", "pause"), {
    ok: true,
    nextStatus: "PAUSED",
  });
  assert.deepEqual(validateGameTransition("PAUSED", "resume"), {
    ok: true,
    nextStatus: "PLAYING",
  });
  assert.deepEqual(validateGameTransition("PLAYING", "finish"), {
    ok: true,
    nextStatus: "FINISHED",
  });
  assert.equal(validateGameTransition("PLAYING", "start").ok, false);
  assert.equal(validateGameTransition("FINISHED", "pause").ok, false);
  assert.equal(validateGameTransition("WAITING", "resume").ok, false);
});

test("socket event contract includes the required realtime events", () => {
  const required = [
    "STATE_SNAPSHOT",
    "ROOM_STATE",
    "PARTICIPANT_JOINED",
    "PROBLEM_SUBMITTED",
    "PARTICIPANT_STATUS_CHANGED",
    "ALL_PARTICIPANTS_READY",
    "YOUR_GROUP_ASSIGNED",
    "YOUR_SESSION_RESTORED",
    "GROUPS_ASSIGNED",
    "GAME_STARTED",
    "GAME_PAUSED",
    "GAME_RESUMED",
    "TURN_STARTED",
    "CARDS_REVEALED",
    "TURN_COMPLETED",
    "GAME_FINISHED",
    "SERVER_ERROR",
  ];
  for (const eventName of required) {
    assert.ok(SOCKET_EVENTS[eventName], `Missing realtime event: ${eventName}`);
  }
  assert.equal(SOCKET_EVENTS.STATE_SNAPSHOT, "state-snapshot");
  assert.equal(SOCKET_EVENTS.GAME_STARTED, "game-started");
});
