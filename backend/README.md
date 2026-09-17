# PhillyoGo Backend

Backend Node.js + Express untuk PhillyoGo dengan MySQL, JWT refresh token, dan Socket.IO.

## 1. Overview

PhillyoGo adalah platform digital board game mental health untuk sekolah dengan flow utama:

- Super Admin mengelola sekolah
- Admin sekolah mengelola kelas dan guru
- Guru membuka room dan menjalankan game
- Murid join room, submit masalah, dan mengikuti game
- Game menghasilkan matching antar peserta dan masalah

Scope dokumen ini adalah backend saja, sesuai kesepakatan saat ini. Frontend dan UI masih out of scope.

---

## 2. Current status

Status implementasi backend saat ini:

- Core auth: implemented
- Role-based access: implemented
- School/admin/teacher/class flow: implemented
- Room/session/game progression: implemented
- Matching algorithm: implemented
- API validation and security hardening: implemented
- Realtime socket flow: partially implemented and needs runtime verification
- Full PRD final compliance: pending final runtime validation

Status verifikasi yang sudah ada:

- `npm test` -> 9 passed, 0 failed, 1 skipped
- runtime HTTP health check -> success
- runtime DB-backed socket validation still requires a live MySQL environment

---

## 3. Stack

- Node.js
- Express.js
- MySQL 8.x
- JWT access + refresh token
- Socket.IO
- Zod validation
- bcryptjs
- xlsx for teacher import

---

## 4. Architecture

Folder utama:

- `src/controllers`: HTTP request/response layer
- `src/services`: business logic and orchestrations
- `src/repositories`: SQL query and row-lock logic
- `src/routes`: route registration and role enforcement
- `src/middleware`: auth, role, validation, rate limit, request logging, error handling
- `src/sockets`: socket authentication and game event handlers
- `src/utils`: token, password, random, game state machine, public event sanitization
- `database/migrations`: schema definition
- `tests`: unit and hardening tests

---

## 5. Role model

### Super Admin

- login
- list/create school
- view school detail
- update school status
- reset admin password

### Admin Sekolah

- login
- dashboard sekolah
- kelola kelas
- kelola guru
- assign guru ke kelas
- reset password guru
- manage topic

### Guru

- login
- dashboard
- list assigned classes
- open room
- create game session
- monitor game
- pause/resume/finish game
- access history
- reset password sendiri

### Murid

- join room via code
- register participant session
- submit problem
- get own group and state
- reconnect by session UUID

---

## 6. API route overview

Base path:

```text
/api/v1
```

### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/password`

### Schools

- `GET /schools`
- `POST /schools`
- `GET /schools/:schoolId`
- `PATCH /schools/:schoolId/status`
- `POST /schools/:schoolId/admin/reset-password`

### Classes

- `GET /classes`
- `POST /classes`
- `GET /classes/:classId`
- `PATCH /classes/:classId`
- `DELETE /classes/:classId/teachers/:teacherId`
- `POST /classes/:classId/teachers`
- `POST /classes/:classId/rooms`

### Teachers

- `GET /teachers`
- `POST /teachers`
- `POST /teachers/import`
- `GET /teachers/:teacherId`
- `POST /teachers/:teacherId/reset-password`

### Topics

- `GET /topics`
- `POST /topics`
- `PATCH /topics/:topicId`
- `DELETE /topics/:topicId`

### Rooms and sessions

- `POST /rooms/:roomId/close`
- `POST /rooms/:roomId/game-sessions`
- `GET /rooms/:roomId`

### Public student endpoints

- `POST /public/rooms/join`
- `POST /public/game-sessions/:sessionId/participants`
- `POST /public/game-sessions/:sessionId/problems`
- `GET /public/game-sessions/:sessionId/group`
- `GET /public/game-sessions/:sessionId/state`

### Game control

- `GET /game-sessions/:sessionId`
- `PATCH /game-sessions/:sessionId/config`
- `POST /game-sessions/:sessionId/start`
- `POST /game-sessions/:sessionId/pause`
- `POST /game-sessions/:sessionId/resume`
- `POST /game-sessions/:sessionId/finish`
- `POST /game-sessions/:sessionId/teacher-problems`
- `POST /game-sessions/:sessionId/teacher-participants`
- `POST /game-sessions/:sessionId/groups/:groupId/reveal`
- `POST /game-sessions/:sessionId/groups/:groupId/complete`
- `GET /game-sessions/:sessionId/groups`
- `GET /game-sessions/:sessionId/history`

