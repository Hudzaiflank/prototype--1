# PhillyoGo — Master Development Specification

**Version:** 1.0  
**Status:** Master Development Baseline  
**Product:** PhillyoGo — Digitalisasi Board Game Mental Health  
**Frontend:** React + Vite + Tailwind CSS v3  
**Backend:** Node.js + Express.js  
**Database:** MySQL  
**Realtime:** Socket.IO  
**Authentication:** JWT + Refresh Token

---

# 1. Instruksi Utama

Dokumen ini adalah **single source of truth untuk implementasi PhillyoGo**.

AI/developer yang membaca dokumen ini wajib:

1. mengikuti seluruh requirement;
2. tidak mengarang behavior yang bertentangan dengan dokumen;
3. tidak menghapus requirement yang sudah disepakati;
4. tidak mengubah flow permainan tanpa alasan teknis yang kuat;
5. tidak membuat matching di frontend;
6. menjadikan backend sebagai authoritative source of truth;
7. menjaga visual dan animasi berdasarkan HTML reference yang diberikan;
8. membuat FE dan BE terpisah;
9. menjaga responsive behavior;
10. memprioritaskan keamanan dan penggunaan resource yang rendah.

Jika terdapat detail yang belum ditentukan, gunakan keputusan yang paling sederhana, aman, maintainable, dan konsisten dengan dokumen.

---

# 2. Product Overview

PhillyoGo adalah platform digital board game mental health untuk lingkungan sekolah.

Platform digunakan oleh:

```text
Super Admin
Admin Sekolah
Guru
Murid
```

Game menggunakan dua kartu:

```text
Kartu kiri  → nama murid
Kartu kanan → permasalahan
```

Kartu awalnya tertutup.

Ketika turn dimulai:

```text
dua kartu dibuka
```

Masalah ditampilkan secara anonymous.

Nama pembuat masalah tidak ditampilkan kepada murid.

Guru dapat melihat history lengkap.

---

# 3. Role & Responsibility

## 3.1 Super Admin

Super Admin hanya satu akun.

Super Admin bertanggung jawab atas:

```text
login
daftar sekolah
membuat sekolah
melihat detail sekolah
reset password admin sekolah
```

Super Admin tidak membuat Super Admin lain.

Password Super Admin ditentukan ketika sistem pertama kali dikembangkan/deploy.

Super Admin tidak memiliki flow ganti password.

---

## 3.2 Admin Sekolah

Satu sekolah hanya memiliki satu admin.

Admin dibuat otomatis ketika sekolah dibuat oleh Super Admin.

Admin dapat:

```text
login
dashboard
kelola kelas
kelola guru
assign guru
detail kelas
reset password guru
kelola daftar permasalahan/topik
ganti password
```

Admin tidak dapat membuat admin lain.

---

## 3.3 Guru

Guru tidak dapat register.

Akun guru dibuat oleh Admin.

Guru dapat:

```text
login
logout
dashboard
daftar kelas
detail kelas
open room
konfigurasi permainan
monitoring permainan
history permainan
pause/resume permainan
ganti password
```

Guru hanya dapat membuat dan mengakses game session miliknya sendiri.

Guru hanya dapat mengelola kelas yang memang di-assign kepadanya.

---

## 3.4 Murid

Murid tidak login.

Flow:

```text
join room
input nama + masalah
menunggu
gameplay
hasil
history/session selesai
```

Murid mendapatkan:

```text
participant/session ID
```

yang disimpan di browser.

Session digunakan untuk reconnect.

---

# 4. Credential Rules

## 4.1 Admin

Format:

```text
admin.<school-slug>@phillyogo.id
```

Contoh:

```text
admin.sman4bandung@phillyogo.id
```

Password digenerate ketika sekolah dibuat.

Contoh:

```text
SMA4@2026
```

Password plaintext hanya boleh ditampilkan pada creation/reset workflow dan tidak disimpan plaintext di database.

---

## 4.2 Teacher

Format:

```text
guru.<nama>@<school-domain>
```

Contoh:

```text
guru.nama@sman4bandung.co.id
```

Default password:

```text
Guru@123
```

Password disimpan dalam bentuk hash.

---

# 5. School Structure

Sekolah memiliki:

```text
school
admin
teachers
classes
topics
```

---

# 6. Class Structure

