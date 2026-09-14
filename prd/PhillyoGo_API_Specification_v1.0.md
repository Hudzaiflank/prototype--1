# PhillyoGo — API Specification

**Version:** 1.0  
**Status:** API Baseline  
**Backend:** Express.js  
**Database:** MySQL 8.x  
**Frontend:** React + Vite  
**Authentication:** JWT Access Token + Refresh Token  
**Access Token Lifetime:** 2 hours  
**Realtime:** Socket.IO (specified separately)

---

# 1. API Overview

Base URL:

```text
/api/v1
```

Response format menggunakan JSON.

Standard success:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Standard error:

```json
{
  "success": false,
  "message": "Human readable message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

---

# 2. Authentication

## 2.1 Login

### POST `/auth/login`

Digunakan oleh:

```text
SUPER_ADMIN
ADMIN
TEACHER
```

Request:

```json
{
  "email": "admin.sman4bandung@phillyogo.id",
  "password": "SMA4@2026"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "JWT_ACCESS_TOKEN",
    "expiresIn": 7200,
    "user": {
      "id": 12,
      "role": "ADMIN",
      "fullName": "Admin SMA Negeri 4 Bandung",
      "email": "admin.sman4bandung@phillyogo.id",
      "school": {
        "id": 1,
        "name": "SMA Negeri 4 Bandung"
      }
    }
  }
}
```

Refresh token sebaiknya dikirim melalui:

```text
HttpOnly
Secure
SameSite
```

cookie.

---

# 2.2 Refresh Access Token

### POST `/auth/refresh`

Tidak membutuhkan access token aktif.

Server memvalidasi refresh token.

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN",
    "expiresIn": 7200
  }
}
```

Refresh token dapat di-rotate.

---

# 2.3 Logout

### POST `/auth/logout`

Authentication:

```text
Required
```

Server:

```text
revoke refresh token
```

Response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

# 2.4 Get Current User

### GET `/auth/me`

Response:

```json
{
  "success": true,
  "data": {
    "id": 12,
    "role": "TEACHER",
    "fullName": "Budi Santoso",
    "email": "guru.budi@sman4bandung.co.id",
    "school": {
      "id": 1,
      "name": "SMA Negeri 4 Bandung"
    }
  }
}
```

---

# 3. Password API

## 3.1 Change Own Password

### PATCH `/auth/password`

Allowed:

```text
ADMIN
TEACHER
```

Request:

```json
{
  "currentPassword": "OldPassword",
  "newPassword": "NewSecurePassword"
}
```

Super Admin tidak memiliki endpoint perubahan password.

---

# 3.2 Reset Admin Password

### POST `/schools/:schoolId/admin/reset-password`

Allowed:

```text
SUPER_ADMIN
```

Behavior:

```text
Generate default/reset credential
Invalidate existing sessions
Revoke refresh tokens
Return temporary password once
```

Response:

```json
{
  "success": true,
  "data": {
    "email": "admin.sman4bandung@phillyogo.id",
    "password": "SMA4@2026"
  }
}
```

---

# 3.3 Reset Teacher Password

### POST `/teachers/:teacherId/reset-password`

Allowed:

```text
ADMIN
```

Behavior:

```text
Reset to default teacher password
Revoke teacher refresh tokens
```

Default:

```text
Guru@123
```

Response:

```json
{
  "success": true,
  "data": {
    "email": "guru.budi@sman4bandung.co.id",
    "password": "Guru@123"
  }
}
```

---

# 4. Super Admin API

# 4.1 Dashboard

### GET `/super-admin/dashboard`

Returns:

```text
total schools
active schools
total admins
total teachers
total classes
```

---

# 4.2 List Schools

### GET `/schools`

Allowed:

```text
SUPER_ADMIN
```

Query:

```text
?page=1
&limit=20
&search=SMA
&status=ACTIVE
```

---

# 4.3 Create School

### POST `/schools`

Allowed:

```text
SUPER_ADMIN
```

Request:

```json
{
  "name": "SMA Negeri 4 Bandung",
  "domain": "sman4bandung.co.id"
}
```

Server automatically creates:

```text
school
admin user
admin email
admin password
```

Email format:

```text
admin.{school-slug}@phillyogo.id
```

Example:

```text
admin.sman4bandung@phillyogo.id
```

Response:

```json
{
  "success": true,
  "data": {
    "school": {
      "id": 1,
      "name": "SMA Negeri 4 Bandung",
      "domain": "sman4bandung.co.id"
    },
    "admin": {
      "email": "admin.sman4bandung@phillyogo.id",
      "password": "SMA4@2026"
    }
  }
}
```

Password hanya ditampilkan pada saat credential dibuat/reset.

---

# 4.4 School Detail

### GET `/schools/:schoolId`

Returns:

```text
school
admin
classes
teacher count
student/game statistics
```

---

# 4.5 Delete/Deactivate School

### PATCH `/schools/:schoolId/status`

Allowed:

```text
SUPER_ADMIN
```

Request:

```json
{
  "status": "INACTIVE"
}
```

School sebaiknya tidak hard-delete melalui API biasa.

---

# 5. Admin API

# 5.1 Admin Dashboard

### GET `/admin/dashboard`

Scope otomatis:

```text
authenticated user's school
```

Returns:

```text
school information
class count
teacher count
active room
recent games
```

Admin tidak boleh melihat data sekolah lain.

---

# 5.2 List Classes

### GET `/classes`

Allowed:

```text
ADMIN
TEACHER
```

Scope:

```text
current school
```

Teacher hanya mendapatkan kelas yang diassign kepadanya.

---

# 5.3 Create Class

### POST `/classes`

Allowed:

```text
ADMIN
```

Request:

```json
{
  "gradeLevel": "X",
  "major": "IPA",
  "classNumber": 1
}
```

Server generates:

```text
X-IPA-1
```

---

# 5.4 Class Detail

### GET `/classes/:classId`

Returns:

```text
class
assigned teachers
room status
game history summary
```

---

# 5.5 Update Class

### PATCH `/classes/:classId`

Allowed:

```text
ADMIN
```

---

# 5.6 Create Teacher

### POST `/teachers`

Allowed:

```text
ADMIN
```

Request:

```json
{
  "fullName": "Budi Santoso"
}
```

Server generates:

```text
guru.budi@sman4bandung.co.id
```

Default password:

```text
Guru@123
```

Response includes credential once.

---

# 5.7 Import Teachers

### POST `/teachers/import`

Content-Type:

```text
multipart/form-data
```

File:

```text
.xlsx
```

Recommended columns:

```text
Nama Lengkap
Email (optional)
```

If email omitted:

```text
guru.{normalized-name}@school-domain
```

Duplicates must be detected before insertion.

Import should use transaction/batch processing.

---

# 5.8 List Teachers

### GET `/teachers`

Allowed:

```text
ADMIN
```

Query:

```text
?page=1
&limit=20
&search=Budi
&status=ACTIVE
```

---

# 5.9 Teacher Detail

### GET `/teachers/:teacherId`

Returns:

```text
teacher
assigned classes
account status
```

---

# 5.10 Assign Teacher

### POST `/classes/:classId/teachers`

Allowed:

```text
ADMIN
```

Request:

```json
{
  "teacherId": 21
}
```

Teacher and class must belong to same school.

---

# 5.11 Remove Teacher Assignment

### DELETE `/classes/:classId/teachers/:teacherId`

Allowed:

```text
ADMIN
```

This removes assignment, not the teacher account.

---

# 6. Topic API

Topics/permasalahan dapat dibuat oleh Guru.

Topic visibility:

```text
PRIVATE
SCHOOL
```

---

# 6.1 List Topics

### GET `/topics`

Allowed:

```text
TEACHER
ADMIN
```

Teacher:

```text
own PRIVATE topics
school-wide SCHOOL topics
```

---

# 6.2 Create Topic

### POST `/topics`

Allowed:

```text
TEACHER
```

Request:

```json
{
  "title": "Tekanan Akademik",
  "description": "Masalah terkait tekanan belajar",
  "visibility": "PRIVATE"
}
```

---

# 6.3 Update Topic

### PATCH `/topics/:topicId`

Allowed:

```text
creator
```

---

# 6.4 Delete Topic

### DELETE `/topics/:topicId`

Allowed:

```text
creator
```

Topic yang sudah digunakan oleh completed session sebaiknya soft-delete/inactive.

---

# 7. Teacher Dashboard API

### GET `/teacher/dashboard`

Returns:

```text
teacher profile
assigned classes
active rooms
paused games
recent history
```

---

# 8. Room API

# 8.1 List Teacher Classes

### GET `/teacher/classes`

Returns only classes assigned to authenticated teacher.

---

# 8.2 Class Detail

### GET `/teacher/classes/:classId`

Authorization:

```text
teacher must be assigned to class
```

Returns:

```text
class
assigned teachers
current room
previous sessions
```

---

# 8.3 Open Room

### POST `/classes/:classId/rooms`

Allowed:

```text
TEACHER
```

Request:

```json
{}
```

Server:

```text
verify teacher assignment
lock class
check active room
generate unique 6-character code
create room
commit
```

Code format:

```text
A-Z
0-9
```

Example:

```text
A7K2P9
```

Only one room can be OPEN per class.

---

# 8.4 Close Room

### POST `/rooms/:roomId/close`

Allowed:

```text
TEACHER
```

Only the teacher who created the room can close it.

Closed code can never be reused.

---

# 8.5 Room Status

### GET `/rooms/:roomId`

Returns:

```text
room
status
active game session
participant count
```

---

# 9. Game Session API

# 9.1 Create Game Configuration

### POST `/rooms/:roomId/game-sessions`

Allowed:

```text
TEACHER
```

Request:

```json
{
  "topicId": 5,
  "inputMode": "STUDENT",
  "gameMode": "GROUPS",
  "problemDisplayLimit": 3,
  "groupCount": 5
}
```

For all-student:

```json
{
  "gameMode": "ALL_STUDENTS",
  "groupCount": null
}
```

Only the room creator can create/configure the game.

---

# 9.2 Get Game Session

### GET `/game-sessions/:sessionId`

Returns teacher-safe full state.

---

# 9.3 Update Game Configuration

### PATCH `/game-sessions/:sessionId`

Allowed:

```text
TEACHER
```

Only before game starts.

Configuration becomes locked after:

```text
START
```

---

# 9.4 Start Game

### POST `/game-sessions/:sessionId/start`

Allowed:

```text
TEACHER
```

Server must reject START if:

```text
room closed
session already started
participants missing
problems missing
participant_count != problem_count
matching impossible
```

Critical rule:

```text
System MUST NOT start the game
unless perfect matching can be generated.
```

Start is transactional.

---

# 9.5 Pause Game

### POST `/game-sessions/:sessionId/pause`

Allowed:

```text
TEACHER
```

Current game state remains persisted.

---

# 9.6 Resume Game

### POST `/game-sessions/:sessionId/resume`

Allowed:

```text
TEACHER
```

---

# 9.7 Finish Game

### POST `/game-sessions/:sessionId/finish`

Allowed:

```text
TEACHER
```

Game becomes immutable except for permitted administrative operations.

---

# 10. Student Room API

Murid tidak login.

# 10.1 Join Room

### POST `/public/rooms/join`

Request:

```json
{
  "roomCode": "A7K2P9"
}
```

If room closed:

```text
403 ROOM_NOT_OPEN
```

Response:

```json
{
  "success": true,
  "data": {
    "roomId": 10,
    "gameSessionId": 100,
    "roomStatus": "OPEN"
  }
}
```

---

# 10.2 Register Participant

### POST `/public/game-sessions/:sessionId/participants`

Request:

```json
{
  "sessionId": "browser-session-uuid",
  "fullName": "Andi"
}
```

Server:

```text
create/reconnect participant
```

Same browser session must reconnect to existing participant.

---

# 10.3 Submit Problem

### POST `/public/game-sessions/:sessionId/problems`

Student mode only.

Request:

```json
{
  "participantSessionId": "browser-session-uuid",
  "content": "Saya merasa tertekan dengan nilai"
}
```

Server verifies:

```text
participant exists
session valid
game not started
participant has not submitted
```

One participant:

```text
one problem
```

---

# 10.4 Get Student Game State

### GET `/public/game-sessions/:sessionId/state`

Requires participant session identifier.

Response must only expose information safe for students.

Never expose:

```text
problem author
internal participant ID
matching algorithm details
teacher data
other students' private problems
```

---

# 11. Student Session Persistence

Browser stores:

```text
participantSessionId
```

Recommended:

```text
localStorage
```

or secure browser storage appropriate to implementation.

Reconnect:

```text
same participantSessionId
→ same participant
→ same group
→ same assignment
→ current game state
```

No duplicate participant should be created.

---

# 12. Group API

# 12.1 Get Groups

### GET `/game-sessions/:sessionId/groups`

Allowed:

```text
TEACHER
```

Returns:

```text
group number
members
status
current turn
```

---

# 12.2 Get Own Student Group

### GET `/public/game-sessions/:sessionId/group`

Returns only:

```text
own group
own group members
current group state
```

---

# 13. Gameplay API

Gameplay control is primarily realtime through Socket.IO.

REST is used for recovery/state synchronization.

# 13.1 Get Current Turn

### GET `/game-sessions/:sessionId/groups/:groupId/current-turn`

Allowed:

```text
TEACHER
```

Student equivalent must return only authorized group state.

---

# 13.2 Reveal Cards

### POST `/game-sessions/:sessionId/groups/:groupId/turn/reveal`

Allowed:

```text
TEACHER
```

Server:

```text
lock group
verify active turn
change card state
broadcast event
```

Only one active pair per group.

---

# 13.3 Complete Turn

### POST `/game-sessions/:sessionId/groups/:groupId/turn/complete`

Allowed:

```text
TEACHER
```

Server:

```text
mark assignment completed
mark turn completed
activate next turn when appropriate
broadcast state
```

---

# 14. History API

# 14.1 Game History

### GET `/teacher/game-sessions/:sessionId/history`

Allowed:

```text
TEACHER
```

Only the teacher who created the game session may access it.

Returns:

```text
participant
group
problem
assignment
turn
timestamps
```

Teacher can see:

```text
Andi → "Tekanan belajar"
Budi → "Masalah pertemanan"
```

Students cannot access this history.

---

# 14.2 Teacher History List

### GET `/teacher/history`

Query:

```text
?page=1
&limit=20
&classId=10
&from=2026-09-01
&to=2026-09-30
```

Returns only sessions created by authenticated teacher.

---

# 15. Authorization Matrix

| Endpoint Category | Super Admin | Admin | Teacher | Student |
|---|---:|---:|---:|---:|
| School management | ✓ | ✗ | ✗ | ✗ |
| Admin reset | ✓ | ✗ | ✗ | ✗ |
| Class management | ✗ | ✓ | Read assigned | ✗ |
| Teacher management | ✗ | ✓ | ✗ | ✗ |
| Teacher assignment | ✗ | ✓ | ✗ | ✗ |
| Topic creation | ✗ | ✗ | ✓ | ✗ |
| Room creation | ✗ | ✗ | ✓ | ✗ |
| Game configuration | ✗ | ✗ | ✓ | ✗ |
| Game control | ✗ | ✗ | ✓ | ✗ |
| Student join | ✗ | ✗ | ✗ | ✓ |
| Problem submission | ✗ | ✗ | ✗ | ✓ |
| Game state | limited | limited | full | own/group-safe |
| Game history | ✗ | ✗ | own | ✗ |

---

# 16. Error Codes

Recommended:

```text
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
AUTH_REFRESH_INVALID
AUTH_FORBIDDEN
AUTH_UNAUTHORIZED

SCHOOL_NOT_FOUND
SCHOOL_ALREADY_EXISTS
SCHOOL_ADMIN_EXISTS

CLASS_NOT_FOUND
CLASS_ALREADY_EXISTS
CLASS_ACCESS_DENIED

TEACHER_NOT_FOUND
TEACHER_ALREADY_EXISTS
TEACHER_NOT_ASSIGNED

ROOM_NOT_FOUND
ROOM_NOT_OPEN
ROOM_ALREADY_OPEN
ROOM_CODE_INVALID
ROOM_CODE_EXPIRED

GAME_SESSION_NOT_FOUND
GAME_ALREADY_STARTED
GAME_ALREADY_FINISHED
GAME_NOT_PAUSED
GAME_NOT_READY
GAME_NOT_ENOUGH_PARTICIPANTS
GAME_PROBLEM_COUNT_MISMATCH
GAME_MATCHING_FAILED
GAME_CONFIGURATION_LOCKED

PARTICIPANT_NOT_FOUND
PARTICIPANT_ALREADY_SUBMITTED
PARTICIPANT_ALREADY_FINISHED

PROBLEM_NOT_FOUND
PROBLEM_ALREADY_ASSIGNED

GROUP_NOT_FOUND
TURN_NOT_FOUND
TURN_ALREADY_ACTIVE
TURN_NOT_ACTIVE
```