### Dashboard

- `GET /super-admin/dashboard`
- `GET /admin/dashboard`
- `GET /teacher/dashboard`
- `GET /super-admin/request-logs` (SUPER_ADMIN only)

### Student and class management

- `POST /schools` accepts `name` and `level` (`SMP`, `SMA`, or `SMK`)
- `POST /classes` requires multipart Excel field `file`, plus `gradeLevel`, `major`, `classNumber`, and `academicYear`
- `POST /classes/preview-students` previews `Nama Lengkap` and `NISN` validation
- `GET /classes/student-template` downloads the required student template
- `GET /classes/:classId/students` lists active students in a class
- `POST /classes/:classId/students/reset` releases all students from one class
- `POST /classes/reset-level` releases all students from one grade and academic year
- `POST /classes/promote` advances the whole school one grade and copies active teacher assignments
- `GET /students` lists students visible to the current Admin/Super Admin
- `GET /students/:studentId/history` returns the student's problem history across classes and schools

Student Excel format:

```text
Nama Lengkap | NISN
Ahmad Fauzan | 0012345678
```

NISN must contain exactly 10 digits and is globally unique. A student is
identified by NISN, not by a free-text name. Existing game/participant data is
removed by migration `002_student_enrollment_model.sql` as part of the revised
student model.

---

## 7. Database model

Schema utama di `database/migrations/001_initial_schema.sql` mencakup:

- schools
- users
- classes
- teacher_classes
- topics
- rooms
- game_sessions
- participants
- problems
- groups
- group_members
- assignments
- game_turns
- refresh_tokens
- audit_logs

Fitur utama database:

- one school one admin constraint
- role validation per school
- room code uniqueness
- participant UUID session tracking
- assignment and turn tracking for game flow
- refresh token revocation tracking

---

## 8. Socket / realtime

Namespace aktif:

```text
/game
```

Beberapa event utama:

- `state-snapshot`
- `room-state`
- `participant-joined`
- `problem-submitted`
- `all-participants-ready`
- `your-group-assigned`
- `your-session-restored`
- `groups-assigned`
- `game-started`
- `game-paused`
- `game-resumed`
- `turn-started`
- `cards-revealed`
- `turn-completed`
- `game-finished`
- `server-error`

### Monitoring request realtime

Namespace monitoring:

```text
/monitor
```

Namespace ini hanya menerima koneksi dengan access token milik user ber-role
`SUPER_ADMIN`. Event yang dikirim ke client:

- `request-log`

Setiap request HTTP backend dicatat setelah response selesai. Data yang dicatat:

- timestamp
- IP client (`CF-Connecting-IP`, lalu fallback ke forwarded IP atau remote address)
- user-agent
- HTTP method
- path dan query string
- status code
- durasi request dalam milidetik

Request body, password, access token, cookie, dan header sensitif tidak dicatat.
Log hanya disimpan di memory backend dalam ring buffer maksimal 500 entry. Log
akan hilang ketika proses backend restart atau mati; fitur ini memang ditujukan
untuk monitoring realtime, bukan histori permanen.

Endpoint snapshot:

```text
GET /api/v1/super-admin/request-logs
Authorization: Bearer <super-admin-access-token>
```

Frontend menyediakan halaman monitoring di:

```text
https://<frontend-domain>/request-logs
```

Halaman tersebut hanya tersedia untuk `SUPER_ADMIN` dan terhubung ke namespace
`/monitor` melalui URL Socket.IO yang sama dengan namespace `/game`. Jika
`VITE_SOCKET_URL` bernilai `https://<backend-domain>/game`, client monitoring
akan otomatis menggunakan `https://<backend-domain>/monitor`. URL khusus dapat
digunakan melalui `VITE_MONITOR_SOCKET_URL`.

Cloudflare Tunnel harus meneruskan koneksi WebSocket ke backend. Pastikan
hostname tunnel yang dipakai frontend dapat mengakses endpoint API dan Socket.IO
di backend lokal.

Socket auth dikelola di:

- `src/sockets/auth.socket.js`
- `src/sockets/game.socket.js`

---

## 9. Security and hardening

Backend sudah menerapkan:

- JWT access token dan refresh token
- password hashing via bcryptjs
- refresh token revocation
- role-based authorization
- input validation via Zod
- rate limit middleware
- public event sanitization via `toPublicGameEvent`