Struktur kelas:

```text
Tingkat:
X

Jurusan:
IPA

Nomor:
1
```

Representasi:

```text
X-IPA-1
```

Level:

```text
X
XI
XII
```

Jurusan dapat disesuaikan.

Satu kelas dapat memiliki banyak guru.

Admin sekolah melakukan assignment guru ke kelas.

---

# 7. Teacher Assignment

Guru harus dibuat terlebih dahulu oleh Admin.

Setelah guru tersedia:

```text
Admin
→ pilih kelas
→ pilih satu atau lebih guru
→ assign
```

Guru dapat mengajar lebih dari satu kelas.

Kelas dapat memiliki lebih dari satu guru.

---

# 8. Password Reset Hierarchy

Hierarchy:

```text
Super Admin
    ↓
Admin
    ↓
Teacher
```

Rules:

```text
Super Admin → reset Admin
Admin → reset Teacher
Teacher → tidak dapat reset siapa pun
```

Jika Admin lupa password:

```text
Admin
→ Super Admin
→ reset password
```

Jika Teacher lupa password:

```text
Teacher
→ Admin
→ reset password
```

---

# 9. Authentication

Gunakan:

```text
JWT access token
+
refresh token
```

Access token:

```text
2 jam
```

Ketika access token expired:

```text
refresh token
→ issue access token baru
```

User tidak langsung di-kick.

Jika refresh gagal:

```text
logout
→ kembali login
```

Refresh token harus menggunakan mekanisme browser yang aman, idealnya:

```text
HttpOnly
Secure
SameSite
```

---

# 10. Room

Guru dapat membuka room dari kelas yang di-assign.

Room code:

```text
6 karakter
kombinasi huruf dan angka
```

Contoh:

```text
A7K92P
```

Code harus:

```text
unique
case-insensitive
securely randomized
```

---

# 11. Room Lifecycle

```text
OPEN
CLOSED
```

Saat room ditutup:

```text
room code hangus selamanya
```

Room code tidak boleh digunakan ulang.

Isi kelas tidak ikut terhapus.

---

# 12. Active Room Constraint

Satu kelas:

```text
maksimal satu active room
```

Jika masih ada active room:

```text
open room baru → reject
```

---

# 13. Room Ownership

Room hanya dapat dikontrol oleh:

```text
guru pembuat room
```

Teacher lain yang kebetulan mengajar kelas yang sama tidak dapat mengontrol room milik guru lain.

---

# 14. Game Configuration

Ketika membuka room, guru menentukan:

## Input Mode

```text
STUDENT
TEACHER
```

### STUDENT

Murid mengisi:

```text
nama
permasalahan
```

### TEACHER

Guru mengisi:

```text
nama murid
permasalahan
```

---

# 15. Problem Topic

Guru memilih topik/permasalahan yang akan dibahas.

Topik dapat:

```text
dipilih dari template
atau
dibuat baru oleh guru
```

Admin juga dapat mengelola daftar topik/permasalahan.

Guru dapat membuat topik baru untuk game miliknya.

---

# 16. Problem Display Limit

Saat open room guru menentukan:

```text
display limit
```

Pada mode Student:

```text
murid mengisi problem
```

tetapi pada HP murid tetap terdapat display problem limit yang ditentukan guru.

Limit ini membatasi jumlah/ukuran permasalahan yang ditampilkan sesuai konfigurasi produk.

---

# 17. Game Modes

Terdapat dua mode:

```text
ALL_STUDENTS
GROUPS
```

---

# 18. All Students Mode

Semua murid berada dalam satu game board.

```text
1 game
1 board
1 active card pair
```

Hanya satu pasangan kartu yang aktif pada satu waktu.

---

# 19. Group Mode

Guru menentukan jumlah kelompok.

Peserta diacak sejak awal.

Pembagian harus adil.

Perbedaan jumlah peserta antarkelompok maksimal:

```text
1
```

Contoh:

```text
29 murid
5 kelompok

6
6
6
6
5
```

---

# 20. Independent Group Game State

Dalam group mode:

```text
setiap kelompok memiliki board/game state sendiri
```

Semua kelompok dapat bermain bersamaan.

Tetapi:

```text
dalam satu kelompok hanya satu pasangan kartu aktif
```

Contoh:

```text
Group 1 → active pair
Group 2 → active pair
Group 3 → active pair
```

boleh aktif secara bersamaan.

---

# 21. Teacher Control

Guru tetap memiliki kontrol keseluruhan terhadap game.

Guru dapat:

```text
start
pause
resume
monitor
finish
```

Guru tidak melakukan matching secara manual.

---

# 22. Participant Session

Murid memasukkan nama lengkap.

Server menghasilkan:

```text
participant/session ID
```

Session ID disimpan browser.

Nama tidak dijadikan identifier utama.

Nama yang sama diperbolehkan.

Contoh:

```text
Andi
Andi
```

tetap dianggap dua participant berbeda.

---

# 23. Participant Status

Gunakan tiga status:

```text
CONNECTED
DISCONNECTED
FINISHED
```

Disconnect:

```text
CONNECTED → DISCONNECTED
```

Reconnect menggunakan session yang sama:

```text
DISCONNECTED → CONNECTED
```

Assignment tetap sama.

Group tetap sama.

Game state tetap sama.

---

# 24. Student Join Rules

Murid memasukkan:

```text
6-digit/alphanumeric room code
```

Jika room:

```text
OPEN
```

maka dapat masuk.

Jika:

```text
CLOSED
```

walaupun code benar:

```text
access denied
```

---

# 25. Student Submission

Mode Student:

```text
1 participant
→ 1 problem
```

Problem harus selesai disubmit sebelum START.

START ditolak sampai:

```text
semua participant submit
```

---

# 26. Teacher Submission

Mode Teacher:

Guru memasukkan semua:

```text
participant names
problems
```

Requirement tetap:

```text
N participants
N problems
```

---

# 27. Perfect Matching Requirement

Game membutuhkan:

```text
perfect matching
```

Artinya:

```text
1 participant → 1 problem
1 problem → 1 participant
```

Tidak boleh:

```text
participant mendapat 2 problem
problem diberikan ke 2 participant
```

---

# 28. Self-Match Rule

Jika problem dibuat oleh participant A:

```text
A tidak boleh mendapatkan problem miliknya sendiri.
```

Ini berlaku untuk:

```text
STUDENT input mode
```

---

# 29. Matching Failure

Sistem **tidak boleh memulai game** jika perfect matching tidak dapat ditemukan.

Jika matching gagal:

```text
GAME_MATCHING_FAILED
```

Game tetap:

```text
WAITING
```

Tidak boleh melakukan partial matching.

---

# 30. Matching Algorithm

Backend menggunakan:

```text
randomized bipartite matching
```

Candidate problem harus memenuhi constraint.

Setelah algorithm selesai:

```text
matching count == participant count
```

baru game dapat dimulai.

---

# 31. Initial Randomization

Participant diacak dari awal.

Untuk group mode:

```text
shuffle
→ divide groups
→ persist group membership
```

Group assignment tidak berubah saat:

```text
pause
resume
reconnect
```

---

# 32. Assignment Persistence

Assignment disimpan server.

Contoh:

```text
participant A → problem X
participant B → problem Z
participant C → problem Y
```

Setelah game dimulai:

```text
assignment immutable
```

---

# 33. Game State

Minimum state:

```text
WAITING
PLAYING
PAUSED
FINISHED
```

---

# 34. State Transition

Allowed:

```text
WAITING → PLAYING
PLAYING → PAUSED
PAUSED → PLAYING
PLAYING → FINISHED
PAUSED → FINISHED
```

Invalid transition harus ditolak.

---

# 35. Pause / Resume

Game harus dapat dilanjutkan minggu berikutnya.

Pause:

```text
game state persisted
```

Saat guru login lagi:

```text
open previous game
→ resume
```

Semua tetap:

```text
assignment
group
turn
history
```

---

# 36. Active Card Pair

Dalam satu game/group:

```text
only one active pair
```

Pair terdiri:

```text
participant card
problem card
```

---

# 37. Card Initial State

Sebelum dibuka:

```text
participant card = HIDDEN
problem card = HIDDEN
```

Tidak boleh terlihat siapa:

```text
participant
problem author
```

---

# 38. Card Reveal

Ketika turn dimulai:

```text
participant card
+
problem card
```

dibuka menggunakan animasi HTML reference.

Kartu problem hanya menampilkan:

```text
problem text
```

