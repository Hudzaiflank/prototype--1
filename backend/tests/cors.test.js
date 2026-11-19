import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

test("allows piscall.com CORS preflight requests", async () => {
  const response = await request(createApp())
    .options("/api/v1/auth/login")
    .set("Origin", "https://piscall.com")
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "content-type");

  assert.equal(response.status, 204);
  assert.equal(
    response.headers["access-control-allow-origin"],
    "https://piscall.com",
  );
});

test("rejects an origin that is not allowed", async () => {
  const response = await request(createApp())
    .get("/health")
    .set("Origin", "https://invalid.example");

  assert.equal(
    response.headers["access-control-allow-origin"],
    undefined,
  );
});
