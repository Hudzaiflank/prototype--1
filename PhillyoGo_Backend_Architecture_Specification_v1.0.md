# PhillyoGo — Backend Architecture Specification

**Version:** 1.0  
**Status:** Development Baseline  
**Backend Stack:** Node.js + Express.js  
**Database:** MySQL  
**Realtime:** Socket.IO  
**Authentication:** JWT + Refresh Token  
**Architecture:** Modular Layered Architecture

---

# 1. Tujuan

Dokumen ini menentukan arsitektur backend PhillyoGo agar:

- aman;
- ringan;
- mudah dikembangkan;
- mudah diuji;
- mendukung realtime;
- mendukung multiple role;
- mendukung school isolation;
- mendukung pause/resume;
- mendukung reconnect;
- menjamin perfect matching;
- meminimalkan penggunaan resource.

Backend adalah **authoritative source of truth**.

---

# 2. Repository Structure

FE dan BE terpisah.

```text
phillyogo/
├── frontend/
└── backend/
```

Backend:

```text
backend/
├── src/
├── .env
├── .env.example
├── package.json
└── README.md
```

---

# 3. Backend Folder Structure

Recommended:

```text
backend/
└── src/
    ├── config/
    │   ├── database.js
    │   ├── env.js
    │   └── socket.js
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── school.controller.js
    │   ├── class.controller.js
    │   ├── teacher.controller.js
    │   ├── topic.controller.js
    │   ├── room.controller.js
    │   ├── game.controller.js
    │   └── history.controller.js
    │
    ├── services/
    │   ├── auth.service.js
    │   ├── school.service.js
    │   ├── class.service.js
    │   ├── teacher.service.js
    │   ├── topic.service.js
    │   ├── room.service.js
    │   ├── game.service.js
    │   ├── matching.service.js
    │   ├── group.service.js
    │   ├── history.service.js
    │   └── session.service.js
    │
    ├── repositories/
    │   ├── user.repository.js
    │   ├── school.repository.js
    │   ├── class.repository.js
    │   ├── teacher.repository.js
    │   ├── topic.repository.js
    │   ├── room.repository.js
    │   ├── game.repository.js
    │   ├── assignment.repository.js
    │   ├── participant.repository.js
    │   └── history.repository.js
    │
    ├── middleware/
    │   ├── auth.middleware.js
    │   ├── role.middleware.js
    │   ├── school.middleware.js
    │   ├── validation.middleware.js
    │   ├── rateLimit.middleware.js
    │   └── error.middleware.js
    │
    ├── routes/
    │   ├── auth.routes.js
    │   ├── school.routes.js
    │   ├── class.routes.js
    │   ├── teacher.routes.js
    │   ├── topic.routes.js
    │   ├── room.routes.js
    │   ├── game.routes.js
    │   └── history.routes.js
    │
    ├── sockets/
    │   ├── index.js
    │   ├── auth.socket.js
    │   ├── room.socket.js
    │   ├── game.socket.js
    │   └── socketErrors.js
    │
    ├── validators/
    │   ├── auth.validator.js
    │   ├── school.validator.js
    │   ├── class.validator.js
    │   ├── teacher.validator.js
    │   ├── topic.validator.js
    │   ├── room.validator.js
    │   └── game.validator.js
    │
    ├── utils/
    │   ├── password.js
    │   ├── token.js
    │   ├── roomCode.js
    │   ├── random.js
    │   ├── errors.js
    │   └── logger.js
    │
    ├── constants/
    │   ├── roles.js
    │   ├── statuses.js
    │   ├── gameModes.js
    │   └── socketEvents.js
    │
    ├── app.js
    └── server.js
```

---

# 4. Layer Responsibilities

Architecture:

```text
Route
 ↓
Middleware
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
MySQL
```

Socket:

```text
Socket Event
 ↓
Socket Handler
 ↓
Service
 ↓
Repository
 ↓
MySQL
 ↓
Socket Broadcast
```

---

# 5. Controller Rules

Controller hanya menangani:

```text
request
validation result
service call
response
```

Controller tidak boleh berisi:

```text
matching algorithm
SQL query
password generation
game transition logic
```

---

# 6. Service Rules

