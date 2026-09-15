# API Test Checklist for QA & Developer

This checklist is meant for manual backend verification in Postman or any HTTP client. It covers the main PRD-driven backend flows and is aligned with the live validation already performed against the local MySQL-backed service.

## 1. Scope

This checklist covers:

- Authentication and authorization
- School and admin flows
- Teacher and class assignment flows
- Room and session creation
- Student join and participant registration
- Problem submission
- Game session state and socket readiness
- Security and validation checks

Frontend is out of scope for this checklist.

## 2. Environment

Base URL:

```text
http://localhost:3000
```

API prefix:

```text
/api/v1
```

Recommended Postman variables:

```text
baseUrl = http://localhost:3000
apiPrefix = /api/v1
adminToken =
teacherToken =
classId =
roomId =
roomCode =
sessionId =
participantSessionId =
```

## 2A. Recommended Ordered Postman Flow

Import this collection for the complete automated handoff flow:

- `PhillyoGo_Backend_Postman_Flow_Collection.json`

The older `PhillyoGo_Backend_Postman_Collection.json` remains available as an endpoint reference. The ordered collection is the recommended QA runner because it saves tokens and IDs automatically.

This ordered flow is a **core end-to-end release smoke flow**, not a replacement for every individual API endpoint test. The coverage matrix below identifies endpoint families that still require separate QA cases.

### Exact execution order

Run the folders in this order using **Collection Runner**:

1. `00 - Super Admin`
2. `01 - Preconditions`
3. `02 - Admin setup`
4. `03 - Teacher and session setup`
5. `04 - Student preparation`
6. `05 - Lifecycle and reconnect`
7. `06 - Negative checks`

Do not run `04 - Lifecycle and reconnect` before both students have registered and both problems have been submitted. The backend correctly rejects `start` when participant and problem counts do not match.

### Where the bearer token goes

The Admin login request saves `data.accessToken` automatically to the collection variable `adminToken`. Every Admin request uses:

```http
Authorization: Bearer {{adminToken}}
```

The Create Teacher request saves the generated teacher email and password. The Teacher login request uses those values and saves its token to `teacherToken`. Every Teacher request uses:

```http
Authorization: Bearer {{teacherToken}}
```

You do not need to copy-paste tokens manually. To inspect them, open the collection variables after running the login requests. Treat tokens as secrets and do not commit exported values.

### IDs saved automatically

| Request result    | Collection variable                            | Used by                           |
| ----------------- | ---------------------------------------------- | --------------------------------- |
| Create class      | `classId`                                      | Assign teacher, open room         |
| Create teacher    | `teacherId`, `teacherEmail`, `teacherPassword` | Assign teacher, teacher login     |
| Admin login       | `adminToken`                                   | Admin requests                    |
| Teacher login     | `teacherToken`                                 | Teacher requests and lifecycle    |
| Open room         | `roomId`, `roomCode`                           | Session creation and student join |
| Create session    | `sessionId`                                    | Student and game requests         |
| Register students | `participantA`, `participantB`                 | Problem submission and reconnect  |

The ordered collection generates a new class number, teacher suffix, and participant UUIDs on each run to reduce duplicate-data failures.

## 2B. Automated command tests

For a command-line result with exit code `0` on all-pass and `1` on any failure:

```powershell
cd E:\Innovation-hub\prototype-1\backend; npm run test:api
```

The REST runner creates a timestamped test school and runs the API flow for Super Admin, Admin, Teacher, and Student/public endpoints. Data is retained by default. To delete only the fixtures created by that run:

```powershell
cd E:\Innovation-hub\prototype-1\backend; npm run test:api -- --cleanup
```

Socket.IO is intentionally a separate command:

```powershell
$env:PHILLYOGO_ACCESS_TOKEN="<teacher-access-token>"; $env:GAME_SESSION_ID="<active-game-session-id>"; npm run test:api:socket
```

The socket command checks connection, teacher JWT authentication, `join-game`, and the authoritative `state-snapshot`. Missing environment variables or any runtime mismatch result in exit code `1`.

The easiest handoff is to run `npm run test:api` without `--cleanup`, copy the generated `SOCKET HANDOFF` commands printed at the end, and then run `npm run test:api:socket`. Do not use the handoff after running with `--cleanup`, because that command removes the generated session.

If a repeated REST run returns `429 Too many requests`, the backend rate limiter is active for the local client IP. Wait until its window expires or restart the local backend before rerunning. With `--cleanup`, fixture deletion is attempted even when a check fails.