Tidak menampilkan:

```text
problem author
```

---

# 39. Card Visual Reference

HTML reference yang diberikan user adalah source of truth untuk:

```text
warna
layout
card shape
card position
card back
card front
animation
flip behavior
transition
```

Implementasi React harus meniru behavior dan animasi sedekat mungkin.

Jangan mengganti design dengan design generic.

---

# 40. Card Animation

Gunakan:

```text
perspective
transform-style
backface-visibility
transform
transition
```

Jika Tailwind tidak cukup:

```text
custom CSS diperbolehkan
```

Visual fidelity lebih penting daripada memaksakan seluruh animation menjadi utility class.

---

# 41. Turn

Turn memiliki:

```text
participant
problem
group
status
```

Turn lifecycle:

```text
ACTIVE
REVEALED
COMPLETED
```

---

# 42. Turn Rules

Saat turn aktif:

```text
participant card hidden
problem card hidden
```

Reveal:

```text
hidden → revealed
```

Complete:

```text
revealed → completed
```

Tidak boleh:

```text
complete sebelum reveal
```

---

# 43. No Duplicate Turn

Participant yang sudah mendapatkan giliran:

```text
tidak mendapat giliran lagi
```

Problem yang sudah muncul:

```text
tidak muncul lagi
```

---

# 44. Fairness

Untuk N participant:

```text
N turns
N participant assignments
N problem assignments
```

Setiap participant mendapat tepat satu turn.

Setiap problem muncul tepat satu kali.

---

# 45. Student Gameplay

Student hanya melihat informasi yang memang diperlukan.

Tidak boleh melihat:

```text
problem author
teacher history
other participant's private data
internal assignment
```

---

# 46. Teacher Monitoring

Teacher mendapatkan:

```text
participant status
group status
current turn
revealed cards
game progress
```

Teacher dapat melihat semua informasi game miliknya.

---

# 47. History

History hanya dapat dilihat oleh:

```text
Teacher yang membuat game
```

History dapat berisi:

```text
nama participant
problem
problem author
group
turn order
timestamp
status
```

Student tidak memiliki akses history.

---

# 48. Game Completion

Game dianggap selesai setelah semua required turns selesai.

Untuk group mode:

```text
semua group selesai
```

Setelah selesai:

```text
FINISHED
```

Participant dapat menjadi:

```text
FINISHED
```

---

# 49. Room Closing

Room dapat ditutup setelah game sesuai flow yang ditentukan guru.

Setelah closed:

```text
new participant tidak dapat join
```

Room code tidak pernah digunakan kembali.

---

# 50. Reconnect

Realtime wajib menggunakan:

```text
Socket.IO
```

Bukan polling terus-menerus.

Reconnect:

```text
disconnect
→ reconnect
→ authenticate/session validate
→ restore state snapshot
```

---

# 51. Server Authority

Client tidak boleh menentukan:

```text
matching
group assignment
turn assignment
game status
problem author visibility
```

Semua berasal dari server.

---

# 52. Database Authority

Game state tidak boleh hanya disimpan di:

```text
Socket.IO memory
React state
browser storage
```

MySQL menyimpan authoritative state.

---

# 53. Socket Broadcast

Flow mutation:

```text
validate
→ transaction
→ commit
→ broadcast
```

Jangan broadcast sebelum database commit.

---

# 54. Race Condition

Critical action harus menggunakan locking/transaction.

Contoh:

```text
dua request REVEAL bersamaan
```

Expected:

```text
request 1 → success
request 2 → rejected safely
```

---

# 55. Resource Optimization

Jangan menggunakan:

```text
polling 1 second
```

untuk gameplay.

Gunakan:

```text
Socket.IO
```

Database:

```text
connection pool
```

Backend:

```text
single Node process
```

untuk initial deployment jika kapasitas masih kecil.

Jangan menambahkan Redis/microservices jika belum diperlukan.

---

# 56. Frontend Stack

Wajib:

```text
React
Vite
Tailwind CSS v3
```

Frontend harus responsive:

```text
mobile
tablet
desktop
```

---

# 57. Backend Stack

Wajib:

```text
Node.js
Express.js
MySQL
Socket.IO
```

---

# 58. FE / BE Separation

Structure:

```text
phillyogo/
├── frontend/
└── backend/
```