Service menangani business logic:

```text
create school
create teacher
assign teacher
open room
start game
pause game
resume game
reveal card
complete turn
finish game
```

---

# 7. Repository Rules

Repository hanya menangani persistence:

```text
SELECT
INSERT
UPDATE
DELETE
transactions
locks
```

Tidak boleh berisi business decisions.

---

# 8. Database Connection

Gunakan connection pool.

Recommended:

```text
mysql2/promise
```

Pool digunakan agar:

```text
connection reuse
lower overhead
controlled concurrency
```

Jangan membuat connection baru untuk setiap query.

---

# 9. Connection Pool

Pool size harus disesuaikan dengan resource server.

Untuk deployment kecil:

```text
start small
monitor
increase only when needed
```

Jangan menggunakan pool terlalu besar.

---

# 10. Transactions

Transaction wajib untuk operation yang mengubah beberapa entity secara atomik.

Contoh:

```text
START GAME
```

melibatkan:

```text
game session
groups
assignments
turns
game status
```

Semua harus satu transaction.

---

# 11. Transaction Flow

```text
BEGIN
 ↓
SELECT ... FOR UPDATE
 ↓
validate state
 ↓
business operation
 ↓
INSERT/UPDATE
 ↓
COMMIT
```

Error:

```text
ROLLBACK
```

---

# 12. Row Locking

Gunakan row lock untuk resource yang dapat mengalami race condition.

Contoh:

```text
game_session
group
turn
room
```

terutama saat:

```text
START
REVEAL
COMPLETE
PAUSE
RESUME
FINISH
```

---

# 13. Roles

```text
SUPER_ADMIN
ADMIN
TEACHER
STUDENT
```

Student tidak mempunyai account.

Student menggunakan:

```text
participant session
```

---

# 14. Role Authorization

Authorization dilakukan backend.

Contoh:

```text
SUPER_ADMIN
→ school management

ADMIN
→ own school management

TEACHER
→ own assigned classes
→ own game sessions

STUDENT
→ own participant session only
```

Frontend role guard bukan security boundary.

---

# 15. School Isolation

Admin hanya dapat mengakses:

```text
school_id miliknya
```

Teacher hanya dapat mengakses class:

```text
yang telah di-assign kepadanya
```

Teacher hanya dapat mengakses game:

```text
yang dibuatnya sendiri
```

---

# 16. Authorization Pattern

Setiap query sensitive harus memiliki scope.

Contoh:

```sql
SELECT *
FROM classes
WHERE id = ?
AND school_id = ?;
```

Jangan:

```sql
SELECT *
FROM classes
WHERE id = ?;
```

kemudian mengandalkan frontend.

---

# 17. Super Admin

Super Admin:

```text
one account
fixed during initial deployment
```

Capabilities:

```text
create school
list schools
view school
reset admin password
```

Tidak boleh:

```text
create another super admin
```

---

# 18. Admin

Satu school:

```text
exactly one admin account
```

Admin:

```text
manage classes
manage teachers
assign teachers
manage topics
reset teacher password
```

Admin tidak dapat:

```text
create another admin
reset own account through normal teacher mechanism
reset super admin
```

---

# 19. Teacher

Teacher:

```text
login
logout
change password
view assigned classes
create own game sessions
open room
configure game
monitor game
pause/resume
view own history
```

Teacher tidak dapat:

```text
register
manage school
manage other teachers
reset passwords
view other teacher's game history
```

---

# 20. Student

Student:

```text
join room
submit name
submit problem
wait
play
reconnect
view own game state
```

Student tidak dapat:

```text
login
access dashboard
view history
view problem author
control game
```

---

# 21. Password Hashing

Never store plaintext passwords.

Use a slow password hashing algorithm such as:

```text
Argon2id
```

or a properly configured equivalent.

Database stores:

```text
password_hash
```

Never:

```text
password
```

---

# 22. Generated Admin Credentials

When school is created:

```text
admin email
admin password
```

are generated.

Example:

```text
admin.sman4bandung@phillyogo.id

SMA4@2026
```

Password is hashed before database persistence.

Plain generated password should only be returned in the creation response/display workflow.

---

# 23. Generated Teacher Credentials

