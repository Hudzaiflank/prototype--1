import test from "node:test";
import assert from "node:assert/strict";
import { createActiveStudentSocketRegistry } from "../src/sockets/activeStudentSocketRegistry.js";

test("allows only one active socket for a participant", () => {
  const registry = createActiveStudentSocketRegistry();
  const firstSocket = { connected: true };
  const secondSocket = { connected: true };

  assert.equal(registry.claim(20, firstSocket), true);
  assert.equal(registry.claim(20, secondSocket), false);
});

test("releases the participant socket before allowing a reconnect", () => {
  const registry = createActiveStudentSocketRegistry();
  const firstSocket = { connected: true };
  const secondSocket = { connected: true };

  registry.claim(20, firstSocket);
  registry.release(20, firstSocket);

  assert.equal(registry.claim(20, secondSocket), true);
});

test("a stale disconnect cannot release a newer socket", () => {
  const registry = createActiveStudentSocketRegistry();
  const oldSocket = { connected: true };
  const newSocket = { connected: true };
  const thirdSocket = { connected: true };

  registry.claim(20, oldSocket);
  registry.release(20, oldSocket);
  registry.claim(20, newSocket);
  registry.release(20, oldSocket);

  assert.equal(registry.claim(20, thirdSocket), false);
});