Tidak boleh mencampur source FE dan BE.

---

# 59. Frontend Architecture

Recommended:

```text
frontend/src/
├── assets/
├── components/
├── pages/
├── layouts/
├── routes/
├── hooks/
├── services/
├── context/
├── store/
├── utils/
├── styles/
├── App.jsx
└── main.jsx
```

---

# 60. Backend Architecture

Recommended:

```text
backend/src/
├── config/
├── controllers/
├── services/
├── repositories/
├── middleware/
├── routes/
├── sockets/
├── validators/
├── utils/
├── constants/
├── app.js
└── server.js
```

---

# 61. Backend Layering

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

Business logic wajib berada di service.

SQL berada di repository.

Controller harus tipis.

---

# 62. Database

MySQL digunakan sebagai primary persistence layer.

Minimal domain:

```text
users
schools
classes
teachers
class_teachers
topics
rooms
game_sessions
participants
groups
group_members
problems
assignments
turns
refresh_sessions
```

Exact schema mengikuti Database/ERD Specification.

---

# 63. School Isolation

Admin:

```text
school_id = own school
```

Teacher:

```text
assigned class
+
own game
```

Student:

```text
own participant session
```

Super Admin:

```text
cross-school
```

---

# 64. Security

Wajib:

```text
password hashing
JWT
refresh token security
rate limiting
Helmet
CORS restriction
parameterized queries
input validation
ownership validation
```

Jangan pernah:

```text
store plaintext password
hardcode secrets
trust frontend authorization
expose refresh token to JS unnecessarily
```

---

# 65. Password Hash

Use secure password hashing such as:

```text
Argon2id
```

or equivalent properly configured slow password hash.

---

# 66. Room Code Security

Use cryptographically secure random generation.

Jangan:

```text
Math.random()
```

---

# 67. API Versioning

Use:

```text
/api/v1
```

Examples:

```text
/api/v1/auth/login
/api/v1/schools
/api/v1/classes
/api/v1/teachers
/api/v1/rooms
/api/v1/games
```

Exact endpoint definitions follow API Specification.

---

# 68. Error Response

Standardize:

```json
{
  "success": false,
  "error": {
    "code": "GAME_NOT_READY",
    "message": "Game cannot start because not all participants have submitted."
  }
}
```

Never expose stack trace in production.

---

# 69. Important Error Codes

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

# 70. Realtime

Socket events should include at minimum:

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

Exact contract follows Socket.IO Specification.

---

# 71. Socket Rooms

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
group room when required
```

Backend validates authorization before joining.

---

# 72. State Snapshot

Reconnect harus mendapatkan authoritative snapshot.

Snapshot dapat berasal dari:

```text
REST API
```

atau:

```text
Socket.IO state snapshot
```

---

# 73. State Version

Game state sebaiknya memiliki:

```text
state_version
```

untuk mencegah stale event.

---

# 74. Retention

Game history:

```text
30 hari
```

Setelah itu dihapus.

Cleanup dilakukan:

```text
scheduled batch job
```

---

# 75. Pause Persistence

Saat pause:

```text
database state persisted
```

Teacher dapat login kembali minggu berikutnya dan melanjutkan.

Tidak boleh kehilangan:

```text
assignment
group
turn
history
```

---

# 76. Excel Import

Untuk input data dalam jumlah banyak, gunakan import Excel.

Jangan memaksa admin/guru memasukkan data satu per satu jika tersedia flow bulk import.

Import harus:

```text
validate
preview
reject invalid rows
commit valid dataset atomically
```

Format template Excel akan disediakan terpisah.

---

# 77. Excel Import Security

File import:

```text
must be validated
```

Batasi:

```text
file type
file size
row count
required columns
```

Jangan langsung memasukkan seluruh spreadsheet ke database tanpa validation.

---

# 78. Responsive Design

Semua halaman wajib usable di:

```text
mobile
tablet
desktop
```

Gameplay harus menjadi prioritas mobile.

---

# 79. Mobile Gameplay

Kartu harus tetap:

```text
terlihat jelas
dapat disentuh
tidak overflow
```

Animation tidak boleh menyebabkan horizontal scrolling.

---

# 80. UI State

Pisahkan:

```text
UI state
server state
game state
```

Contoh UI state:

```text
modal
sidebar
selected tab
animation
```

Game state berasal dari backend.

---

# 81. Performance

Hindari:

```text
unnecessary rerender
duplicate socket listener
large images
unbounded history queries
frequent polling
```

Gunakan:

```text
lazy route
pagination
component boundaries
connection pooling
```

---

# 82. Testing

Wajib menguji:

```text
authentication
authorization
school isolation
teacher ownership
room lifecycle
student session
reconnect
perfect matching
group fairness
game state
pause/resume
card reveal
history access
```

---

# 83. Matching Tests

Minimum:

```text
1 participant
2 participants
3 participants
10 participants
30 participants
50 participants
```

Verify:

```text
perfect matching
no duplicate participant
no duplicate problem
no self match
```

---

# 84. Group Tests

Examples:

```text
29 / 5 groups
30 / 5 groups
31 / 5 groups
```

Expected difference:

```text
max 1 participant
```

---

# 85. Reconnect Tests

Test:

```text
student disconnect
→ reconnect same session
→ same participant
→ same group
→ same assignment
→ same turn
```

Teacher reconnect:

```text
same game
→ same state
```

---

# 86. Authorization Tests

Must prove:

```text
Admin A cannot access School B
Teacher A cannot access Teacher B history
Teacher A cannot control Teacher B game
Student cannot access teacher history
Student cannot see problem author
```

---

# 87. Concurrency Tests

Test:

```text
START x2
REVEAL x2
COMPLETE x2
```

Expected:

```text
only valid state transition succeeds
```

---

# 88. Deployment

Production:

```text
Frontend static hosting
        ↓
