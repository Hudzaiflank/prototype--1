# PhillyoGo — Game State Machine & Perfect Matching Specification

**Version:** 1.0  
**Status:** Game Logic Baseline  
**Reference:** SRS v2.0, Database/ERD v2.0, API v1.0, Realtime/Socket.IO v1.0

---

# 1. Tujuan

Dokumen ini mengunci aturan inti permainan PhillyoGo.

Fokus:

- lifecycle room;
- lifecycle game session;
- lifecycle participant;
- lifecycle group;
- lifecycle assignment;
- lifecycle turn;
- lifecycle card;
- perfect matching;
- randomization;
- fairness;
- pause/resume;
- reconnect;
- completion;
- invalid state prevention.

Dokumen ini harus dianggap sebagai **single source of truth untuk game logic**.

---

# 2. Konsep Dasar Permainan

Satu game terdiri dari:

```text
N Participant
N Problem
N Assignment
N Turn
```

Setiap participant mendapatkan tepat satu problem.

Setiap problem diberikan tepat satu kali.

Constraint utama:

```text
participant != problem.author
```

untuk problem yang dibuat oleh murid.

Contoh:

```text
A menulis Problem A
B menulis Problem B
C menulis Problem C

Valid:
A → B
B → C
C → A
```

Tidak valid:

```text
A → A
```

---

# 3. Game Modes

## 3.1 ALL_STUDENTS

Semua peserta bermain bersama.

```text
1 game
1 shared gameplay scope
1 active pair pada satu waktu
```

Guru tetap menjadi controller.

---

## 3.2 GROUPS

Peserta dibagi menjadi beberapa group.

```text
Group 1 → game state sendiri
Group 2 → game state sendiri
Group 3 → game state sendiri
```

Setiap group:

```text
1 active pair pada satu waktu
```

Tetapi group berbeda dapat bermain bersamaan.

---

# 4. State Machine — Room

```text
OPEN
  │
  │ close
  ▼
CLOSED
```

Allowed:

```text
OPEN → CLOSED
```

Forbidden:

```text
CLOSED → OPEN
CLOSED → CLOSED
```

Room code yang sudah CLOSED tidak boleh digunakan kembali.

---

# 5. State Machine — Game Session

```text
                ┌──────────────┐
                │   WAITING    │
                └──────┬───────┘
                       │ START
                       ▼
                ┌──────────────┐
                │   PLAYING    │
                └───┬──────┬───┘
                    │      │
                  PAUSE   FINISH
                    │      │
                    ▼      ▼
              ┌────────┐ ┌──────────┐
              │ PAUSED │ │ FINISHED │
              └───┬────┘ └──────────┘
                  │
                RESUME
                  │
                  ▼
              PLAYING
```

Allowed transitions:

```text
WAITING → PLAYING
WAITING → CLOSED

PLAYING → PAUSED
PLAYING → FINISHED

PAUSED → PLAYING
PAUSED → FINISHED
```

---

# 6. WAITING State

Pada WAITING:

```text
student dapat join
student dapat submit problem
teacher dapat melihat participant
teacher dapat melihat submission progress
teacher dapat mengubah konfigurasi
```

Game belum berjalan.

---

# 7. START Preconditions

START hanya boleh berhasil jika:

```text
room.status == OPEN
game.status == WAITING
participant_count > 0
submitted_count == participant_count
problem_count == participant_count
```

Dan:

```text
perfect matching berhasil dibuat
```

Jika salah satu gagal:

```text
START rejected
```

Tidak boleh game berubah menjadi PLAYING.

---

# 8. Perfect Matching Requirement

Untuk N participant:

```text
N participant
N problem
N assignment
```

Matching harus memenuhi:

```text
∀ participant:
    exactly 1 problem

∀ problem:
    exactly 1 participant

student-generated problem:
    assigned participant != problem author
```

---

# 9. Matching Problem

Secara matematis:

```text
P = {p1, p2, ..., pn}
Q = {q1, q2, ..., qn}
```

Cari bijection:

```text
f: P → Q
```

dengan constraint:

```text
f(pi) != qi
```

untuk problem yang dibuat participant `pi`.

Ini merupakan **perfect matching pada bipartite graph** dengan forbidden self-edge.

---

# 10. Recommended Matching Algorithm

Untuk kasus PhillyoGo, gunakan pendekatan:

```text
Randomized Derangement
```

dengan validation.

Basic strategy:

```text
1. Shuffle participants.
2. Shuffle problems.
3. Pair by index.
4. Check forbidden self-match.
5. If invalid, repair using swaps.
6. Validate entire matching.
7. If repair fails, retry.
8. Maximum retry threshold.
```

Namun implementasi production harus tetap memiliki deterministic fallback.

---

# 11. Safer Matching Strategy

Recommended:

```text
Build bipartite graph
```

Node kiri:

```text
participants
```

Node kanan:

```text
problems
```

Edge:

```text
participant → problem
```

Hanya dibuat jika assignment valid.

Contoh:

```text
P1 → PR2
P1 → PR3
P2 → PR1
P2 → PR3
P3 → PR1
P3 → PR2
```

Kemudian jalankan:

```text
maximum bipartite matching
```

Jika matching size:

```text
== N
```

maka perfect matching exists.

Jika:

```text
< N
```

maka START ditolak.

---

# 12. Randomization

Matching harus diacak.

Tujuan:

```text
tidak predictable
tidak selalu sama
fair
```

Randomization dilakukan server-side.

Gunakan cryptographically secure random source yang tersedia pada runtime Node.js bila memungkinkan.

Jangan menggunakan:

```text
Math.random()
```

untuk security-sensitive randomization.

---

# 13. Matching Fairness

Fairness berarti:

```text
setiap participant
→ tepat satu assignment

setiap problem
→ tepat satu assignment

tidak ada self-problem

urutan assignment
→ randomized
```

Sistem tidak boleh:

```text
memberi participant tertentu dua assignment
```

atau:

```text
membiarkan problem tidak digunakan
```

---

# 14. Matching Must Be Atomic

Matching generation + persistence harus berada dalam transaction.

```text
BEGIN
   ↓
lock game session
   ↓
validate
   ↓
generate matching
   ↓
validate matching
   ↓
insert assignments
   ↓
insert turns
   ↓
PLAYING
   ↓
COMMIT
```

Jika error:

```text
ROLLBACK
```

---

# 15. Assignment State

```text
PENDING
   │
   │ turn activated
   ▼
ACTIVE
   │
   │ complete
   ▼
COMPLETED
```

Tidak boleh:

```text
COMPLETED → ACTIVE
```

---

# 16. Assignment Invariants

Dalam satu game session:

```text
UNIQUE(session, participant)
UNIQUE(session, problem)
```

Sehingga:

```text
1 participant → 1 assignment
1 problem → 1 assignment
```

---

# 17. Group Creation

Group hanya dibuat jika:

```text
gameMode == GROUPS
```

Jumlah group ditentukan Guru.

Validasi:

```text
groupCount >= 1
groupCount <= participantCount
```

---

# 18. Fair Group Distribution

Peserta diacak terlebih dahulu.

Kemudian dibagi merata.

Contoh:

```text
30 participants
5 groups

6 / 6 / 6 / 6 / 6
```

Contoh:

```text
29 participants
5 groups

6 / 6 / 6 / 6 / 5
```

Selisih ukuran group maksimal:

```text
1
```

---

# 19. Group Assignment Must Be Stable

Setelah group dibuat:

```text
participant → group
```

tidak berubah selama session.

Reconnect:

```text
same participant
→ same group
```

Pause:

```text
same group
```

Resume:

```text
same group
```

---

# 20. Group State Machine

```text
WAITING
   │
   │ first turn
   ▼
PLAYING
   │
   ├── PAUSE → PAUSED
   │              │
   │            RESUME
   │              │
   │              ▼
   │           PLAYING
   │
   └── all turns complete
                  │
                  ▼
               FINISHED
```

---

# 21. Turn State Machine

```text
PENDING
   │
   │ activate
   ▼
ACTIVE
   │
   │ complete
   ▼
COMPLETED
```

Only one:

```text
ACTIVE turn
```

per group.

---

# 22. Turn Number

Turn number dimulai:

```text
1
```

Contoh:

```text
Group 1:
Turn 1
Turn 2
Turn 3
...
Turn N
```

Sequence tidak boleh berubah setelah game dimulai.

---

# 23. Card State Machine

Setiap turn mempunyai dua kartu:

```text
Participant Card
Problem Card
```

Initial:

```text
HIDDEN
```

Reveal:

```text
HIDDEN → REVEALED
```

Tidak boleh:

```text
REVEALED → HIDDEN
```

selama turn yang sama.

---

# 24. Card Pair Rule

Satu turn selalu mewakili:

```text
1 participant
+
1 problem
```

Keduanya merupakan satu pasangan.

