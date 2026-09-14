# PhillyoGo — Realtime / Socket.IO Specification

**Version:** 1.0  
**Status:** Realtime Baseline  
**Backend:** Express.js + Socket.IO  
**Database:** MySQL 8.x  
**Reference:** SRS v2.0, Database/ERD v2.0, API Specification v1.0

---

# 1. Tujuan

Realtime layer bertanggung jawab untuk sinkronisasi permainan tanpa polling terus-menerus.

Realtime wajib mendukung:

- siswa masuk/keluar room;
- submit masalah;
- status participant;
- START game;
- pembagian kelompok;
- perubahan game state;
- turn;
- reveal kartu;
- penyelesaian turn;
- pause/resume;
- finish;
- reconnect;
- recovery state;
- multiple group berjalan bersamaan;
- satu active card pair per group.

**Database tetap menjadi source of truth.**

Socket.IO hanya menjadi mekanisme distribusi event dan sinkronisasi client.

---

# 2. Prinsip Arsitektur

```text
React Client
     │
     │ Socket.IO
     ▼
Socket.IO Server
     │
     ├── Authorization
     ├── Validation
     ├── Transaction
     ├── MySQL
     └── Broadcast
```

Client tidak boleh mengubah game state secara authoritative.

Contoh:

```text
Client → reveal-card
Server → validate
Server → update DB
Server → emit card-revealed
```

Bukan:

```text
Client → reveal-card
Client → langsung membuka kartu
```

---

# 3. Connection Types

Terdapat dua jenis connection.

## 3.1 Teacher Connection

Guru login menggunakan JWT.

Socket handshake membawa access token.

Guru dapat:

```text
monitor game
control game
pause
resume
reveal
complete
```

---

## 3.2 Student Connection

Murid tidak login.

Murid menggunakan:

```text
participantSessionId
```

yang diperoleh ketika join room.

Student socket harus di-authorize berdasarkan:

```text
participantSessionId
gameSessionId
```

Server memverifikasi session tersebut sebelum connection diterima.

---

# 4. Socket Connection

Client:

```javascript
io(API_URL, {
  auth: {
    token: accessToken
  }
});
```

Student:

```javascript
io(API_URL, {
  auth: {
    participantSessionId,
    gameSessionId
  }
});
```

---

# 5. Socket Authentication

## Teacher

Server:

```text
verify JWT
→ validate expiration
→ identify user
→ identify role
→ identify school
```

JWT expired:

```text
socket authentication rejected
```

Client harus menggunakan REST refresh token untuk memperoleh access token baru lalu reconnect.

---

## Student

Server:

```text
find participant
→ verify game session
→ verify participant belongs to session
→ accept socket
```

Tidak ada JWT login untuk student.

---

# 6. Namespace

Recommended namespace:

```text
/game
```

Connection:

```text
wss://domain.com/game
```

REST:

```text
/api/v1
```

---

# 7. Socket Room Architecture

Socket.IO room digunakan sebagai logical broadcast channel.

Recommended rooms:

```text
game:{gameSessionId}
group:{groupId}
teacher:{userId}
participant:{participantId}
```

Contoh:

```text
game:100
group:501
participant:9001
teacher:21
```

---

# 8. Room Scope Rules

## Game Room

```text
game:{gameSessionId}
```

Digunakan untuk event yang berlaku untuk seluruh game:

```text
participant-joined
participant-status-changed
all-submitted
game-started
game-paused
game-resumed
game-finished
```

---

## Group Room

```text
group:{groupId}
```

Digunakan untuk event gameplay group.

Contoh:

```text
turn-started
cards-revealed
turn-completed
```

Event Group A tidak boleh masuk ke Group B.

---

## Participant Room

```text
participant:{participantId}
```

Digunakan untuk private event:

```text
your-group-assigned
your-session-restored
private-state-update
```

---

## Teacher Room

```text
teacher:{userId}
```

Opsional untuk beberapa event private kepada Guru.

---

# 9. Event Naming Convention

Gunakan kebab-case.

Server → client:

```text
room-state
participant-joined
participant-status-changed
problem-submitted
all-participants-ready
game-started
groups-assigned
game-paused
game-resumed
turn-started
cards-revealed
turn-completed
game-finished
state-snapshot
server-error
```

Client → server:

```text
join-game
request-state
reveal-cards
complete-turn
pause-game
resume-game
finish-game
```

Untuk action penting, server harus tetap memvalidasi role dan ownership.

---

# 10. Initial Connection Flow — Teacher