Reverse Proxy / HTTPS
        ↓
Express + Socket.IO
        ↓
MySQL
```

WebSocket upgrade must be supported.

---

# 89. Environment Variables — Frontend

```text
VITE_API_BASE_URL=
VITE_SOCKET_URL=
VITE_APP_NAME=PhillyoGo
```

Frontend variables are public.

Never put secrets there.

---

# 90. Environment Variables — Backend

```text
NODE_ENV=
PORT=

DATABASE_HOST=
DATABASE_PORT=
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

---

# 91. Git Rules

Never commit:

```text
.env
database credentials
JWT secrets
production passwords
refresh tokens
```

Commit:

```text
.env.example
```

---

# 92. Development Order

Implement in this order:

```text
1. Project setup
2. Database migration
3. Authentication
4. School management
5. Class management
6. Teacher management
7. Teacher assignment
8. Topic management
9. Room
10. Student participant session
11. Game configuration
12. Group creation
13. Perfect matching
14. Game state engine
15. Socket.IO
16. Card gameplay
17. Monitoring
18. History
19. Pause/resume
20. Reconnect
21. Excel import
22. Testing
23. Security hardening
24. Deployment
```

---

# 93. AI Coding Rules

When generating code:

```text
1. Show which files are created/modified.
2. Never silently change architecture.
3. Do not invent endpoints.
4. Do not duplicate business logic.
5. Keep components focused.
6. Keep controllers thin.
7. Keep SQL in repositories.
8. Keep matching in backend service.
9. Keep game state authoritative on server.
10. Clean up socket listeners.
11. Validate all external input.
12. Never expose secrets.
13. Explain migrations when schema changes.
14. Do not remove existing functionality without approval.
15. Preserve HTML reference animation.
```

---

# 94. AI Implementation Priority

If requirements conflict:

```text
Security
 ↓
Data integrity
 ↓
Game correctness
 ↓
Authorization
 ↓
Realtime consistency
 ↓
Responsive UX
 ↓
Visual fidelity
 ↓
Performance optimization
```

Visual optimization must never break game correctness.

---

# 95. Do Not Simplify These Requirements

AI must not simplify:

```text
perfect matching
anonymous problem
teacher-only history
group-specific game state
one active pair per group
reconnect
pause/resume
room code permanent invalidation
school isolation
teacher ownership
password reset hierarchy
```

---

# 96. Final Product Flow

## Super Admin

```text
Login
 ↓
Dashboard
 ↓
Daftar Sekolah
 ↓
Tambah Sekolah
 ↓
Generate School
 ↓
Generate Admin
 ↓
Display Credentials
```

---

# 97. Admin Flow