Jika card reveal dilakukan:

```text
participant card → reveal
problem card → reveal
```

Tidak boleh mengambil participant dari assignment A dan problem dari assignment B.

---

# 25. One Active Pair

Dalam satu group:

```text
max 1 active turn
```

Artinya:

```text
Group 1
→ Turn 4 ACTIVE

Group 1 tidak boleh:
→ Turn 5 ACTIVE
```

Tetapi:

```text
Group 2
→ Turn 2 ACTIVE
```

boleh bersamaan.

---

# 26. Card Animation Contract

Frontend menerima:

```text
cards-revealed
```

Setelah database sudah berhasil diperbarui.

Urutan:

```text
DB update
   ↓
commit
   ↓
Socket event
   ↓
frontend receives
   ↓
card flip animation
```

Animation tidak boleh menjadi sumber state.

---

# 27. Student View

Saat card belum dibuka:

```text
┌─────────────┐   ┌─────────────┐
│             │   │             │
│    CARD     │   │    CARD     │
│   BACK      │   │   BACK      │
│             │   │             │
└─────────────┘   └─────────────┘
```

Student tidak mengetahui:

```text
participant
problem
author
```

sebelum reveal.

---

# 28. Student View After Reveal

```text
┌─────────────┐   ┌──────────────────────┐
│   ANDI      │   │ Saya merasa tertekan │
│             │   │ dengan nilai...      │
└─────────────┘   └──────────────────────┘
```

Problem author tetap anonymous.

---

# 29. Teacher View

Teacher dapat melihat:

```text
current participant
current problem
problem author
group
assignment
history
```

Teacher memiliki akses penuh terhadap game yang dibuatnya.

---

# 30. Problem Display Limit

Guru mengatur:

```text
problemDisplayLimit
```

Nilai ini menentukan jumlah problem/informasi yang dapat ditampilkan pada UI siswa sesuai desain game.

Rule:

```text
server stores configuration
student UI follows server state
```

Client tidak boleh menaikkan limit sendiri.

---

# 31. Student Input Mode

Jika:

```text
inputMode = STUDENT
```

Setiap student wajib mengirim:

```text
fullName
problem
```

Game tidak dapat START sebelum semua participant submit.

---

# 32. Teacher Input Mode

Jika:

```text
inputMode = TEACHER
```

Guru menginput:

```text
student name
problem
```

Jumlah problem harus tetap:

```text
problem_count == participant_count
```

---

# 33. Problem Ownership

Problem memiliki author:

```text
participant_id
```

Walaupun ditampilkan anonymous saat gameplay.

Constraint:

```text
participant cannot receive own problem
```

---

# 34. Duplicate Student Names

Nama siswa boleh sama.

Contoh:

```text
Andi
Andi
```

Sistem tidak menggunakan nama sebagai unique identifier.

Identifier:

```text
participant.id
session_uuid
```

Jika UI perlu membedakan nama yang sama, gunakan internal participant identity tanpa mengekspos informasi sensitif.

---

# 35. Participant Lifecycle

```text
JOIN
 ↓
CONNECTED
 ↓
DISCONNECTED
 ↓
CONNECTED
 ↓
FINISHED
```

Disconnect tidak menghapus:

```text
assignment
group
problem
history
```

---

# 36. Reconnect

Jika session UUID sama:

```text
restore participant
```

Restore:

```text
name
problem submission
group
assignment
current turn
```

Tidak boleh:

```text
create new participant
```

---

# 37. Pause Behavior

Saat pause:

```text
gameSession = PAUSED
```

Current turn tetap:

```text
ACTIVE
```

atau state terakhir yang telah persisted.

Tidak ada assignment ulang.

Tidak ada group reshuffle.

Tidak ada matching ulang.

---

# 38. Resume Behavior

Saat resume:

```text
PAUSED → PLAYING
```

Gameplay melanjutkan dari state terakhir.

Contoh:

```text
Group 1
completed turns: 1-4
current turn: 5
```

Pause:

```text
turn 5 remains stateful
```

Resume:

```text
continue turn 5
```

---

# 39. Finish Behavior

Game selesai jika:

```text
all assignments COMPLETED
```

Untuk GROUPS:

```text
all groups FINISHED
```

Kemudian:

```text
gameSession = FINISHED
```

---

# 40. Finished State

Setelah FINISHED:

```text
no new participant
no new problem
no new assignment
no new turn
no restart
```

Teacher dapat:

```text
view history
```

---

# 41. History

History menyimpan:

```text
participant
problem
assignment
group
turn
timestamp
```

History hanya dapat diakses oleh:

```text
teacher yang membuat game
```

Student:

```text
DENIED
```

---

# 42. Game Session Isolation

Semua game session independen.

```text
Session A
≠
Session B
```

Assignment dari Session A tidak boleh digunakan di Session B.

---

# 43. Room Isolation

Room code:

```text
globally unique
```

Room hanya terkait satu class.

Teacher harus memiliki assignment ke class tersebut.

---

# 44. Teacher Ownership

Teacher hanya dapat mengontrol:

```text
game session yang dibuatnya
```

Teacher lain dalam class yang sama tidak otomatis mendapatkan control.

Ini konsisten dengan rule:

```text
setiap Guru membuat game sendiri.
```

---

# 45. Multiple Teachers

Satu class dapat memiliki:

```text
Teacher A
Teacher B
Teacher C
```

Masing-masing dapat membuat:

```text
Game Session A
Game Session B
Game Session C
```

Tetapi masing-masing game memiliki ownership sendiri.

---

# 46. State Version

Setiap perubahan state penting sebaiknya meningkatkan:

```text
stateVersion
```

Contoh:

```text
version 41
→ reveal
version 42
```

Digunakan untuk:

```text
stale event detection
reconnect
state recovery
debugging
```

---

# 47. State Snapshot

Snapshot minimum harus dapat merekonstruksi:

```text
game status
participant status
group
assignment
current turn
card state
```

Jika Socket.IO event terlewat:

```text
GET state
```

dapat mengembalikan current authoritative state.

---

# 48. Concurrency

Contoh:

```text
Group 1 → reveal
Group 2 → reveal
```

Keduanya boleh diproses bersamaan jika resource berbeda.

Tetapi:

```text
Group 1 → reveal
Group 1 → reveal
```

request kedua harus ditolak/idempotent.

---

# 49. Transaction Locks

Gunakan database locking pada resource kritis:

```text
game_session
group
turn
assignment
```

terutama pada:

```text
START
REVEAL
COMPLETE
PAUSE
RESUME
FINISH
```

---

# 50. No Partial Game Start

Jika:

```text
matching generated
but database insert fails
```

hasil:

```text
ROLLBACK
```

Tidak boleh:

```text
game PLAYING
assignments incomplete
```

---

# 51. Matching Failure

Jika perfect matching tidak ditemukan:

```text
GAME_MATCHING_FAILED
```

Game tetap:

```text
WAITING
```

Guru mendapatkan error yang dapat dipahami.

Tidak boleh:

```text
PARTIAL MATCHING
```

---

# 52. Why Perfect Matching Is Mandatory

Tanpa perfect matching:

```text
participant bisa tidak mendapat problem
```

atau:

```text
problem tidak mendapat participant
```

Hal tersebut melanggar fairness.

Karena itu:

```text
START = impossible without perfect matching
```

---

# 53. End-to-End Game Flow

```text
Teacher Login
      ↓
Open Room
      ↓
Configure Game
      ↓
Students Join
      ↓
Students Submit Problem
      ↓
All Participants Ready
      ↓
Teacher START
      ↓
Validate
      ↓
Create Groups if needed
      ↓
Generate Perfect Matching
      ↓
Persist Assignments
      ↓
Create Turns
      ↓
PLAYING
      ↓
Turn Active
      ↓
Cards Hidden
      ↓
Teacher Reveal
      ↓
Cards Revealed
      ↓
Discussion / Gameplay
      ↓
Teacher Complete Turn
      ↓
Next Turn
      ↓
Repeat
      ↓
All Assignments Completed
      ↓
FINISHED
      ↓
History Available
```

---

# 54. Group Mode Flow

```text
30 Students
    ↓
Teacher chooses 5 groups
    ↓
Shuffle
    ↓
6 / 6 / 6 / 6 / 6
    ↓
Perfect Matching
    ↓
Assignments
    ↓
Group-specific turns
```

Parallel:

```text
Group 1 → Turn 3
Group 2 → Turn 1
Group 3 → Turn 5
Group 4 → Turn 2
Group 5 → Turn 4
```

Semua valid.

---

# 55. All-Student Mode Flow

```text
30 Students
    ↓
No group split
    ↓
Perfect Matching
    ↓
30 assignments
    ↓
Shared turn sequence
    ↓
One active pair
    ↓
Next pair
    ↓
...
    ↓
Finished
```

---

# 56. Game Logic Invariants

