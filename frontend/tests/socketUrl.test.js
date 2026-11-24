import test from "node:test";
import assert from "node:assert/strict";
import { socketNamespaceUrl } from "../src/services/socket/socketUrl.js";

test("adds the game namespace to a backend origin", () => {
  assert.equal(
    socketNamespaceUrl("https://api.piscall.com", "game"),
    "https://api.piscall.com/game",
  );
});

test("keeps an existing namespace and removes trailing slashes", () => {
  assert.equal(
    socketNamespaceUrl("https://api.piscall.com/game/", "game"),
    "https://api.piscall.com/game",
  );
});

test("adds a monitor namespace to a backend origin", () => {
  assert.equal(
    socketNamespaceUrl("https://api.piscall.com/", "monitor"),
    "https://api.piscall.com/monitor",
  );
});