```text
Teacher Login
     ↓
JWT
     ↓
Socket Connect
     ↓
JWT Verification
     ↓
Teacher Identified
     ↓
Teacher joins game room
     ↓
Server sends state-snapshot
```

---

# 11. Initial Connection Flow — Student

```text
Student enters room code
     ↓
REST join room
     ↓
Participant created
     ↓
participantSessionId returned
     ↓
Student opens Socket.IO
     ↓
Server validates participant
     ↓
Join game room
     ↓
Join group room if assigned
     ↓
state-snapshot
```

---

# 12. Participant Join Event

Event:

```text
participant-joined
```

Payload:

```json
{
  "participantId": "9001",
  "displayName": "Andi",
  "status": "CONNECTED",
  "joinedAt": "2026-09-01T08:00:00Z"
}
```

Broadcast:

```text
game:{gameSessionId}
```

Teacher dapat melihat identitas.

Student client hanya boleh menerima informasi yang memang diperlukan oleh UI.

---

# 13. Participant Status

Status:

```text
CONNECTED
DISCONNECTED
FINISHED
```

Ketika socket disconnect:

```text
CONNECTED
   ↓
DISCONNECTED
```

Server update database.

Jangan langsung menghapus participant.

---

# 14. Reconnect

Reconnect harus menggunakan:

```text
same participantSessionId
```

Flow:

```text
disconnect
    ↓
reconnect
    ↓
validate same session
    ↓
restore participant
    ↓
restore group
    ↓
restore assignment
    ↓
restore current turn
    ↓
send state-snapshot
```

Participant tidak mendapatkan assignment baru.

---

# 15. State Snapshot

Event:

```text
state-snapshot
```

Contoh student response:

```json
{
  "gameSession": {
    "id": 100,
    "status": "PLAYING",
    "gameMode": "GROUPS"
  },
  "participant": {
    "id": 9001,
    "status": "CONNECTED"
  },
  "group": {
    "id": 501,
    "groupNumber": 1
  },
  "currentTurn": {
    "turnNumber": 4,
    "status": "ACTIVE",
    "participantCard": "HIDDEN",
    "problemCard": "HIDDEN"
  }
}
```

Student tidak menerima:

```text
problem author
other group's assignment
unnecessary internal IDs
teacher-only history
```

---

# 16. Problem Submission

Student emits:

```text
submit-problem
```

Payload:

```json
{
  "participantSessionId": "uuid",
  "content": "Saya merasa kesulitan mengikuti pelajaran."
}
```

Server:

```text
validate participant
validate session
validate game status
validate duplicate
save problem
commit
broadcast problem-submitted
```

---

# 17. Problem Submitted Event

Event:

```text
problem-submitted
```

Teacher payload:

```json
{
  "participantId": "9001",
  "displayName": "Andi",
  "submitted": true,
  "submittedAt": "2026-09-01T08:05:00Z"
}
```

Teacher dapat melihat siapa yang sudah submit.

Student tidak perlu menerima identitas/problem student lain.

---

# 18. All Participants Ready

Ketika:

```text
submitted_count == participant_count
```

Server emits:

```text
all-participants-ready
```

Payload:

```json
{
  "participantCount": 30,
  "problemCount": 30,
  "ready": true
}
```

Ini hanya readiness indicator.

Game belum dimulai sampai Guru melakukan START.

---

# 19. START Game

Guru:

```text
start-game
```

Server harus melakukan transaction.

```text
BEGIN

lock game session

validate room
validate teacher ownership
validate all participants
validate all problems
validate count equality
generate groups
generate perfect matching
validate matching
create assignments
create turns
update session = PLAYING

COMMIT
```

Jika gagal:

```text
ROLLBACK
```

Tidak boleh mengirim:

```text
game-started
```

sebelum transaction berhasil.

---

# 20. Game Started Event

Event:

```text
game-started
```

Payload umum:

```json
{
  "gameSessionId": 100,
  "status": "PLAYING",
  "gameMode": "GROUPS"
}
```

Untuk student, server mengirim group mereka secara private.

---

# 21. Groups Assigned

Event:

```text
groups-assigned
```

Teacher payload:

```json
{
  "groups": [
    {
      "groupId": 501,
      "groupNumber": 1,
      "memberCount": 6
    },
    {
      "groupId": 502,
      "groupNumber": 2,
      "memberCount": 6
    }
  ]
}
```

Student:

```text
your-group-assigned
```

Payload:

```json
{
  "groupId": 501,
  "groupNumber": 1,
  "memberCount": 6
}
```

---

# 22. All-Student Mode

Jika:

```text
gameMode = ALL_STUDENTS
```

Tidak perlu membuat multiple game groups.

Semua participant menggunakan satu shared gameplay scope.

Logical group dapat menggunakan:

```text
groupId = null
```

atau satu default game group.

---

# 23. Group Mode

Jika:

```text
gameMode = GROUPS
```

Setiap group:

```text
memiliki state sendiri
memiliki assignment sendiri
memiliki turn sendiri
```

Contoh:

```text
Group 1 → Turn 5 ACTIVE
Group 2 → Turn 3 ACTIVE
Group 3 → Turn 7 ACTIVE
```

Semua dapat berjalan bersamaan.

---

# 24. One Active Pair Per Group

Rule:

```text
1 group
→ max 1 active turn
→ max 1 active participant card
→ max 1 active problem card
```

Database transaction + row lock wajib digunakan.

---

# 25. Turn Start

Event:

```text
turn-started
```

Payload:

```json
{
  "groupId": 501,
  "turnNumber": 5,
  "participantCard": "HIDDEN",
  "problemCard": "HIDDEN"
}
```

Kartu awalnya selalu tertutup.

---

# 26. Card State

Initial:

```text
participantCard = HIDDEN
problemCard = HIDDEN
```

Setelah reveal:

```text
participantCard = REVEALED
problemCard = REVEALED
```

Tidak ada state partial reveal kecuali memang diperlukan UI.

Kedua kartu merupakan satu pasangan.

---

# 27. Reveal Cards

Teacher emits:

```text
reveal-cards
```

Payload:

```json
{
  "gameSessionId": 100,
  "groupId": 501,
  "turnId": 900
}
```

Server:

```text
authenticate teacher
validate ownership
lock group
validate turn active
validate cards hidden
update turn
commit
broadcast cards-revealed
```

---

# 28. Cards Revealed Event

Event:

```text
cards-revealed
```

Payload untuk student:

```json
{
  "groupId": 501,
  "turnNumber": 5,
  "participant": {
    "displayName": "Andi"
  },
  "problem": {
    "content": "Saya merasa tertekan dengan nilai."
  }
}
```

Untuk student:

```text
problem author MUST NOT be included.
```

Teacher history dapat mengetahui hubungan asli melalui REST history endpoint.

---

# 29. Anonymous Problem Display

Database:

```text
problem.participant_id
```

tetap tersimpan.

Teacher:

```text
boleh melihat
```

Student gameplay:

```text
tidak boleh melihat
```

Socket payload harus dibuat berbeda berdasarkan recipient.

---

# 30. Complete Turn

Teacher emits:

```text
complete-turn
```

Server:

```text
lock group
lock assignment
validate active turn
mark assignment COMPLETED
mark turn COMPLETED
create/activate next turn
commit
broadcast
```

---

# 31. Turn Completed Event

Event:

```text
turn-completed
```

Payload:

```json
{
  "groupId": 501,
  "turnNumber": 5,
  "completed": true,
  "nextTurn": 6
}
```

Kemudian:

```text
turn-started
```

untuk turn berikutnya jika masih tersedia.

---

# 32. Group Completion

Jika seluruh assignment group selesai:

```text
group status = FINISHED
```

Event:

```text
group-finished
```

Payload:

```json
{
  "groupId": 501,
  "completedAssignments": 6,
  "totalAssignments": 6
}
```

---

# 33. Game Completion

Jika seluruh group selesai:

```text
game session = FINISHED
```

Event:

```text
game-finished
```

Payload:

```json
{
  "gameSessionId": 100,
  "status": "FINISHED",
  "finishedAt": "2026-09-01T09:30:00Z"
}
```

---

# 34. Pause

Teacher emits:

```text
pause-game
```

Server validates:

```text
teacher ownership
game PLAYING
```

Database:

```text
PLAYING → PAUSED
```

Broadcast:

```text
game-paused
```

Payload:

```json
{
  "gameSessionId": 100,
  "status": "PAUSED"
}
```

Current assignment/turn tidak dihapus.

---

# 35. Resume

Teacher emits:

```text
resume-game
```

Server:

```text
PAUSED → PLAYING
```

Broadcast:

```text
game-resumed
```

Client kemudian melakukan state synchronization bila diperlukan.

---

# 36. Disconnect

Socket disconnect:

```text
server detects disconnect
```

Update:

```text
participant.status = DISCONNECTED
```

Broadcast:

```text
participant-status-changed
```

Payload:

```json
{
  "participantId": "9001",
  "status": "DISCONNECTED"
}
```

Assignment tetap tersimpan.

---

# 37. Teacher Disconnect

Jika Guru disconnect:

```text
game state tetap berjalan atau tetap paused
```

Game tidak boleh rusak karena koneksi Guru terputus.

Guru dapat login kembali dan reconnect.

State diambil dari database.

---

# 38. Race Conditions

Critical events harus menggunakan locking.

Terutama:

```text
START
PAUSE
RESUME
REVEAL
COMPLETE TURN
FINISH
```

Contoh:

```text
Teacher double-click START

Request A → lock
Request B → waiting

Request A → success
Request B → sees PLAYING
Request B → reject
```

---

# 39. Duplicate Events

Client mungkin mengirim event dua kali karena network retry.

Server harus melakukan idempotency check.

Contoh:

```text
complete-turn(turnId)
```

Jika turn sudah:

```text
COMPLETED
```

server tidak boleh membuat turn completion kedua.

---

# 40. Server Authority

Server authoritative terhadap:

```text
room status
game status
participant status
group
assignment
problem ownership
turn
card state
game completion
```

Client hanya authoritative terhadap:

```text
local UI state
animation state
temporary input
```

---

# 41. Animation Synchronization

Karena UI menggunakan animasi kartu:

```text
HIDDEN
   ↓
REVEALED
```

Server event:

```text
cards-revealed
```

menjadi trigger untuk animasi.

Client tidak boleh menganggap animasi selesai berarti server state sudah berubah.

Urutan:

```text
Server DB update
      ↓
Socket event
      ↓
Client receives
      ↓
Client animation
```

---

# 42. Realtime + REST Recovery

Socket.IO bukan satu-satunya source untuk recovery.

Jika client:

```text
missed event
```

client dapat:

```text
GET /public/game-sessions/:id/state
```

atau endpoint teacher state.

Flow:

```text
Socket reconnect
      ↓
request state
      ↓
REST / server snapshot
      ↓
replace local state
      ↓
resume realtime
```

---

# 43. Event Ordering

Server harus menggunakan database state/version untuk menghindari stale event.

Recommended:

```text
stateVersion
```

pada game state atau event payload.

Contoh:

```json
{
  "gameSessionId": 100,
  "stateVersion": 48,
  "event": "cards-revealed"
}
```

Client menolak/menangani event yang lebih lama dari state saat ini.

---

# 44. Recommended Event Envelope

Gunakan format:

```json
{
  "eventId": "uuid",
  "event": "cards-revealed",
  "timestamp": "2026-09-01T09:00:00Z",
  "stateVersion": 48,
  "data": {}
}
```

`eventId` membantu debugging dan deduplication.

---

# 45. Error Event

Event:

```text
server-error
```

Payload:

```json
{
  "event": "reveal-cards",
  "code": "TURN_ALREADY_REVEALED",
  "message": "This turn has already been revealed."
}
```

Jangan mengirim stack trace ke client.

---

# 46. Security

Socket event wajib memvalidasi authorization.

Jangan percaya:

```text
groupId
gameSessionId
teacherId
participantId
```

yang dikirim client.

Server harus mengambil relationship dari database.

Contoh:

```text
Teacher sends groupId = 9999

Server:
Does this group belong to game?
Does game belong to teacher?
Does teacher own session?

No → reject
```

---

# 47. School Isolation

Socket authorization juga harus memastikan:

```text
teacher.school_id
==
gameSession.school_id
```

dan:

```text
teacher is assigned to class
```

---

# 48. Student Isolation

Student socket hanya boleh mengakses:

```text
gameSession tempat participant terdaftar
group tempat participant berada
```

Tidak boleh subscribe ke:

```text
group lain
```

meskipun client mencoba memanggil `join-group` secara manual.

---

# 49. Reconnect State Priority

Saat reconnect:

```text
Database
   ↓
current game session
   ↓
participant
   ↓
group
   ↓
assignment
   ↓
active turn
```

Bukan berdasarkan local state lama.

Local state hanya digunakan untuk UX sementara.

---

# 50. Connection Heartbeat

Gunakan Socket.IO heartbeat bawaan.

Jangan membuat polling application-level yang agresif.

Tujuan:

```text
minimize resource
detect dead connections
support reconnect
```

---

# 51. Resource Efficiency

Karena sistem harus hemat resource:

- Jangan melakukan polling setiap detik.
- Gunakan Socket.IO event-driven updates.
- Hindari broadcast seluruh game state setiap event.
- Kirim delta event jika cukup.
- Gunakan state snapshot hanya saat initial connection/recovery.
- Jangan membuat Socket.IO namespace per participant.
- Gunakan room yang sudah ditentukan.
- Query database hanya ketika state perlu diubah/divalidasi.
- Gunakan index yang sudah ditentukan pada ERD.
- Jangan menyimpan state game besar di memory server sebagai source of truth.

---

# 52. Horizontal Scaling

Untuk deployment awal satu instance:

```text
Express
+
Socket.IO
+
MySQL
```

sudah cukup.

Jika nantinya lebih dari satu backend instance:

```text
Load Balancer
      ↓
Backend 1
Backend 2
Backend 3
      ↓
Redis Adapter
      ↓
MySQL
```

Socket.IO Redis adapter baru diperlukan ketika realtime connection tersebar di beberapa instance.

Tidak perlu menambahkan Redis pada MVP jika belum diperlukan.

---

# 53. Event Matrix

| Event | Sender | Scope | DB Write |
|---|---|---|---:|
| join-game | Client | Server | ✓ |
| participant-joined | Server | Game | ✓ |
| submit-problem | Student | Server | ✓ |
| problem-submitted | Server | Game | ✓ |
| all-participants-ready | Server | Game | ✗ |
| start-game | Teacher | Server | ✓ |
| game-started | Server | Game | ✓ |
| groups-assigned | Server | Game | ✓ |
| turn-started | Server | Group | ✓ |
| reveal-cards | Teacher | Server | ✓ |
| cards-revealed | Server | Group | ✓ |
| complete-turn | Teacher | Server | ✓ |
| turn-completed | Server | Group | ✓ |
| pause-game | Teacher | Server | ✓ |
| game-paused | Server | Game | ✓ |
| resume-game | Teacher | Server | ✓ |
| game-resumed | Server | Game | ✓ |
| finish-game | Teacher | Server | ✓ |
| game-finished | Server | Game | ✓ |
| state-snapshot | Server | Private | ✗ |

---

# 54. Critical Invariants

Realtime implementation tidak boleh melanggar:

```text
1. Satu participant hanya satu session per game.
2. Reconnect tidak membuat participant baru.
3. Assignment tidak berubah saat reconnect.
4. Group tidak berubah saat reconnect.
5. Satu group hanya satu active turn.
6. Satu turn hanya satu pair kartu.
7. Problem author tidak dikirim ke student.
8. Game tidak START sebelum perfect matching berhasil.
9. Group berbeda dapat bermain bersamaan.
10. Teacher tetap menjadi controller.
11. Database adalah source of truth.
12. Socket.IO hanya mendistribusikan state/event.
13. Closed room tidak dapat digunakan.
14. Game pause tidak menghapus progress.
15. Finished game tidak dapat dimainkan kembali.
```

---

# 55. Recommended Backend Modules

```text
src/
├── modules/
│   ├── auth/
│   ├── schools/
│   ├── users/
│   ├── classes/
│   ├── teachers/
│   ├── topics/
│   ├── rooms/
│   ├── participants/
│   ├── problems/
│   ├── groups/
│   ├── assignments/
│   ├── games/
│   └── history/
│
├── realtime/
│   ├── socket.js
│   ├── middleware.js
│   ├── rooms.js
│   ├── events/
│   └── handlers/
│
├── middleware/
├── database/
└── utils/
```

---

# 56. Testing Requirements

Realtime wajib dites untuk:

## Connection

```text
teacher connect
student connect
invalid token
expired token
invalid participant session
```

## Reconnect

```text
disconnect
reconnect
same participant
same group
same assignment
same turn
```

## Race Condition

```text
double START
double REVEAL
double COMPLETE
simultaneous group turns
```

## Privacy

```text
student cannot see author
student cannot see other group state
student cannot access history
```

## Group Concurrency

```text
Group A reveal
Group B remains independent
Group C can complete simultaneously
```

---

# 57. Next Document

Setelah Realtime Specification, dokumen berikutnya:

```text
PhillyoGo Game State Machine & Perfect Matching Specification
```

Dokumen tersebut akan menjadi dasar implementasi logic game, khususnya:

```text
participant lifecycle
game lifecycle
group lifecycle
turn lifecycle
card lifecycle
perfect matching algorithm
matching validation
pause/resume
completion
```

