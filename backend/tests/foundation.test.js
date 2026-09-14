import test from "node:test";
import assert from "node:assert/strict";
import { generateRoomCode } from "../src/utils/roomCode.js";
import { loginSchema } from "../src/validators/auth.validator.js";
import { createClassSchema } from "../src/validators/class.validator.js";

test("room codes use the six-character PRD format", () => {
  const code = generateRoomCode();
  assert.match(code, /^[A-Z0-9]{6}$/);
});

test("login validator accepts the API request shape", () => {
  const result = loginSchema.safeParse({
    body: { email: "user@example.com", password: "password" },
  });
  assert.equal(result.success, true);
});

test("class validator coerces class number to an integer", () => {
  const result = createClassSchema.safeParse({
    body: { gradeLevel: "X", major: "IPA", classNumber: "1" },
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.classNumber, 1);
});