### Coverage status

Covered by the ordered collection:

- Super Admin login and dashboard
- Super Admin school list, create, detail, status, and Admin password reset
- health check
- admin login
- class creation
- teacher creation and assignment
- teacher login
- room creation and session creation
- student room join
- two-participant problem preparation
- start, pause, resume, reconnect, state restore, and finish
- wrong credentials, missing token, and invalid room code

Covered by the endpoint reference collection or manual checklist, but not yet automatically ordered in the smoke flow:

- auth `/me`, refresh, logout, and password change
- school list/detail/create/status/admin reset-password
- class list/detail/update/remove teacher assignment
- teacher list/detail/import/reset-password
- topic list/create/update/delete
- room close and room status
- teacher history and session history
- dashboard endpoints for Super Admin, Admin, and Teacher
- game configuration, teacher participant/problem entry, group list, current turn, reveal, and complete-turn endpoints
- full negative authorization matrix and cross-school isolation cases

Therefore, **Run Collection proves the core product path**, while full PRD/API sign-off still requires the remaining endpoint and authorization cases to be executed and recorded.

## 3. Preconditions

Before running this checklist, confirm:

- [ ] MySQL is running
- [ ] backend server is running
- [ ] database migration has been executed
- [ ] seed/admin data exists
- [ ] health endpoint responds successfully

Health check:

```http
GET http://localhost:3000/health
```

Expected:

```json
{
  "success": true,
  "data": {
    "service": "phillyogo-backend",
    "status": "ok"
  }
}
```

## 4. Default seeded accounts

Admin:

```json
{
  "email": "admin.sma-negeri-4-bandung@phillyogo.id",
  "password": "SMA4@2026"
}
```

Teacher default password after creation:

```text
Guru@123
```

## 5. Test execution conventions

For each test case:

- [ ] Send request
- [ ] Confirm HTTP status
- [ ] Confirm response structure contains `success` and `data` or `message`
- [ ] Capture evidence (status code, response snippet, screenshot, or Postman result)
- [ ] Mark as PASS / FAIL / BLOCKED

## 6. Authentication & Authorization

### AT-01: Admin login

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/auth/login
- Body:

```json
{
  "email": "admin.sma-negeri-4-bandung@phillyogo.id",
  "password": "SMA4@2026"
}
```

Expected:

- [ ] HTTP 200
- [ ] `success === true`
- [ ] `data.accessToken` exists
- [ ] `data.user.role === "ADMIN"`

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

Notes:

- [ ] Store token in `adminToken`

### AT-02: Teacher login

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/auth/login
- Body:

```json
{
  "email": "guru.budi.guru.runtime@sman4bandung.co.id",
  "password": "Guru@123"
}
```

Expected:

- [ ] HTTP 200
- [ ] `success === true`
- [ ] `data.accessToken` exists
- [ ] `data.user.role === "TEACHER"`

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

Notes:

- [ ] Store token in `teacherToken`

### AT-03: Get current user

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/auth/me
- Header: `Authorization: Bearer {{adminToken}}`

Expected:

- [ ] HTTP 200
- [ ] returns authenticated user profile

### AT-04: Refresh token

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/auth/refresh
- Cookie: refresh token from login response (if used in browser flow)

Expected:

- [ ] HTTP 200
- [ ] new access token returned

### AT-05: Logout

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/auth/logout
- Header: `Authorization: Bearer {{adminToken}}`

Expected:

- [ ] HTTP 200
- [ ] logout success message returned

## 7. School & Admin Management

### SA-01: List schools

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/schools
- Header: `Authorization: Bearer {{adminToken}}`

Expected:

- [ ] HTTP 200
- [ ] list returned

### SA-02: Get school detail

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/schools/1
- Header: `Authorization: Bearer {{adminToken}}`

Expected:

- [ ] HTTP 200
- [ ] valid school detail payload

### SA-03: Update school status

- Method: PATCH
- URL: {{baseUrl}}{{apiPrefix}}/schools/1/status
- Header: `Authorization: Bearer {{adminToken}}`
- Body:

```json
{
  "status": "ACTIVE"
}
```

Expected:

- [ ] HTTP 200
- [ ] status updated successfully

## 8. Class Management

### CL-01: Create class

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/classes
- Header: `Authorization: Bearer {{adminToken}}`
- Body:

```json
{
  "gradeLevel": "XI",
  "major": "MIPA",
  "classNumber": 2
}
```

Expected:

- [ ] HTTP 201
- [ ] `data.id` created
- [ ] `data.name === "XI-MIPA-2"`

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

Notes:

- [ ] Store `classId`

### CL-02: List classes

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/classes
- Header: `Authorization: Bearer {{adminToken}}`

Expected:

- [ ] HTTP 200
- [ ] list contains created class

### CL-03: Get class detail

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/classes/{{classId}}
- Header: `Authorization: Bearer {{adminToken}}`

Expected:

- [ ] HTTP 200
- [ ] class detail matches created record

### CL-04: Assign teacher to class

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/classes/{{classId}}/teachers
- Header: `Authorization: Bearer {{adminToken}}`
- Body:

```json
{
  "teacherId": 3
}
```

Expected:

- [ ] HTTP 201
- [ ] assignment successful

## 9. Teacher Management

### TE-01: Create teacher

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/teachers
- Header: `Authorization: Bearer {{adminToken}}`
- Body:

```json
{
  "fullName": "Budi Guru Runtime"
}
```

Expected:

- [ ] HTTP 201
- [ ] returns teacher info and credential
- [ ] teacher email is generated based on school domain
- [ ] default password is returned as `Guru@123`

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

Notes:

- [ ] Store created teacher ID and email

### TE-02: List teachers

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/teachers
- Header: `Authorization: Bearer {{adminToken}}`

Expected:

- [ ] HTTP 200
- [ ] teacher list populated

### TE-03: Reset teacher password

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/teachers/{{teacherId}}/reset-password
- Header: `Authorization: Bearer {{adminToken}}`

Expected:

- [ ] HTTP 200
- [ ] password reset response includes new email/password

## 10. Room & Game Session Flow

### RM-01: Teacher open room

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/classes/{{classId}}/rooms
- Header: `Authorization: Bearer {{teacherToken}}`

Expected:

- [ ] HTTP 201
- [ ] returns `id`, `classId`, `code`, `status: "OPEN"`
- [ ] `code` is 6-character room code

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

Notes:

- [ ] Store `roomId` and `roomCode`

### RM-02: Teacher view room status

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/rooms/{{roomId}}
- Header: `Authorization: Bearer {{teacherToken}}`

Expected:

- [ ] HTTP 200
- [ ] room status visible

### RM-03: Create game session

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/rooms/{{roomId}}/game-sessions
- Header: `Authorization: Bearer {{teacherToken}}`
- Body:

```json
{
  "inputMode": "STUDENT",
  "gameMode": "GROUPS",
  "problemDisplayLimit": 1,
  "groupCount": 2
}
```

Expected:

- [ ] HTTP 201
- [ ] returns `id` and `status: "WAITING"`

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

Notes:

- [ ] Store `sessionId`

### RM-04: Start game session

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/game-sessions/{{sessionId}}/start
- Header: `Authorization: Bearer {{teacherToken}}`

Expected:

- [ ] HTTP 200
- [ ] session starts successfully
- [ ] game status becomes `PLAYING`

### RM-05: Pause game

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/game-sessions/{{sessionId}}/pause
- Header: `Authorization: Bearer {{teacherToken}}`

Expected:

- [ ] HTTP 200
- [ ] status changes to `PAUSED`
- [ ] state version increments

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

### RM-06: Resume game

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/game-sessions/{{sessionId}}/resume
- Header: `Authorization: Bearer {{teacherToken}}`

Expected:

- [ ] HTTP 200
- [ ] status returns to `PLAYING`
- [ ] resumed_at timestamp recorded

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

### RM-07: Finish game

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/game-sessions/{{sessionId}}/finish
- Header: `Authorization: Bearer {{teacherToken}}`

Expected:

- [ ] HTTP 200
- [ ] final status is `FINISHED`
- [ ] state version increments

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

### RM-08: Reconnect / session restore for participant

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/public/game-sessions/{{sessionId}}/participants
- Body:

```json
{
  "sessionId": "11111111-1111-4111-8111-111111111111",
  "fullName": "Siswa Uji"
}
```

Expected:

- [ ] HTTP 201 or 200 depending on rejoin behavior
- [ ] participant is restored by existing session UUID
- [ ] status changes back to `CONNECTED`
- [ ] returned participant matches prior session

Result:

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

### RM-09: GET student state after reconnect

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/public/game-sessions/{{sessionId}}/state
- Header: `x-participant-session-id: {{participantSessionId}}`

