import test from "node:test";
import assert from "node:assert/strict";
import { io } from "socket.io-client";

const shouldRun = process.env.RUN_SOCKET_TEST === "1";

test(
  "teacher socket receives an authoritative state snapshot",
  { skip: !shouldRun },
  async () => {
    assert.ok(
      process.env.PHILLYOGO_ACCESS_TOKEN,
      "PHILLYOGO_ACCESS_TOKEN is required",
    );
    const socket = io(process.env.SOCKET_URL ?? "http://localhost:3000/game", {
      auth: { token: process.env.PHILLYOGO_ACCESS_TOKEN },
      reconnection: false,
    });
    const snapshot = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Socket state snapshot timeout")),
        5000,
      );
      socket.on("connect", () =>
        socket.emit("join-game", {
          gameSessionId: process.env.GAME_SESSION_ID ?? 1,
        }),
      );
      socket.on("state-snapshot", (state) => {
        clearTimeout(timer);
        resolve(state);
      });
      socket.on("connect_error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      socket.on("server-error", (error) => {
        clearTimeout(timer);
        reject(new Error(`${error.code}: ${error.message}`));
      });
    });
    socket.close();
    assert.equal(snapshot.status, "PLAYING");
  },
);