---

# 17. HTTP Status Codes

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

---

# 18. Pagination

List endpoint format:

```text
?page=1&limit=20
```

Response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 125,
    "totalPages": 7
  }
}
```

Maximum recommended:

```text
limit = 100
```

---

# 19. Validation

Backend wajib melakukan validation walaupun frontend sudah melakukan validation.

Contoh:

```text
roomCode
→ exactly 6 characters
→ A-Z / 0-9

fullName
→ required
→ normalized
→ max length

problem
→ required
→ max length

groupCount
→ positive integer
→ cannot exceed participant count
```

---

# 20. Rate Limiting

Public endpoints harus memiliki rate limit terutama:

```text
POST /public/rooms/join
POST /public/game-sessions/:id/participants
POST /public/game-sessions/:id/problems
POST /auth/login
POST /auth/refresh
```

Tujuannya mencegah:

```text
brute force
room-code enumeration
spam participant
problem spam
```

---

# 21. Transaction Requirements

Transaction wajib digunakan untuk:

```text
create school + admin
reset password + revoke sessions
open room
start game
generate perfect matching
create groups
pause/resume critical state
complete turn
```

---

# 22. Security Requirements

## Password

Gunakan password hashing modern:

```text
Argon2id
```

atau bcrypt dengan cost yang sesuai resource server.

## JWT

Access token:

```text
short-lived
2 hours
```

Payload minimal:

```json
{
  "sub": "user_id",
  "role": "TEACHER",
  "schoolId": 1
}
```

Jangan memasukkan data sensitif.

## Refresh Token

Gunakan rotation.

Simpan hanya hash refresh token.

## Cookies

Refresh token:

```text
HttpOnly
Secure
SameSite=Lax/Strict
```

---

# 23. API Security Scope

Setiap protected request harus memvalidasi:

```text
authentication
role
school scope
resource ownership
resource relationship
```

Contoh:

Guru A dari School 1 tidak boleh:

```text
GET /game-sessions/School2Session
```

meskipun mengetahui ID session.

---

# 24. Idempotency

Operation kritis sebaiknya idempotent.

Contoh:

```text
START GAME
CLOSE ROOM
FINISH GAME
```

Jika request terkirim dua kali akibat network retry, server tidak boleh membuat duplicate state.

---

# 25. File Import

Teacher/Admin import menggunakan:

```text
multipart/form-data
.xlsx
```

Backend:

```text
validate file type
validate headers
validate rows
normalize data
detect duplicates
preview/validate
transactional insert
```

Untuk data besar, proses dapat dilakukan secara batch agar resource server tetap rendah.

---

# 26. API State Rules

## Room

```text
OPEN → CLOSED
```

Tidak boleh:

```text
CLOSED → OPEN
```

Room code tidak pernah digunakan kembali.

## Game

```text
WAITING → PLAYING
WAITING → CLOSED

PLAYING → PAUSED
PLAYING → FINISHED

PAUSED → PLAYING
PAUSED → FINISHED
```

Tidak boleh restart completed game.

---

# 27. Important Student Privacy Rule

Saat gameplay:

```text
Problem content → visible
Problem author → hidden
```

History:

```text
Teacher → visible
Student → inaccessible
```

---

# 28. API Contract Principle

REST API menangani:

```text
authentication
CRUD
configuration
state recovery
history
```

Socket.IO menangani:

```text
real-time participant update
participant submitted
game started
group assignment
turn activated
card revealed
turn completed
game paused
game resumed
game finished
disconnect
reconnect
```

Detail Socket.IO akan didefinisikan pada:

```text
PhillyoGo Realtime Specification
```

---

# 29. Next Document

Setelah API Specification ini, dokumen berikutnya adalah:

```text
PhillyoGo Realtime / Socket.IO Specification v1.0
```

Dokumen tersebut akan menentukan:

- connection lifecycle
- authentication Socket.IO
- rooms/namespaces
- event naming
- payload
- server authority
- reconnect
- disconnect
- group isolation
- teacher control
- card reveal synchronization
- race-condition prevention
- state recovery
- realtime error handling