```text
Login
 ↓
Dashboard
 ↓
Kelola Guru
 ↓
Tambah Guru
 ↓
Generate Credential
 ↓
Kelola Kelas
 ↓
Assign Guru
```

---

# 98. Teacher Flow

```text
Login
 ↓
Dashboard
 ↓
Daftar Kelas
 ↓
Detail Kelas
 ↓
Open Room
 ↓
Konfigurasi Game
 ↓
Wait Participants
 ↓
All Submitted
 ↓
Start
 ↓
Gameplay
 ↓
Monitoring
 ↓
Pause/Resume if needed
 ↓
Finish
 ↓
History
```

---

# 99. Student Flow

```text
Join Room
 ↓
Input Room Code
 ↓
Input Name + Problem
 ↓
Waiting
 ↓
All Participants Ready
 ↓
Game Start
 ↓
Card Reveal
 ↓
Gameplay
 ↓
Finish
 ↓
Result
```

Group mode:

```text
Join
 ↓
Submit
 ↓
Group assigned
 ↓
Group gameplay
```

---

# 100. Game Flow

```text
ROOM OPEN
     ↓
PARTICIPANTS JOIN
     ↓
SUBMISSION
     ↓
ALL READY
     ↓
GROUP ASSIGNMENT (if group mode)
     ↓
PERFECT MATCHING
     ↓
PLAYING
     ↓
ACTIVE TURN
     ↓
HIDDEN CARDS
     ↓
REVEAL
     ↓
COMPLETE
     ↓
NEXT TURN
     ↓
ALL TURNS COMPLETE
     ↓
FINISHED
```

---

# 101. Group Game Flow

```text
Participants
     ↓
Shuffle
     ↓
Fair Group Distribution
     ↓
Persist Groups
     ↓
Perfect Matching
     ↓
Group 1 ── Turn
Group 2 ── Turn
Group 3 ── Turn
Group N ── Turn
     ↓
Parallel Gameplay
     ↓
All Groups Finished
     ↓
GAME FINISHED
```

---

# 102. Critical Invariants

These must always remain true:

```text
1. One school has one admin.
2. One class may have many teachers.
3. One teacher may belong to many classes.
4. One class has max one active room.
5. Closed room codes never return.
6. One participant produces one problem in Student mode.
7. N participants require N problems.
8. Every participant gets exactly one problem.
9. Every problem appears exactly once.
10. Student never receives own problem.
11. Matching must be perfect.
12. Game never starts with partial matching.
13. Group sizes differ by at most one.
14. Each group has independent game state.
15. Each group has only one active card pair.
16. Assignment is immutable after start.
17. Reconnect preserves assignment.
18. Pause preserves state.
19. History belongs to game creator.
20. Student cannot view history.
21. Student cannot see problem author.
22. Room code is permanently invalid after close.
23. Backend is authoritative.
24. Critical mutations are transaction-safe.
25. Socket broadcasts occur after persistence.
```

---

# 103. Definition of Done

Feature dianggap selesai jika:

```text
functional
responsive
secure
authorized
tested
reconnect-safe
realtime-safe
consistent with SRS
consistent with ERD
consistent with API
consistent with UI specification
```

dan tidak melanggar:

```text
Critical Invariants
```

---

# 104. Reference Documents

Implementasi final harus menggunakan dokumen berikut sebagai referensi:

```text
SRS
Database / ERD Specification
API Specification
Realtime / Socket.IO Specification
Game State + Perfect Matching Specification
UI / Screen Specification
Frontend Architecture
Backend Architecture
```

Jika terjadi konflik antar dokumen, gunakan:

```text
SRS
+
latest approved requirement
```

sebagai sumber keputusan utama.

---

# 105. Final Instruction to Coding AI

You are implementing **PhillyoGo**, a production-oriented school mental-health board-game platform.

Do not treat this as a generic CRUD application.

The most critical engineering problems are:

```text
perfect matching
game-state correctness
realtime synchronization
reconnect
pause/resume
role authorization
school isolation
anonymous problem presentation
fair group distribution
```

Implement these as first-class backend concerns.

The frontend must reproduce the supplied HTML card visual and animation as closely as possible while adapting it into reusable React components.

The implementation must be:

```text
secure
resource-efficient
responsive
maintainable
testable
realtime
```

Never sacrifice data integrity or authorization for UI convenience.