Teacher email:

```text
guru.nama@sman4bandung.co.id
```

Default password:

```text
Guru@123
```

Password is hashed.

---

# 24. Password Reset

Admin password reset:

```text
Super Admin
```

Teacher password reset:

```text
Admin
```

No lower role may reset higher role.

---

# 25. JWT

Access token expiration:

```text
2 hours
```

Payload minimum:

```text
sub
role
schoolId
```

Teacher may additionally require:

```text
teacherId
```

Do not put sensitive data in JWT.

---

# 26. Refresh Token

Refresh token is used so users are not immediately kicked out after access token expiration.

Recommended:

```text
HttpOnly
Secure
SameSite
```

Refresh token should be stored server-side in hashed/rotatable form if session revocation is required.

---

# 27. Refresh Flow

```text
Access Token
   ↓
expired
   ↓
POST /auth/refresh
   ↓
validate refresh token
   ↓
issue new access token
   ↓
continue session
```

If invalid:

```text
401
→ frontend redirects login
```

---

# 28. Refresh Token Rotation

Recommended:

```text
refresh token A
   ↓
refresh
   ↓
revoke A
   ↓
issue B
```

This limits replay risk.

---

# 29. Logout

Logout should invalidate refresh session.

Access token naturally expires.

Flow:

```text
logout
→ revoke refresh token/session
→ clear client auth state
```

---

# 30. Auth Rate Limiting

Login endpoint must be rate limited.

Also rate limit:

```text
refresh
password reset
room join
participant submit
```

Do not allow unlimited brute-force requests.

---

# 31. Room Code

Format:

```text
6 alphanumeric characters
```

Example:

```text
A7K92P
```

Requirements:

```text
unique globally
case-insensitive
not reused
```

---

# 32. Room Code Generation

Generate using secure random source.

Avoid:

```text
Math.random()
```

Normalize input:

```text
uppercase
```

---

# 33. Closed Room Code

When room closes:

```text
code becomes permanently invalid
```

Do not recycle it.

Class remains active.

---

# 34. One Active Room Per Class

A class can have:

```text
max 1 active room
```

Opening another active room must be rejected.

Closed rooms remain historical records.

---

# 35. Room Lifecycle

```text
OPEN
 ↓
CLOSED
```

Only Teacher who created the room can control it.

---

# 36. Room Ownership

Room contains:

```text
class_id
teacher_id
game_session_id
room_code
```

Authorization:

```text
teacher.id == room.teacher_id
```

plus:

```text
teacher is assigned to class
```

---

# 37. Student Join Validation

Server checks:

```text
room exists
room status == OPEN
room not expired
```

Then creates/retrieves:

```text
participant session
```

---

# 38. Participant Session

Participant session has:

```text
session UUID
game session
room
participant
connection status
```

Session identity is separate from student name.

---

# 39. Duplicate Student Names

Names are not unique.

Example:

```text
Andi
Andi
```

Allowed.

Participant identity:

```text
participant.id
```

not:

```text
name
```

---

# 40. Student Session Reconnect

If session UUID remains valid:

```text
restore participant
```

Do not create another participant.

Restore:

```text
group
assignment
current turn
submission
```

---

# 41. Participant Status

Three required statuses:

```text
CONNECTED
DISCONNECTED
FINISHED
```

Disconnect:

```text
CONNECTED → DISCONNECTED
```

Reconnect:

```text
DISCONNECTED → CONNECTED
```

Finish:

```text
CONNECTED/DISCONNECTED → FINISHED
```

---

# 42. Game Modes

```text
ALL_STUDENTS
GROUPS
```

---

# 43. Input Modes

```text
STUDENT
TEACHER
```

---

# 44. Problem Requirement

For N participants:

```text
N problems
```

Required before START.

---

# 45. Student Input Mode

Each participant submits:

```text
name
problem
```

START rejected until:

```text
all participants submitted
```

---

# 46. Teacher Input Mode

Teacher provides:

```text
student names
problems
```

There must still be:

```text
N participants
N problems
```

---

# 47. Matching Service

`matching.service.js` is responsible for:

```text
validate input
build candidate graph
generate perfect matching
randomize valid assignments
return matching
```

