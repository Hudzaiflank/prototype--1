import test from "node:test";
import assert from "node:assert/strict";
import { hasActiveParticipantSessionConflict } from "../src/utils/participantSessionPolicy.js";

test("allows the same participant session to reconnect", () => {
  assert.equal(
    hasActiveParticipantSessionConflict(
      { sessionId: "session-a", status: "CONNECTED" },
      "session-a",
    ),
    false,
  );
});

test("rejects a different session while the participant is connected", () => {
  assert.equal(
    hasActiveParticipantSessionConflict(
      { sessionId: "session-a", status: "CONNECTED" },
      "session-b",
    ),
    true,
  );
});

test("allows a different session after the participant disconnects", () => {
  assert.equal(
    hasActiveParticipantSessionConflict(
      { sessionId: "session-a", status: "DISCONNECTED" },
      "session-b",
    ),
    false,
  );
});