---

## 10. Test strategy

### Unit and hardening tests

Command:

```bash
npm test
```

Coverage inti:

- room code format PRD validation
- login schema validation
- class number coercion
- perfect matching algorithm
- public event sanitization
- rate limiter test
- state machine transition validation
- socket event contract validation

### Socket integration test

File:

- `tests/socket.integration.test.js`

Kondisi:

- membutuhkan server backend yang sedang aktif
- membutuhkan MySQL aktif
- membutuhkan token teacher valid
- membutuhkan game session ID valid

Command:

```powershell
$env:RUN_SOCKET_TEST="1"
$env:PHILLYOGO_ACCESS_TOKEN="<access-token>"
$env:GAME_SESSION_ID="<session-id-owned-by-teacher>"
npm run test:socket
```

### Manual runtime API testing

Dapat dilakukan dengan HTTP client seperti Postman, curl, atau VS Code REST Client.

### Automated API test runners

The backend provides two explicit runtime commands:

```powershell
npm run test:api
npm run test:api -- --cleanup
```

`test:api` runs the REST API flow across Super Admin, Admin, Teacher, and public Student endpoints. It creates isolated test fixtures with a timestamp suffix, prints green `PASS` or red `FAIL` output with method, endpoint, HTTP status, and sanitized response detail, and exits with code `1` if any check fails. Test data is kept by default. Add `--cleanup` to remove only the fixtures created by that run. Set `NO_COLOR=1` when plain output is required.

When the REST run keeps its fixtures, it also prints a `SOCKET HANDOFF` block containing PowerShell commands for the generated Teacher token and active test session. Run those commands in the same terminal, then run `npm run test:api:socket`.

Socket.IO is tested separately:

```powershell
$env:PHILLYOGO_ACCESS_TOKEN="<teacher-access-token>"
$env:GAME_SESSION_ID="<active-game-session-id>"
npm run test:api:socket
```

Optional socket URL:

```powershell
$env:SOCKET_URL="http://localhost:3000/game"
```

The socket command verifies connection/authentication and an authoritative `state-snapshot`, prints colored status and connection/state details, and exits with code `1` on missing prerequisites, connection failure, server error, timeout, or invalid snapshot shape.

Prerequisites for both commands:

- MySQL is running and migrated.
- Seed data exists, including the Super Admin account.
- Backend server is running at `http://localhost:3000` unless `API_TEST_URL` is set.
- The test database user has permission to create and delete the test fixtures.

The REST runner intentionally keeps generated data unless `--cleanup` is provided. This makes failed runs inspectable, but repeated runs will add test records to the database.

The public test endpoints are rate-limited by client IP. If the command is rerun immediately after a large manual/API run and receives `429 Too many requests`, wait for the configured rate-limit window to expire or restart the local backend process before rerunning. Cleanup still runs in the runner's `finally` block even when an API assertion fails.

---

## 11. Local setup

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

Retention cleanup:

```powershell
npm run db:cleanup
```

---

## 12. Default seed credentials

Nilai default di `.env`:

- Super Admin: `superadmin@gmail.com` / `Bismillah`
- Sample school: `SMA Negeri 4 Bandung`
- Sample school admin: `admin.sma-negeri-4-bandung@phillyogo.id` / `SMA4@2026`

---

## 13. Known gaps before final PRD completion

Backend saat ini sudah cukup kuat untuk handoff FE, tetapi masih ada gap yang perlu dibuktikan secara runtime:

- live MySQL-backed socket integration test
- end-to-end game lifecycle validation
- reconnect/session persistence proof
- final full API compliance sweep
- final full state machine validation against production-like environment

---

## 14. Recommended next step

Untuk finalize PRD compliance, prioritas berikut harus dijalankan:

1. lifecycle integration test room -> session -> participant -> game -> finish
2. socket integration test in live environment
3. full PRD API contract verification
4. validation of ownership and school isolation
5. final DB-backed runtime test suite

---

## 15. Summary

Mode backend saat ini:

- cukup siap untuk FE handoff
- belum final 100% PRD complete
- sudah memiliki fondasi yang kuat untuk pengembangan lanjutan

Semua dokumentasi teknis inti sudah ada di repo ini, dan test suite utama sudah berjalan secara valid untuk unit dan hardening coverage.