It does not directly manage HTTP or Socket.IO.

---

# 48. Perfect Matching

Requirement:

```text
1 participant → 1 problem
1 problem → 1 participant
```

For student-generated problem:

```text
participant != problem.author
```

---

# 49. Matching Algorithm

Recommended:

```text
randomized candidate ordering
+
bipartite maximum matching
```

If:

```text
matching size == N
```

success.

Else:

```text
GAME_MATCHING_FAILED
```

---

# 50. No Partial Matching

Never start with partial assignment.

If matching fails:

```text
transaction rollback
game remains WAITING
```

---

# 51. Group Service

`group.service.js`:

```text
shuffle participants
divide evenly
persist group membership
```

Maximum group size difference:

```text
1
```

---

# 52. Group Assignment

Example:

```text
29 participants
5 groups

6
6
6
6
5
```

---

# 53. Group Stability

Once START succeeds:

```text
group assignment is immutable
```

Pause/resume:

```text
unchanged
```

Reconnect:

```text
unchanged
```

---

# 54. Game Service

`game.service.js` owns state transitions:

```text
start
pause
resume
reveal
completeTurn
finish
```

Every transition must validate current state.

---

# 55. State Transition Rule

Example:

```text
PAUSE
```

allowed only:

```text
PLAYING → PAUSED
```

Any other state:

```text
GAME_INVALID_STATE
```

---

# 56. Start Game

Start transaction:

```text
lock game
 ↓
validate room
 ↓
validate participants
 ↓
validate problems
 ↓
create groups
 ↓
generate matching
 ↓
persist assignments
 ↓
create turns
 ↓
set PLAYING
 ↓
commit
```

After commit:

```text
broadcast game:started
```

---

# 57. Pause Game

```text
lock game
 ↓
validate PLAYING
 ↓
set PAUSED
 ↓
commit
 ↓
broadcast game:paused
```

---

# 58. Resume Game

```text
lock game
 ↓
validate PAUSED
 ↓
set PLAYING
 ↓
commit
 ↓
broadcast game:resumed
```

---

# 59. Reveal Card

```text
lock active turn
 ↓
validate PLAYING
 ↓
validate turn
 ↓
validate hidden state
 ↓
set revealed
 ↓
commit
 ↓
broadcast card:revealed
```

---

# 60. Complete Turn

```text
lock turn
 ↓
validate revealed
 ↓
set COMPLETED
 ↓
activate next turn if applicable
 ↓
commit
 ↓
broadcast
```

For group mode, next turn belongs to the same group.

---

# 61. Finish Game

Game finishes when:

```text
all assignments completed
```

For GROUPS:

```text
all groups completed
```

Then:

```text
FINISHED
```

---

# 62. History Service

History records:

```text
game session
turn
group
participant
problem
timestamp
status
```

Teacher can view:

```text
only games created by that teacher
```

---

# 63. Anonymous Problem

Student response API/socket payload must not expose:

```text
problem.author
```

Teacher history may expose author.

Database retains author internally.

---

# 64. Socket.IO Server

Socket.IO is responsible for:

```text
connection
authentication
room membership
game events
state broadcast
reconnect
```

Business logic remains in services.

---

# 65. Socket Authentication

Teacher socket:

```text
JWT
```

Student socket:

```text
participant session
```

Backend validates both.

---

# 66. Socket Room Names

Recommended:

```text
game:{gameSessionId}
group:{groupId}
```

Teacher:

```text
game room
```

Student:

```text
game room
+
group room where appropriate
```

---

# 67. Socket Authorization

Joining a Socket.IO room is never enough for authorization.

Backend validates:

```text
teacher owns game
student belongs to game
student belongs to group
```

---

# 68. Socket Events

Minimum:

```text
room:joined
participant:joined
participant:updated
submission:updated
game:started
game:paused
game:resumed
game:state
turn:activated
card:revealed
turn:completed
game:finished
participant:disconnected
participant:reconnected
```

---

# 69. Server Broadcast Order

Critical mutation:

```text
validate
 ↓
database transaction
 ↓
commit
 ↓
broadcast
```

Never broadcast a state that failed to persist.

---

# 70. Reconnect State

After reconnect:

```text
authenticate
 ↓
authorize
 ↓
join socket room
 ↓
send authoritative snapshot
```

Snapshot contains only data allowed for that role.

---

# 71. State Version

Game state should maintain:

```text
state_version
```

Increment after important mutation.

Used for:

```text
stale event prevention
debugging
recovery
```

---

# 72. Idempotency

Critical operations should tolerate duplicate requests.

Examples:

```text
START twice
REVEAL twice
COMPLETE twice
```

Second request should return deterministic error or safe idempotent result.

---

# 73. Race Condition Example

Two Teacher clients send:

```text
REVEAL
```

simultaneously.

Only one succeeds.

Second receives:

```text
TURN_ALREADY_REVEALED
```

Database lock enforces this.

---

# 74. Group Concurrency

Allowed:

```text
Group 1 → reveal
Group 2 → reveal
```

at the same time.

Not allowed:

```text
Group 1 → Turn 4
Group 1 → Turn 5
```

simultaneously.

---

# 75. Rate Limiting

Endpoints requiring protection:

```text
/auth/login
/auth/refresh
/auth/change-password
/rooms/join
/participant/submit
```

Socket events should also have basic anti-spam controls.

---

# 76. Input Validation

Validate:

```text
email
password
school name
domain
class level
major
class number
teacher name
room code
problem
group count
display limit
```

Reject malformed input before service execution.

---

# 77. Sanitization

Do not trust:

```text
name
problem
topic
school name
```

Prevent:

```text
SQL injection
XSS
unexpected HTML
```

Use parameterized queries.

Frontend should render user text safely.

---

# 78. HTTP Security

Recommended middleware:

```text
helmet
cors
rate limiter
compression where useful
```

CORS should whitelist frontend origin in production.

---

# 79. Error Handling

Central error middleware:

```text
error.middleware.js
```

Response format:

```json
{
  "success": false,
  "error": {
    "code": "GAME_INVALID_STATE",
    "message": "Game cannot perform this action in its current state."
  }
}
```

Do not expose stack traces in production.

---

# 80. Error Codes

Recommended:

```text
AUTH_INVALID_CREDENTIALS
AUTH_UNAUTHORIZED
AUTH_FORBIDDEN
AUTH_TOKEN_EXPIRED
AUTH_REFRESH_INVALID

SCHOOL_NOT_FOUND
SCHOOL_ADMIN_EXISTS

CLASS_NOT_FOUND
CLASS_DUPLICATE

TEACHER_NOT_FOUND
TEACHER_NOT_ASSIGNED

ROOM_NOT_FOUND
ROOM_CLOSED
ROOM_ALREADY_ACTIVE
ROOM_CODE_INVALID

GAME_NOT_FOUND
GAME_INVALID_STATE
GAME_NOT_READY
GAME_MATCHING_FAILED
GAME_ALREADY_STARTED
GAME_ALREADY_FINISHED

TURN_NOT_ACTIVE
TURN_ALREADY_REVEALED
TURN_ALREADY_COMPLETED

PARTICIPANT_NOT_FOUND
PARTICIPANT_SESSION_INVALID
```

---

# 81. Logging

Use structured logging.

Log:

```text
request ID
user ID
role
action
result
latency
error code
```

Do not log:

```text
password
JWT
refresh token
```

Problem content should not be unnecessarily logged.

---

# 82. Request ID

Every HTTP request should receive:

```text
requestId
```

Useful for debugging:

```text
frontend error
→ requestId
→ backend log
```

---

# 83. Health Check

Provide:

```text
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

Optional deeper health check:

```text
database connectivity
```

---

# 84. Graceful Shutdown

On shutdown:

```text
stop accepting new requests
 ↓
close Socket.IO
 ↓
close DB pool
 ↓
