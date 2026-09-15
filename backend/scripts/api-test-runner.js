import { randomUUID } from "node:crypto";
import { pool } from "../src/config/database.js";
import { env } from "../src/config/env.js";

const args = new Set(process.argv.slice(2));
if (args.has("--help")) {
  console.log("Usage: npm run test:api [-- --cleanup]");
  console.log(
    "Default: keep generated test data. --cleanup removes only this run's fixtures.",
  );
  process.exit(0);
}

const baseUrl = process.env.API_TEST_URL ?? `http://localhost:${env.port}`;
const apiPrefix = env.apiPrefix;
const cleanupRequested = args.has("--cleanup");
const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const state = {
  schoolId: null,
  adminId: null,
  teacherId: null,
  classId: null,
  roomId: null,
  teacherSessionId: null,
  sessionId: null,
  topicId: null,
  participantIds: [],
  groupIds: [],
};
const tokens = {};
const credentials = {};
const results = [];
const useColor = !process.env.NO_COLOR;
const colors = {
  green: useColor ? "\u001b[32m" : "",
  red: useColor ? "\u001b[31m" : "",
  yellow: useColor ? "\u001b[33m" : "",
  dim: useColor ? "\u001b[2m" : "",
  reset: useColor ? "\u001b[0m" : "",
};

const safeDetail = (value) => {
  if (value === undefined) return "";
  const serialized = JSON.stringify(value, (key, nestedValue) =>
    /token|password/i.test(key) ? "[REDACTED]" : nestedValue,
  );
  return serialized.length > 280
    ? `${serialized.slice(0, 277)}...`
    : serialized;
};

const pass = (name, method, path, response, json) => {
  results.push({ name, ok: true });
  console.log(`${colors.green}PASS${colors.reset}  ${name}`);
  console.log(
    `${colors.dim}      ${method} ${path} -> HTTP ${response.status} | ${safeDetail(json)}${colors.reset}`,
  );
};
const fail = (name, method, path, error) => {
  results.push({ name, ok: false });
  console.error(`${colors.red}FAIL${colors.reset}  ${name}`);
  console.error(
    `${colors.dim}      ${method} ${path} -> ${error.message}${colors.reset}`,
  );
};
const requireValue = (value, label) => {
  if (value === undefined || value === null || value === "")
    throw new Error(`${label} was not returned`);
  return value;
};

