import { io } from "socket.io-client";

const args = new Set(process.argv.slice(2));
if (args.has("--help")) {
  console.log("Usage: npm run test:api:socket");
  console.log("Required: PHILLYOGO_ACCESS_TOKEN and GAME_SESSION_ID");
  console.log("Optional: SOCKET_URL (default http://localhost:3000/game)");
  process.exit(0);
}

const token = process.env.PHILLYOGO_ACCESS_TOKEN;
const gameSessionId = process.env.GAME_SESSION_ID;
const socketUrl = process.env.SOCKET_URL ?? "http://localhost:3000/game";
const useColor = !process.env.NO_COLOR;
const green = useColor ? "\u001b[32m" : "";
const red = useColor ? "\u001b[31m" : "";
const dim = useColor ? "\u001b[2m" : "";
const reset = useColor ? "\u001b[0m" : "";

if (!token || !gameSessionId) {
  console.error(`${red}FAIL${reset}  Socket prerequisites`);
  console.error(
    `${dim}      PHILLYOGO_ACCESS_TOKEN and GAME_SESSION_ID are required${reset}`,
  );
  process.exit(1);
}

const socket = io(socketUrl, { auth: { token }, reconnection: false });
let settled = false;
const finish = (code, message) => {
  if (settled) return;
  settled = true;
  socket.close();
  console.log(`${code === 0 ? green : red}${message}${reset}`);
  process.exitCode = code;
};

const timer = setTimeout(
  () => finish(1, "FAIL  Socket state-snapshot: timeout after 5 seconds"),
  5000,
);

socket.once("connect", () => {
  console.log(`${green}PASS${reset}  Socket connect`);
  console.log(
    `${dim}      SOCKET ${socketUrl} -> connected, session=${gameSessionId}${reset}`,
  );
  socket.emit("join-game", { gameSessionId: Number(gameSessionId) });
});

socket.once("connect_error", (error) => {
  clearTimeout(timer);
  finish(1, `FAIL  Socket authentication/connect: ${error.message}`);
});

socket.once("server-error", (error) => {
  clearTimeout(timer);
  finish(
    1,
    `FAIL  Socket server-error: ${error.code ?? "UNKNOWN"} ${error.message ?? ""}`,
  );
});

socket.once("state-snapshot", (snapshot) => {
  clearTimeout(timer);
  try {
    if (!snapshot || snapshot.status === undefined)
      throw new Error("snapshot status missing");
    if (snapshot.stateVersion === undefined)
      throw new Error("snapshot stateVersion missing");
    if (!Array.isArray(snapshot.participants))
      throw new Error("snapshot participants missing");
    finish(
      0,
      `PASS  Socket state-snapshot: status=${snapshot.status}, stateVersion=${snapshot.stateVersion}`,
    );
  } catch (error) {
    finish(1, `FAIL  Socket state-snapshot: ${error.message}`);
  }
});