exit
```

Avoid abruptly terminating active database operations.

---

# 85. Resource Optimization

Because deployment may be small:

```text
use connection pool
avoid unnecessary workers
avoid polling
use Socket.IO for realtime
query only required columns
paginate history
index foreign keys
```

---

# 86. No Polling for Gameplay

Do not implement:

```text
setInterval(fetchGameState, 1000)
```

for normal gameplay.

Use:

```text
Socket.IO
```

and snapshot recovery when necessary.

---

# 87. History Pagination

History must use pagination.

Example:

```text
?page=1&limit=20
```

Never load an unlimited historical dataset.

---

# 88. Database Index Awareness

Indexes should exist for frequently queried fields:

```text
school_id
class_id
teacher_id
game_session_id
room_code
participant_session_id
status
```

Exact indexes must follow final ERD/query profiling.

---

# 89. Data Retention

Completed game/history data:

```text
delete after 30 days
```

unless future product policy changes.

Retention should be performed through:

```text
scheduled cleanup job
```

not on every user request.

---

# 90. Cleanup Job

Recommended:

```text
daily
```

Delete expired data in batches.

Avoid one giant DELETE if data volume becomes large.

---

# 91. Security Boundary

Never trust:

```text
role from frontend
schoolId from frontend
teacherId from frontend
groupId from frontend
participantId from frontend
```

Backend derives/validates ownership from authenticated/session context.

---

# 92. Teacher Access Rule

For every teacher operation:

```text
authenticated teacher
AND
teacher assigned to class
AND
teacher owns game where applicable
```

All conditions must pass.

---

# 93. Admin Access Rule

For every admin operation:

```text
authenticated admin
AND
resource.school_id == admin.school_id
```

---

# 94. Super Admin Access Rule

Super Admin may operate across schools.

Still validate:

```text
authenticated
role == SUPER_ADMIN
```

---

# 95. Student Access Rule

Student can only access:

```text
participant session
game session
group
```

associated with their session.

Student cannot enumerate:

```text
other sessions
other rooms
other games
```

---

# 96. Database Access Principle

Prefer:

```text
specific SELECT columns
```

instead of:

```text
SELECT *
```

for sensitive endpoints.

---

# 97. Password Change

Teacher/Admin change password:

```text
verify current password
 ↓
validate new password
 ↓
hash
 ↓
update
 ↓
optionally revoke other sessions
```

---

# 98. Password Reset Default

Teacher reset:

```text
Guru@123
```

After reset, teacher can immediately log in and should be encouraged/required to change password according to product policy.

Admin reset:

```text
generated new default
```

---

# 99. Domain Validation

Teacher email:

```text
guru.nama@sman4bandung.co.id
```

Domain is derived from the school domain.

Do not allow Teacher to arbitrarily select another school's domain.

---

# 100. Email Generation

Name normalization:

```text
Guru Budi Santoso
→ guru.budi.santoso@school-domain
```

Collision handling is required.

Example:

```text
guru.budi.santoso@...
guru.budi.santoso2@...
```

Exact collision strategy should be deterministic.

---

# 101. Admin Email Generation

School slug:

```text
SMA Negeri 4 Bandung
→ sman4bandung
```

Example:

```text
admin.sman4bandung@phillyogo.id
```

Must be unique.

---

# 102. Database Transaction Boundaries

Use transactions for:

```text
create school + admin
create teacher + credentials
assign teachers
start game
create groups
create assignments
complete turn
finish game
reset password where audit consistency is needed
```

Simple reads do not require transactions.

---

# 103. Game State Persistence

Never rely on:

```text
Socket.IO memory
```

for permanent game state.

Persist:

```text
room
game
participant
group
assignment
turn
history
```

in MySQL.

---

# 104. Socket.IO Memory Usage

Socket server memory should only hold:

```text
connections
temporary socket metadata
room membership
```

not the complete game database.

---

# 105. Horizontal Scaling

If later scaling beyond one backend instance:

```text
Socket.IO adapter
+
shared state/database
```

will be required.

A Redis adapter may be introduced later if needed.

Do not add Redis before it is necessary.

---

# 106. Initial Deployment Recommendation

For small deployment:

```text
1 Node.js process
1 MySQL instance
Socket.IO in same Node process
```

This minimizes:

```text
cost
complexity
resource usage
```

---

# 107. Reverse Proxy

Production architecture:

```text
Internet
   ↓
Reverse Proxy
   ↓
Node.js / Express
   ↓