async function request(
  name,
  method,
  path,
  { token, body, headers = {}, expected = [200], form } = {},
) {
  try {
    const requestHeaders = { ...headers };
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
    let requestBody;
    if (form) {
      requestBody = form;
    } else if (body !== undefined) {
      requestHeaders["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    if (!expected.includes(response.status)) {
      const error = new Error(
        `expected HTTP ${expected.join("/")}, got ${response.status}: ${json?.message ?? text}`,
      );
      error.status = response.status;
      throw error;
    }
    return { response, json };
  } catch (error) {
    throw new Error(`${method} ${path} - ${error.message}`);
  }
}

async function test(name, method, path, options, validate = () => {}) {
  try {
    const result = await request(name, method, path, options);
    validate(result.json, result.response);
    pass(name, method, path, result.response, result.json);
    return result.json;
  } catch (error) {
    fail(name, method, path, error);
    return null;
  }
}

function data(json) {
  return requireValue(json?.data, "data");
}
function authData(json, role) {
  const value = data(json);
  const actualRole = value.user?.role ?? value.role;
  if (actualRole !== role)
    throw new Error(`expected role ${role}, got ${actualRole}`);
  return value;
}

async function run() {
  const adminEmail = env.seed.superAdminEmail;
  const adminPassword = env.seed.superAdminPassword;

  await test("Health", "GET", "/health", {}, (json) => {
    if (json.success !== true) throw new Error("health success was false");
  });

  const superLogin = await test(
    "Super Admin login",
    "POST",
    `${apiPrefix}/auth/login`,
    { body: { email: adminEmail, password: adminPassword } },
    (json) => authData(json, "SUPER_ADMIN"),
  );
  if (!superLogin) return;
  tokens.superAdmin = data(superLogin).accessToken;

  await test(
    "Super Admin current user",
    "GET",
    `${apiPrefix}/auth/me`,
    { token: tokens.superAdmin },
    (json) => authData(json, "SUPER_ADMIN"),
  );
  await test(
    "Super Admin dashboard",
    "GET",
    `${apiPrefix}/super-admin/dashboard`,
    { token: tokens.superAdmin },
  );
  await test(
    "Super Admin list schools",
    "GET",
    `${apiPrefix}/schools?page=1&limit=100`,
    { token: tokens.superAdmin },
    (json) => {
      if (!Array.isArray(data(json).rows))
        throw new Error("school rows missing");
    },
  );

  const school = await test(
    "Super Admin create school",
    "POST",
    `${apiPrefix}/schools`,
    {
      token: tokens.superAdmin,
      body: {
        name: `API Test School ${suffix}`,
        domain: `apitest${suffix}.school.local`,
      },
      expected: [201],
    },
    (json) => {
      state.schoolId = requireValue(data(json).school?.id, "schoolId");
      credentials.adminEmail = requireValue(
        data(json).admin?.email,
        "admin email",
      );
      credentials.adminPassword = requireValue(
        data(json).admin?.password,
        "admin password",
      );
    },
  );
  if (!school) return;
  await test(
    "Super Admin get school",
    "GET",
    `${apiPrefix}/schools/${state.schoolId}`,
    { token: tokens.superAdmin },
  );
  await test(
    "Super Admin set school inactive",
    "PATCH",
    `${apiPrefix}/schools/${state.schoolId}/status`,
    { token: tokens.superAdmin, body: { status: "INACTIVE" } },
  );
  await test(
    "Super Admin set school active",
    "PATCH",
    `${apiPrefix}/schools/${state.schoolId}/status`,
    { token: tokens.superAdmin, body: { status: "ACTIVE" } },
  );
  await test(
    "Super Admin reset school admin password",
    "POST",
    `${apiPrefix}/schools/${state.schoolId}/admin/reset-password`,
    { token: tokens.superAdmin },
    (json) => {
      credentials.adminPassword = requireValue(
        data(json).password,
        "reset admin password",
      );
    },
  );

  const adminLogin = await test(
    "Admin login",
    "POST",
    `${apiPrefix}/auth/login`,
    {
      body: {
        email: credentials.adminEmail,
        password: credentials.adminPassword,
      },
    },
    (json) => authData(json, "ADMIN"),
  );
  if (!adminLogin) return;
  tokens.admin = data(adminLogin).accessToken;
  state.adminId = data(adminLogin).user.id;
  await test(
    "Admin current user",
    "GET",
    `${apiPrefix}/auth/me`,
    { token: tokens.admin },
    (json) => authData(json, "ADMIN"),
  );
  await test("Admin dashboard", "GET", `${apiPrefix}/admin/dashboard`, {
    token: tokens.admin,
  });
  await test("Admin list classes", "GET", `${apiPrefix}/classes`, {
    token: tokens.admin,
  });
  await test(
    "Admin list teachers",
    "GET",
    `${apiPrefix}/teachers?page=1&limit=100`,
    { token: tokens.admin },
  );
  await test("Admin list topics", "GET", `${apiPrefix}/topics`, {
    token: tokens.admin,
  });

  const createdClass = await test(
    "Admin create class",
    "POST",
    `${apiPrefix}/classes`,
    {
      token: tokens.admin,
      body: {
        gradeLevel: "XI",
        major: "MIPA",
        classNumber: Number(String(Date.now()).slice(-5)),
      },
      expected: [201],
    },
    (json) => {
      state.classId = requireValue(data(json).id, "classId");
    },
  );
  if (!createdClass) return;
  await test("Admin list classes after create", "GET", `${apiPrefix}/classes`, {
    token: tokens.admin,
  });
  await test(
    "Admin get class",
    "GET",
    `${apiPrefix}/classes/${state.classId}`,
    { token: tokens.admin },
  );
  await test(
    "Admin update class",
    "PATCH",
    `${apiPrefix}/classes/${state.classId}`,
    {
      token: tokens.admin,
      body: {
        gradeLevel: "XI",
        major: "MIPA",
        classNumber: Number(String(Date.now()).slice(-5)),
        status: "ACTIVE",
      },
    },
  );

  const createdTeacher = await test(
    "Admin create teacher",
    "POST",
    `${apiPrefix}/teachers`,
    {
      token: tokens.admin,
      body: { fullName: `API Test Teacher ${suffix}` },
      expected: [201],
    },
    (json) => {
      state.teacherId = requireValue(data(json).teacher?.id, "teacherId");
      credentials.teacherEmail = requireValue(
        data(json).credential?.email,
        "teacher email",
      );
      credentials.teacherPassword = requireValue(
        data(json).credential?.password,
        "teacher password",
      );
    },
  );
  if (!createdTeacher) return;
  await test(
    "Admin get teacher",
    "GET",
    `${apiPrefix}/teachers/${state.teacherId}`,
    { token: tokens.admin },
  );
  await test(
    "Admin assign teacher",
    "POST",
    `${apiPrefix}/classes/${state.classId}/teachers`,
    {
      token: tokens.admin,
      body: { teacherId: state.teacherId },
      expected: [201],
    },
  );
  await test(
    "Admin reset teacher password",
    "POST",
    `${apiPrefix}/teachers/${state.teacherId}/reset-password`,
    { token: tokens.admin },
    (json) => {
      credentials.teacherPassword = requireValue(
        data(json).password,
        "teacher reset password",
      );
    },
  );

  const teacherLogin = await test(
    "Teacher login",
    "POST",
    `${apiPrefix}/auth/login`,
    {
      body: {
        email: credentials.teacherEmail,
        password: credentials.teacherPassword,
      },
    },
    (json) => authData(json, "TEACHER"),
  );
  if (!teacherLogin) return;
  tokens.teacher = data(teacherLogin).accessToken;
  await test(
    "Teacher current user",
    "GET",
    `${apiPrefix}/auth/me`,
    { token: tokens.teacher },
    (json) => authData(json, "TEACHER"),
  );
  await test("Teacher dashboard", "GET", `${apiPrefix}/teacher/dashboard`, {
    token: tokens.teacher,
  });
  await test(
    "Teacher list assigned classes",
    "GET",
    `${apiPrefix}/teacher/classes`,
    { token: tokens.teacher },
  );
  await test(
    "Teacher get assigned class",
    "GET",
    `${apiPrefix}/teacher/classes/${state.classId}`,
    { token: tokens.teacher },
  );
  await test("Teacher list topics", "GET", `${apiPrefix}/topics`, {
    token: tokens.teacher,
  });

  const topic = await test(
    "Teacher create topic",
    "POST",
    `${apiPrefix}/topics`,
    {
      token: tokens.teacher,
      body: {
        title: `API Test Topic ${suffix}`,
        description: "Automated API test topic",
        visibility: "SCHOOL",
      },
      expected: [201],
    },
    (json) => {
      state.topicId = requireValue(data(json).id, "topicId");
    },
  );
  if (topic) {
    await test(
      "Teacher update topic",
      "PATCH",
      `${apiPrefix}/topics/${state.topicId}`,
      {
        token: tokens.teacher,
        body: {
          title: `API Updated Topic ${suffix}`,
          description: "Updated",
          visibility: "SCHOOL",
        },
      },
    );
    await test(
      "Teacher delete topic",
      "DELETE",
      `${apiPrefix}/topics/${state.topicId}`,
      { token: tokens.teacher },
    );
    state.topicId = null;
  }

  const room = await test(
    "Teacher open room",
    "POST",
    `${apiPrefix}/classes/${state.classId}/rooms`,
    { token: tokens.teacher, expected: [201] },
    (json) => {
      state.roomId = requireValue(data(json).id, "roomId");
    },
  );
  if (!room) return;
  await test(
    "Teacher room status",
    "GET",
    `${apiPrefix}/rooms/${state.roomId}`,
    { token: tokens.teacher },
  );

  const teacherSession = await test(
    "Teacher create teacher-input session",
    "POST",
    `${apiPrefix}/rooms/${state.roomId}/game-sessions`,
    {
      token: tokens.teacher,
      body: {
        inputMode: "TEACHER",
        gameMode: "ALL_STUDENTS",
        problemDisplayLimit: 1,
        groupCount: null,
      },
      expected: [201],
    },
    (json) => {
      state.teacherSessionId = requireValue(data(json).id, "teacherSessionId");
    },
  );
  if (!teacherSession) return;
  await test(
    "Teacher register teacher-input participant",
    "POST",
    `${apiPrefix}/game-sessions/${state.teacherSessionId}/participants`,
    {
      token: tokens.teacher,
      body: { fullName: "Teacher Participant", content: "Teacher problem" },
      expected: [201],
    },
  );

  const session = await test(
    "Teacher create game session",
    "POST",
    `${apiPrefix}/rooms/${state.roomId}/game-sessions`,
    {
      token: tokens.teacher,
      body: {
        inputMode: "STUDENT",
        gameMode: "GROUPS",
        problemDisplayLimit: 1,
        groupCount: 2,
      },
      expected: [201],
    },
    (json) => {
      state.sessionId = requireValue(data(json).id, "sessionId");
    },
  );
  if (!session) return;
  await test(
    "Teacher get game session",
    "GET",
    `${apiPrefix}/game-sessions/${state.sessionId}`,
    { token: tokens.teacher },
  );
  await test(
    "Teacher update game configuration",
    "PATCH",
    `${apiPrefix}/game-sessions/${state.sessionId}`,
    {
      token: tokens.teacher,
      body: {
        inputMode: "STUDENT",
        gameMode: "GROUPS",
        problemDisplayLimit: 1,
        groupCount: 2,
      },
    },
  );
  await test(
    "Teacher session history unavailable before finish",
    "GET",
    `${apiPrefix}/teacher/game-sessions/${state.sessionId}/history`,
    { token: tokens.teacher, expected: [404] },
  );
  await test(
    "Teacher list history",
    "GET",
    `${apiPrefix}/teacher/history?page=1&limit=20`,
    { token: tokens.teacher },
  );

  const participantA = randomUUID();
  const participantB = randomUUID();
  for (const [id, name] of [
    [participantA, "API Student A"],
    [participantB, "API Student B"],
  ]) {
    const participant = await test(
      `Public register participant ${name}`,
      "POST",
      `${apiPrefix}/public/game-sessions/${state.sessionId}/participants`,
      { body: { sessionId: id, fullName: name }, expected: [201] },
      (json) =>
        state.participantIds.push(
          requireValue(data(json).id, "participant row id"),
        ),
    );
    if (!participant) return;
  }
  await test("Public join room", "POST", `${apiPrefix}/public/rooms/join`, {
    body: { roomCode: data(room).code },
  });
  await test(
    "Public submit problem A",
    "POST",
    `${apiPrefix}/public/game-sessions/${state.sessionId}/problems`,
    {
      body: {
        participantSessionId: participantA,
        content: "API test problem A",
      },
      expected: [201],
    },
  );
  await test(
    "Public submit problem B",
    "POST",
    `${apiPrefix}/public/game-sessions/${state.sessionId}/problems`,
    {
      body: {
        participantSessionId: participantB,
        content: "API test problem B",
      },
      expected: [201],
    },
    (json) => {
      if (data(json).allSubmitted !== true)
        throw new Error("allSubmitted was not true");
    },
  );
  await test(
    "Teacher submit problem duplicate validation",
    "POST",
    `${apiPrefix}/game-sessions/${state.sessionId}/problems`,
    {
      token: tokens.teacher,
      body: {
        participantId: state.participantIds[0],
        content: "Teacher problem update",
      },
      expected: [409],
    },
  );

  const start = await test(
    "Teacher start game",
    "POST",
    `${apiPrefix}/game-sessions/${state.sessionId}/start`,
    { token: tokens.teacher },
  );
  if (start) {
    await test(
      "Teacher list groups",
      "GET",
      `${apiPrefix}/game-sessions/${state.sessionId}/groups`,
      { token: tokens.teacher },
      (json) => {
        const groups = data(json);
        if (Array.isArray(groups))
          state.groupIds = groups.map((group) => group.id);
        else if (Array.isArray(groups.groups))
          state.groupIds = groups.groups.map((group) => group.id);
      },
    );
    if (state.groupIds[0]) {
      const currentTurn = await test(
        "Teacher get current turn",
        "GET",
        `${apiPrefix}/game-sessions/${state.sessionId}/groups/${state.groupIds[0]}/current-turn`,
        { token: tokens.teacher },
      );
      const turnId = currentTurn ? data(currentTurn)?.id : null;
      if (turnId) {
        await test(
          "Teacher reveal cards",
          "POST",
          `${apiPrefix}/game-sessions/${state.sessionId}/groups/${state.groupIds[0]}/turn/${turnId}/reveal`,
          { token: tokens.teacher },
        );
        await test(
          "Teacher complete turn",
          "POST",
          `${apiPrefix}/game-sessions/${state.sessionId}/groups/${state.groupIds[0]}/turn/${turnId}/complete`,
          { token: tokens.teacher },
        );
      }
    }
    await test(
      "Student get own group",
      "GET",
      `${apiPrefix}/public/game-sessions/${state.sessionId}/group`,
      { headers: { "x-participant-session-id": participantA } },
    );
    await test(
      "Student get own state",
      "GET",
      `${apiPrefix}/public/game-sessions/${state.sessionId}/state`,
      { headers: { "x-participant-session-id": participantA } },
    );
    await test(
      "Student reconnect",
      "POST",
      `${apiPrefix}/public/game-sessions/${state.sessionId}/participants`,
      {
        body: { sessionId: participantA, fullName: "API Student A" },
        expected: [200, 201],
      },
    );
    await test(
      "Teacher pause game",
      "POST",
      `${apiPrefix}/game-sessions/${state.sessionId}/pause`,
      { token: tokens.teacher },
    );
    await test(
      "Teacher resume game",
      "POST",
      `${apiPrefix}/game-sessions/${state.sessionId}/resume`,
      { token: tokens.teacher },
    );
    await test(
      "Teacher finish game",
      "POST",
      `${apiPrefix}/game-sessions/${state.sessionId}/finish`,
      { token: tokens.teacher },
    );
    await test(
      "Teacher session history after finish",
      "GET",
      `${apiPrefix}/teacher/game-sessions/${state.sessionId}/history`,
      { token: tokens.teacher },
    );
  }

  await test(
    "Invalid credentials returns 401",
    "POST",
    `${apiPrefix}/auth/login`,
    {
      body: {
        email: credentials.adminEmail ?? env.seed.superAdminEmail,
        password: "wrong-password",
      },
      expected: [401],
    },
  );
  await test(
    "Protected endpoint without token returns 401",
    "GET",
    `${apiPrefix}/classes`,
    { expected: [401] },
  );
  await test(
    "Admin endpoint with teacher token returns 403",
    "GET",
    `${apiPrefix}/schools`,
    { token: tokens.teacher, expected: [403] },
  );
  await test(
    "Invalid room code returns 404",
    "POST",
    `${apiPrefix}/public/rooms/join`,
    { body: { roomCode: "ZZZZZZ" }, expected: [404] },
  );
  await test(
    "Invalid participant problem returns 409",
    "POST",
    `${apiPrefix}/public/game-sessions/${state.sessionId}/problems`,
    {
      body: { participantSessionId: randomUUID(), content: "Should fail" },
      expected: [409],
    },
  );
}

async function cleanup() {
  if (!cleanupRequested || !state.schoolId) return;
  console.log("Cleanup: removing generated fixtures...");
  const queries = [
    [
      "DELETE FROM game_turns WHERE game_session_id IN (SELECT id FROM game_sessions WHERE room_id IN (SELECT id FROM rooms WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)))",
      [state.schoolId],
    ],
    [
      "DELETE FROM assignments WHERE game_session_id IN (SELECT id FROM game_sessions WHERE room_id IN (SELECT id FROM rooms WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)))",
      [state.schoolId],
    ],
    [
      "DELETE FROM group_members WHERE group_id IN (SELECT id FROM `groups` WHERE game_session_id IN (SELECT id FROM game_sessions WHERE room_id IN (SELECT id FROM rooms WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?))))",
      [state.schoolId],
    ],
    [
      "DELETE FROM `groups` WHERE game_session_id IN (SELECT id FROM game_sessions WHERE room_id IN (SELECT id FROM rooms WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)))",
      [state.schoolId],
    ],
    [
      "DELETE FROM problems WHERE game_session_id IN (SELECT id FROM game_sessions WHERE room_id IN (SELECT id FROM rooms WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)))",
      [state.schoolId],
    ],
    [
      "DELETE FROM participants WHERE game_session_id IN (SELECT id FROM game_sessions WHERE room_id IN (SELECT id FROM rooms WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)))",
      [state.schoolId],
    ],
    [
      "DELETE FROM game_sessions WHERE room_id IN (SELECT id FROM rooms WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?))",
      [state.schoolId],
    ],
    [
      "DELETE FROM rooms WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)",
      [state.schoolId],
    ],
    [
      "DELETE FROM teacher_classes WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)",
      [state.schoolId],
    ],
    ["DELETE FROM topics WHERE school_id = ?", [state.schoolId]],
    [
      "DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE school_id = ?)",
      [state.schoolId],
    ],
    ["DELETE FROM audit_logs WHERE school_id = ?", [state.schoolId]],
    ["DELETE FROM users WHERE school_id = ?", [state.schoolId]],
    ["DELETE FROM classes WHERE school_id = ?", [state.schoolId]],
    ["DELETE FROM schools WHERE id = ?", [state.schoolId]],
  ];
  for (const [query, values] of queries) await pool.execute(query, values);
  console.log(`Cleanup complete: school ${state.schoolId}`);
}

try {
  await run();
} finally {
  await cleanup();
  await pool.end();
}

const passed = results.filter((result) => result.ok).length;
const failed = results.length - passed;
const summaryColor = failed > 0 ? colors.red : colors.green;
console.log(
  `\n${summaryColor}API TEST SUMMARY: ${passed} passed, ${failed} failed${colors.reset}`,
);
if (tokens.teacher && state.sessionId && !cleanupRequested) {
  console.log(`\n${colors.yellow}SOCKET HANDOFF${colors.reset}`);
  console.log(
    `${colors.dim}$env:PHILLYOGO_ACCESS_TOKEN = "${tokens.teacher}"${colors.reset}`,
  );
  console.log(
    `${colors.dim}$env:GAME_SESSION_ID = "${state.sessionId}"${colors.reset}`,
  );
  console.log(`${colors.dim}npm run test:api:socket${colors.reset}`);
}
if (failed > 0) process.exitCode = 1;