Implementasi dianggap benar hanya jika semua invariant berikut selalu benar:

```text
I1:
participant count == problem count sebelum START

I2:
assignment count == participant count setelah matching

I3:
setiap participant memiliki maksimal satu assignment

I4:
setiap problem memiliki maksimal satu assignment

I5:
student tidak menerima problem miliknya sendiri

I6:
setiap group memiliki maksimal satu active turn

I7:
reconnect tidak membuat participant baru

I8:
group membership tidak berubah setelah assignment

I9:
matching tidak berubah setelah game dimulai

I10:
finished assignment tidak dapat diaktifkan kembali

I11:
student tidak dapat melihat problem author

I12:
student tidak dapat melihat teacher history

I13:
group A tidak menerima gameplay state group B

I14:
game tidak PLAYING tanpa successful perfect matching

I15:
closed room tidak dapat menerima participant baru
```

---

# 57. Edge Cases

## 57.1 Student disconnect sebelum START

```text
status = DISCONNECTED
```

Teacher harus memastikan readiness sesuai policy.

START tidak boleh dilakukan jika participant belum memenuhi requirement.

---

## 57.2 Student disconnect setelah START

Assignment tetap.

Saat reconnect:

```text
restore state
```

---

## 57.3 Teacher disconnect saat PLAYING

Game state tetap tersimpan.

Teacher dapat reconnect.

---

## 57.4 Teacher disconnect saat PAUSED

Game tetap PAUSED.

---

## 57.5 Double START

Request pertama:

```text
success
```

Request kedua:

```text
GAME_ALREADY_STARTED
```

---

## 57.6 Double REVEAL

Request pertama:

```text
success
```

Request kedua:

```text
TURN_ALREADY_REVEALED
```

---

## 57.7 Double COMPLETE

Request kedua:

```text
TURN_ALREADY_COMPLETED
```

---

# 58. Resource Constraints

Game logic harus dirancang hemat resource.

Jangan:

```text
generate entire game state repeatedly
```

Gunakan:

```text
persisted state
indexed queries
targeted locks
event-driven realtime
```

Matching dilakukan:

```text
sekali saat START
```

bukan setiap turn.

Group distribution dilakukan:

```text
sekali saat START
```

bukan setiap reconnect.

---

# 59. Algorithm Testing

Perfect matching wajib dites minimal:

```text
N = 1
N = 2
N = 3
N = 10
N = 30
N = 50
```

Kasus:

```text
all self-forbidden
duplicate names
randomized input
```

Untuk student-generated problems, jika N = 1:

```text
perfect matching impossible
```

karena satu-satunya participant hanya memiliki problem sendiri.

Maka:

```text
START rejected
```

---

# 60. Recommended Unit Tests

```text
shouldCreatePerfectMatching
shouldRejectSelfAssignment
shouldUseEveryProblemOnce
shouldAssignEveryParticipantOnce
shouldRejectImpossibleMatching
shouldRandomizeMatching
shouldKeepGroupStable
shouldDisallowSecondActiveTurn
shouldRestoreParticipantAfterReconnect
shouldPreserveAssignmentAfterDisconnect
shouldResumePausedGame
shouldRejectStartAfterFinished
shouldHideProblemAuthorFromStudent
```

---

# 61. Recommended Integration Tests

```text
Create room
→ join 30 students
→ submit 30 problems
→ start
→ verify 30 assignments
→ verify no self-match
→ verify no duplicate problem
→ reveal
→ complete
→ finish
→ retrieve history
```

Group:

```text
30 students
→ 5 groups
→ parallel turns
→ verify isolation
```

---

# 62. Final Game Logic Contract

PhillyoGo menggunakan prinsip:

```text
SERVER AUTHORITATIVE
DATABASE PERSISTED
EVENT DRIVEN
PERFECT MATCHED
ANONYMOUS PROBLEM
FAIR DISTRIBUTION
RECONNECT SAFE
PAUSE SAFE
GROUP ISOLATED
```

Semua implementasi frontend dan backend harus mengikuti contract ini.

---

# 63. Next Document

Setelah Game State Machine dan Perfect Matching terkunci, dokumen berikutnya adalah:

```text
PhillyoGo UI / Screen Specification
```

Dokumen tersebut akan menerjemahkan seluruh requirement menjadi:

```text
Super Admin screens
Admin screens
Teacher screens
Student screens
responsive behavior
component hierarchy
card states
animation states
loading states
empty states
error states
mobile behavior
```