MySQL
```

Socket.IO traffic must support WebSocket upgrade.

---

# 108. HTTPS

Production must use:

```text
HTTPS
WSS
```

Never send credentials over plain HTTP in production.

---

# 109. CORS Production

Allow only:

```text
frontend production origin
```

Example conceptual:

```text
https://app.phillyogo.com
```

Exact domain can be configured later.

---

# 110. Environment Variables

Backend `.env.example`:

```text
NODE_ENV=development

PORT=3000

DATABASE_HOST=
DATABASE_PORT=3306
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=2h

JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

FRONTEND_URL=

ROOM_CODE_LENGTH=6
GAME_HISTORY_RETENTION_DAYS=30
```

Never commit actual secrets.

---

# 111. Secret Management

Production secrets must be supplied through:

```text
environment variables
```

or a secret manager.

Never:

```text
hardcode JWT secret
hardcode DB password
commit .env
```

---

# 112. Migration Strategy

Database schema changes should use migrations.

Do not manually alter production database without tracking changes.

Migration history should be versioned.

---

# 113. Seed Data

Initial seed:

```text
one Super Admin
```

Super Admin credentials are supplied securely during deployment.

Do not expose them in repository.

---

# 114. API Versioning

Recommended:

```text
/api/v1
```

Example:

```text
/api/v1/auth/login
/api/v1/schools
/api/v1/classes
```

Socket events do not necessarily need URL versioning but should maintain event compatibility.

---

# 115. Testing Layers

Backend tests:

```text
unit
integration
API
Socket
E2E
```

---

# 116. Unit Tests

Important services:

```text
matching.service
group.service
game.service
auth.service
room.service
```

---

# 117. Matching Tests

Test:

```text
N=1
N=2
N=3
N=10
N=30
N=50
```

Verify:

```text
no self match
no duplicate problem
no duplicate participant
all participants assigned
all problems assigned
```

---

# 118. Game State Tests

Verify:

```text
WAITING → PLAYING
PLAYING → PAUSED
PAUSED → PLAYING
PLAYING → FINISHED
```

Reject invalid transitions.

---

# 119. Authorization Tests

Verify:

```text
Admin A cannot access School B
Teacher A cannot access Teacher B history
Teacher A cannot control Teacher B game
Student cannot access history
Student cannot access author
```

---

# 120. Reconnect Tests

Verify:

```text
disconnect
→ reconnect same session
→ same participant
→ same group
→ same assignment
→ same turn
```

---

# 121. Concurrency Tests

Test simultaneous:

```text
START
REVEAL
COMPLETE
```

Expected:

```text
only one valid state transition
```

---

# 122. Final Backend Architecture

```text
                     Client
                       │
             ┌─────────┴─────────┐
             │                   │
            HTTP              Socket.IO
             │                   │
             └─────────┬─────────┘
                       │
                    Middleware
                       │
               Controller/Handler
                       │
                    Services
          ┌────────────┼────────────┐
          │            │            │
        Auth         Game       Matching
          │            │            │
          └────────────┼────────────┘
                       │
                  Repositories
                       │
                    MySQL
```

---

# 123. Backend Golden Rules

```text
1. Backend is authoritative.
2. Business logic belongs in services.
3. SQL belongs in repositories.
4. Controllers stay thin.
5. Critical game operations use transactions.
6. Critical state changes use row locking.
7. Never trust frontend role/ownership.
8. Never store plaintext passwords.
9. Never expose secrets.
10. Student never receives problem author.
11. Teacher history is ownership-scoped.
12. Matching must be perfect.
13. No partial game start.
14. Socket broadcast happens after DB commit.
15. Reconnect uses persisted state.
16. Socket memory is not permanent storage.
17. Use Socket.IO instead of gameplay polling.
18. Keep deployment lightweight.
19. Retain history for 30 days, then cleanup.
20. Do not introduce infrastructure complexity before needed.
```

---

# 124. Next Document

Setelah Backend Architecture:

```text
PhillyoGo API + Socket Implementation Contract
```

atau jika API Specification v1.0 sebelumnya sudah dianggap final:

```text
Master Development Specification
```

yang menggabungkan:

```text
SRS
Database / ERD
API
Socket.IO
Game State
Perfect Matching
UI
Frontend Architecture
Backend Architecture
```

menjadi satu master context untuk AI coding/development.
