import test from "node:test";
import assert from "node:assert/strict";
import { toPublicGameEvent } from "../src/utils/gameEvent.js";
import { rateLimit } from "../src/middleware/rateLimit.middleware.js";

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
