import test from "node:test";
import assert from "node:assert/strict";
import { generateRoomCode } from "../src/utils/roomCode.js";
import { loginSchema } from "../src/validators/auth.validator.js";
import { createClassSchema } from "../src/validators/class.validator.js";
import { createTeacherSchema } from "../src/validators/teacher.validator.js";
import { errorMiddleware } from "../src/middleware/error.middleware.js";

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

test("teacher validator accepts NIP with at least 16 digits", () => {
  const result = createTeacherSchema.safeParse({
    body: {
      fullName: "Guru Test",
      nip: "1234567890123456",
      email: "guru@test.com",
    },
  });

  assert.equal(result.success, true);
});

test("general server errors use a neutral message", () => {
  const response = {
    statusCode: 500,
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  errorMiddleware(new Error("unexpected failure"), null, response, null);

  assert.equal(response.statusCode, 500);
  assert.match(
    response.payload.message,
    /Permintaan belum dapat diproses saat ini/i,
  );
  assert.doesNotMatch(response.payload.message, /Sekolah/i);
});