Expected:

- [ ] HTTP 200
- [ ] same participant session remains valid
- [ ] current game status is returned without losing identity

## 11. Public Student Flow

### ST-01: Student join room by code

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/public/rooms/join
- Body:

```json
{
  "roomCode": "{{roomCode}}"
}
```

Expected:

- [ ] HTTP 200
- [ ] room exists and is open
- [ ] `roomStatus === "OPEN"`

### ST-02: Register participant

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/public/game-sessions/{{sessionId}}/participants
- Body:

```json
{
  "sessionId": "11111111-1111-4111-8111-111111111111",
  "fullName": "Siswa Uji"
}
```

Expected:

- [ ] HTTP 201
- [ ] participant created
- [ ] returned `sessionId` matches request

Notes:

- [ ] Store `participantSessionId`

### ST-03: Submit problem

- Method: POST
- URL: {{baseUrl}}{{apiPrefix}}/public/game-sessions/{{sessionId}}/problems
- Body:

```json
{
  "participantSessionId": "{{participantSessionId}}",
  "content": "Saya stres karena tugas banyak"
}
```

Expected:

- [ ] HTTP 201
- [ ] `submitted === true`
- [ ] `allSubmitted` becomes true when all participants have submitted

### ST-04: Get own group

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/public/game-sessions/{{sessionId}}/group
- Header: `x-participant-session-id: {{participantSessionId}}`

Expected:

- [ ] HTTP 200
- [ ] returns the participant group assignment if game has started and groups were assigned

### ST-05: Get own state

- Method: GET
- URL: {{baseUrl}}{{apiPrefix}}/public/game-sessions/{{sessionId}}/state
- Header: `x-participant-session-id: {{participantSessionId}}`

Expected:

- [ ] HTTP 200
- [ ] returns current student state and game status

## 12. Socket / Realtime

### SO-01: Teacher connects to game namespace

- Namespace: `/game`
- Auth: `token: {{teacherToken}}`
- Emit: `join-game` with `gameSessionId: {{sessionId}}`

Expected:

- [ ] socket connects successfully
- [ ] receives `state-snapshot`
- [ ] returned state includes `status`, `participants`, and `stateVersion`

### SO-02: Teacher receives game start event

- Trigger: call start endpoint via HTTP
- Expected socket event:
  - `game-started`

### SO-03: Teacher receives pause/resume/finish events

- Trigger corresponding HTTP actions
- Expected socket events:
  - `game-paused`
  - `game-resumed`
  - `game-finished`

## 13. Validation & Negative Cases

### NV-01: Invalid credentials

- POST /auth/login with wrong password
- Expected: HTTP 401

### NV-02: Access without token

- Call protected route without Authorization header
- Expected: HTTP 401

### NV-03: Unauthorized role access

- Try teacher route with admin token or admin route with teacher token
- Expected: HTTP 403 or 401 depending on route

### NV-04: Invalid room code

- POST /public/rooms/join with non-existent code
- Expected: HTTP 404

### NV-05: Duplicate participant session

- Register same student session twice
- Expected: rejoin behavior works; duplicate registration should be handled gracefully

### NV-06: Reconnect with session UUID

- Reconnect using existing participant UUID
- Expected: participant restored and websocket/session state continues

## 14. Pass Criteria

The backend can be considered ready for QA handoff when all of the following are true:

- [ ] Login flow works for admin and teacher
- [ ] Role and authorization checks work
- [ ] Class creation and teacher assignment works
- [ ] Room and game session creation works
- [ ] Student join and participant registration works
- [ ] Problem submission works
- [ ] State retrieval works for student and teacher
- [ ] Socket connection and state snapshot work
- [ ] Invalid input and unauthorized access return expected errors

## 15. Sign-off Template

### QA Sign-off

- Tester name:
- Date:
- Environment:
- Backend version:
- DB state:

#### Result summary

- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED

Notes:

-

### Developer sign-off

- Developer name:
- Date:
- Fixed issues:
- Remaining follow-up:

## 16. Quick smoke test order

Run this minimal order to verify the core flow quickly:

1. Login admin
2. Create class
3. Create teacher
4. Assign teacher
5. Login teacher
6. Open room
7. Create session
8. Join room as student
9. Register participant
10. Submit problem
11. Verify state snapshot via socket
12. End with start/pause/resume/finish flow

This order matches the PRD core flow already verified at runtime.
