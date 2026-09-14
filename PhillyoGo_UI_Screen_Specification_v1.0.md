# PhillyoGo — UI / Screen Specification

**Version:** 1.0  
**Status:** UI Baseline  
**Frontend:** React + Vite + Tailwind CSS v3  
**Responsive:** Desktop + Tablet + Mobile  
**Reference Visual:** HTML card component supplied by project owner

---

# 1. Tujuan

Dokumen ini menerjemahkan SRS dan game logic PhillyoGo menjadi spesifikasi UI yang dapat langsung digunakan oleh frontend developer.

Prioritas visual:

1. HTML referensi menjadi acuan utama.
2. Bentuk kartu harus semirip mungkin.
3. Warna harus mengikuti referensi.
4. Animasi kartu harus mengikuti behavior referensi.
5. Responsive wajib.
6. Gameplay harus nyaman pada mobile.
7. UI tidak boleh mengubah aturan game.
8. Animasi hanya merepresentasikan state dari server.

---

# 2. Visual Reference Rule

HTML referensi yang diberikan project owner dianggap sebagai:

```text
Visual Source of Truth
```

Untuk komponen yang sudah tersedia di HTML:

```text
do not redesign
do not replace animation
do not arbitrarily change color
do not change card behavior
```

Implementasi React hanya memindahkan:

```text
HTML
CSS
JavaScript behavior
```

menjadi reusable React components.

Jika terjadi konflik:

```text
SRS / Game Logic
        >
Functional behavior
        >
HTML visual reference
        >
Frontend implementation preference
```

---

# 3. Design Principles

PhillyoGo harus terasa:

```text
playful
friendly
clean
interactive
educational
not overly corporate
```

Gameplay harus terasa seperti:

```text
board game
```

bukan dashboard administratif.

Dashboard role-based boleh lebih utilitarian.

---

# 4. Global Responsive Breakpoints

Gunakan Tailwind CSS v3.

Recommended:

```text
default  → mobile
sm       → ≥640px
md       → ≥768px
lg       → ≥1024px
xl       → ≥1280px
2xl      → ≥1536px
```

Mobile-first.

---

# 5. Global Layout

## Desktop

```text
┌─────────────────────────────────────────────┐
│ Navbar / Header                             │
├──────────────┬──────────────────────────────┤
│ Sidebar      │ Main Content                 │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

Untuk gameplay:

```text
┌─────────────────────────────────────────────┐
│ Game Header                                 │
├─────────────────────────────────────────────┤
│                                             │
│             GAME BOARD                      │
│                                             │
├─────────────────────────────────────────────┤
│ Controls / Status                           │
└─────────────────────────────────────────────┘
```

---

# 6. Mobile Layout

Dashboard:

```text
┌──────────────────────┐
│ Header               │
├──────────────────────┤
│ Content              │
│                      │
│                      │
└──────────────────────┘
```

Sidebar berubah menjadi:

```text
drawer / mobile menu
```

Gameplay:

```text
┌──────────────────────┐
│ Room / Status        │
├──────────────────────┤
│                      │
│ Card                 │
│                      │
│ Card                 │
│                      │
├──────────────────────┤
│ Game Control         │
└──────────────────────┘
```

---

# 7. Route Map

## Super Admin

```text
/login
/dashboard
/schools
/schools/new
/schools/:schoolId
/schools/:schoolId/reset-password
```

---

## Admin

```text
/admin/login
/admin/dashboard
/admin/classes
/admin/classes/new
/admin/classes/:classId
/admin/teachers
/admin/teachers/new
/admin/teachers/:teacherId
/admin/classes/:classId/assign-teachers
/admin/problems
/admin/problems/new
```

---

## Teacher

```text
/teacher/login
/teacher/dashboard
/teacher/classes
/teacher/classes/:classId
/teacher/rooms/:roomId/open
/teacher/rooms/:roomId/configure
/teacher/rooms/:roomId/monitor
/teacher/rooms/:roomId/history
/teacher/change-password
```

---

## Student

```text
/join
/room/:roomCode
/room/:roomCode/input
/room/:roomCode/waiting
/room/:roomCode/game
/room/:roomCode/result
```

Student tidak memiliki authentication page.

---

# 8. Shared Components

```text
Button
Input
Select
Textarea
Modal
ConfirmDialog
Toast
Badge
Card
Table
Pagination
Dropdown
Navbar
Sidebar
MobileMenu
LoadingSpinner
Skeleton
EmptyState
ErrorState
```

---

# 9. Gameplay Components

```text
GameBoard
GameCard
CardBack
ParticipantCard
ProblemCard
CardPair
GameHeader
GameStatus
GroupIndicator
TurnIndicator
TeacherControls
StudentStatus
SubmissionProgress
GameHistory
```

---

# 10. Card Component

Card adalah komponen visual paling penting.

Struktur:

```text
GameCard
├── CardBack
└── CardFront
    ├── CardTitle
    └── CardContent
```

Props:

```typescript
type GameCardProps = {
  type: "participant" | "problem";
  state: "hidden" | "revealed";
  content?: string;
  disabled?: boolean;
};
```

---

# 11. Card Back

Ketika hidden:

```text
tidak ada informasi mengenai isi kartu
```

Card back harus:

```text
consistent
centered
animated
visually distinct
```

Tidak boleh menampilkan:

```text
nama participant
problem
problem author
```

---

# 12. Card Front — Participant

Menampilkan:

```text
nama siswa
```

Contoh:

```text
┌──────────────────┐
│                  │
│      ANDI        │
│                  │
└──────────────────┘
```

---

# 13. Card Front — Problem

Menampilkan:

```text
problem content
```

Contoh:

```text
┌──────────────────────────┐
│                          │
│ Saya merasa kesulitan    │
│ mengikuti pelajaran.     │
│                          │
└──────────────────────────┘
```

Tidak menampilkan:

```text
nama pembuat masalah
```

---

# 14. Card Pair

Desktop:

```text
┌────────────────┐      ┌─────────────────────┐
│                │      │                     │
│ PARTICIPANT    │      │       PROBLEM       │
│                │      │                     │
└────────────────┘      └─────────────────────┘
```

Mobile:

```text
┌─────────────────────┐
│                     │
│    PARTICIPANT      │
│                     │
└─────────────────────┘

        ↓

┌─────────────────────┐
│                     │
│       PROBLEM       │
│                     │
└─────────────────────┘
```

---

# 15. Card Animation

Behavior harus mengikuti HTML referensi.

Required states:

```text
hidden
revealing
revealed
```

Animation:

```text
Card Back
   ↓
flip
   ↓
Card Front
```

Tidak boleh mengubah data hanya karena animation selesai.

Data sudah authoritative sebelum animation dimainkan.

---

# 16. Card Animation Timing

Gunakan timing yang sama dengan HTML referensi apabila tersedia.

Jika tidak tersedia, gunakan baseline:

```text
300ms–700ms
```

Animation harus:

```text
smooth
not excessive
mobile friendly
```

---

# 17. Reduced Motion

Jika browser memiliki:

```text
prefers-reduced-motion: reduce
```

kurangi/nonaktifkan animation.

Gameplay tetap berjalan.

---

# 18. Super Admin Login

Fields:

```text
Email
Password
```

Actions:

```text
Login
```

Tidak ada:

```text
Register
Forgot Password
Change Password
```

Karena akun Super Admin fixed saat development.

---

# 19. Super Admin Dashboard

Menampilkan:

```text
Total Sekolah
Sekolah Aktif
Sekolah Nonaktif
```

Quick actions:

```text
Tambah Sekolah
Lihat Sekolah
```

---

# 20. School List

Table:

```text
School Name
Domain
Admin Email
Status
Created At
Action
```

Actions:

```text
Detail
Reset Admin Password
```

---

# 21. Add School

Fields minimal:

```text
Nama Sekolah
Domain Sekolah
Nama Admin
```

System generates:

```text
Admin Email
Admin Password
```

Format:

```text
Admin Email:
admin.sman4bandung@phillyogo.id

Password:
SMA4@2026
```

Setelah success, credential ditampilkan satu kali dengan clear warning.

---

# 22. School Detail

Menampilkan:

```text
school information
admin account
school status
classes count
teachers count
```

Action:

```text
Reset Admin Password
```

---

# 23. Reset Admin Password

Confirmation modal:

```text
Reset password admin?
```

Warning:

```text
Password lama tidak dapat digunakan setelah reset.
```

Password baru mengikuti generator sistem.

---

# 24. Admin Login

Fields:

```text
Email
Password
```

Generated account.

Admin boleh mengganti password.

---

# 25. Admin Dashboard

Cards:

```text
Total Kelas
Total Guru
Active Rooms
Completed Games
```

Quick actions:

```text
Kelola Kelas
Kelola Guru
Kelola Permasalahan
```

---

# 26. Class Management

Class structure:

```text
Tingkat:
X

Jurusan:
IPA

Nomor:
1
```

Display:

```text
X - IPA - 1
```

---

# 27. Add Class

Fields:

```text
Tingkat
Jurusan
Nomor
```

Validation:

```text
required
valid combination
no duplicate class within school
```

---

# 28. Class Detail — Admin

Menampilkan:

```text
Class name
Tingkat
Jurusan
Nomor
Assigned teachers
Student/session statistics if available
```

Actions:

```text
Assign Teacher
Remove Teacher
```

---

# 29. Teacher Management

Table:

```text
Nama
Email
Status
Jumlah Kelas
Action
```

Actions:

```text
Detail
Reset Password
```

---

# 30. Add Teacher

Fields:

```text
Nama Lengkap
```

Optional project-specific teacher metadata may be added later.

System generates:

```text
guru.nama@sman4bandung.co.id
```

Default password:

```text
Guru@123
```

Teacher cannot register.

---

# 31. Assign Teacher

Admin chooses:

```text
Class
```

then:

```text
Select multiple teachers
```

Because:

```text
one class can have multiple teachers
```

A teacher may also be assigned to multiple classes if allowed by business rules.

---

# 32. Reset Teacher Password

Admin:

```text
Reset → Guru@123
```

Admin may reset teacher password.

Admin cannot reset admin password.

---

# 33. Problem Management

Admin manages predefined problems/topics.

Features:

```text
list
create
edit
activate/deactivate
```

Teacher can also create a new topic/problem category from Teacher configuration if permitted.

---

# 34. Teacher Dashboard

Cards:

```text
My Classes
Active Rooms
Paused Games
Completed Games
```

Quick actions:

```text
Open Room
View Classes
View History
Change Password
```

---

# 35. Teacher Class List

Display:

```text
Class Name
Number of Students / Sessions
Active Room
Action
```

Action:

```text
Detail
```

---

# 36. Teacher Class Detail

Menampilkan:

```text
Class information
Assigned teacher context
Available topics
Active room
Previous rooms created by this teacher
```

Action:

```text
Open Room
View History
```

Teacher hanya dapat mengelola game session yang dibuatnya sendiri.

---

# 37. Open Room

Form:

```text
Game Mode
Input Mode
Problem Display Limit
Topic / Problem
```

Game Mode:

```text
Seluruh Siswa
Berkelompok
```

Input Mode:

```text
Siswa Mengisi
Guru Mengisi
```

Jika GROUPS:

```text
Jumlah Kelompok
```

---

# 38. Topic Selection

Teacher dapat:

```text
select existing topic
```

atau:

```text
create new topic
```

UI:

```text
[ Pilih Topik ▼ ]

+ Buat Topik Baru
```

---

# 39. Group Configuration

Jika:

```text
Berkelompok
```

tampilkan:

```text
Jumlah Kelompok: [ 5 ]
```

Preview:

```text
30 peserta
5 kelompok

≈ 6 peserta / kelompok
```

System guarantees:

```text
group size difference <= 1
```

---

# 40. Room Creation

System generates:

```text
6-character alphanumeric code
```

Example:

```text
A7K92P
```

Rules:

```text
globally unique
case-insensitive
active room only
```

Closed code:

```text
permanently invalid
```

---

# 41. Room Open Screen

Teacher sees:

```text
Room Code
QR Code
Topic
Game Mode
Input Mode
Submission Progress
```

Example:

```text
ROOM CODE

A7K92P
```

Progress:

```text
23 / 30 siswa sudah submit
```

---

# 42. Student Join

Student opens:

```text
/join
```

UI:

```text
Masukkan Kode Room

[ A7K92P ]

[ MASUK ]
```

No login.

---

# 43. Invalid Room

If room:

```text
not found
closed
expired
```

show:

```text
Room tidak tersedia.
Periksa kembali kode yang dimasukkan.
```

---

# 44. Student Input

Student enters:

```text
Nama Lengkap
Masalah
```

Student gets:

```text
participantSessionId
```

stored in:

```text
browser storage
```

Use a secure/random UUID.

---

# 45. Student Waiting

Before START:

```text
Menunggu Guru Memulai Permainan
```

Show:

```text
Nama
Submission status
```

Do not show other students' problems.

---

# 46. START Gate UI

Teacher button:

```text
START GAME
```

Button disabled while:

```text
not all students submitted
```

Example:

```text
23 / 30
[ START GAME ] disabled
```

When ready:

```text
30 / 30
[ START GAME ]
```

Server remains authoritative even if client is manipulated.

---

# 47. Matching Loading

When Teacher presses START:

```text
Mempersiapkan permainan...
```

Possible stages:

```text
Memvalidasi peserta...
Mengacak kelompok...
Mencocokkan kartu...
Mempersiapkan papan...
```

Do not expose algorithm internals unnecessarily to students.

---

# 48. Student Group Assignment

For group mode:

```text
Kamu berada di:

KELOMPOK 3
```

Then transition to game board.

---

# 49. Student Game Screen

Main layout:

```text
┌─────────────────────────────────────┐
│ TOPIC                               │
├─────────────────────────────────────┤
│                                     │
│          CARD       CARD            │
│                                     │
├─────────────────────────────────────┤
│ Group / Turn / Status               │
└─────────────────────────────────────┘
```

---

# 50. Student Game Information

Student can see:

```text
topic
current revealed participant
current revealed problem
group number
current status
```

Student cannot see:

```text
problem author
teacher history
other group's current problem
internal assignment IDs
```

---

# 51. Problem Display Limit

Student UI follows:

```text
problemDisplayLimit
```

configured by Teacher.

If limit is reached:

```text
do not render additional problem content
```

Server should also enforce the access rule where relevant.

---

# 52. Teacher Monitoring

Teacher sees:

```text
Total Participants
Connected
Disconnected
Submitted
Current Group States
Current Turn
```

For GROUPS:

```text
Group 1 → Turn 4
Group 2 → Turn 5
Group 3 → Turn 3
```

---

# 53. Teacher Controls

Teacher controls:

```text
START
PAUSE
RESUME
REVEAL
NEXT / COMPLETE
FINISH
```

Only valid actions are enabled.

Example:

```text
WAITING
→ START enabled only when ready

PLAYING + HIDDEN
→ REVEAL enabled

PLAYING + REVEALED
→ COMPLETE enabled

PAUSED
→ RESUME enabled
```

---

# 54. Group Monitoring

Teacher view:

```text
┌───────────────┐
│ GROUP 1       │
│ Turn 5        │
│ ● Playing     │
└───────────────┘

┌───────────────┐
│ GROUP 2       │
│ Turn 3        │
│ ● Playing     │
└───────────────┘
```

Each group is independently observable.

---

# 55. Teacher History

History only for the Teacher who created the game.

Columns:

```text
Turn
Group
Student
Problem
Timestamp
Status
```

Example:

```text
1 | Group 1 | Andi | "..." | 08:31 | Completed
```

Problem author can be shown to Teacher.

---

# 56. Student Result

After game finishes:

```text
Permainan selesai!
```

Possible information:

```text
group
completion status
session finished
```

Do not expose teacher-only history.

---

# 57. Student Session End

After:

```text
game FINISHED
```

student connection may be closed.

Participant becomes:

```text
FINISHED
```

Browser session remains only as needed for result/state.

---

# 58. Pause UI

Student:

```text
Permainan sedang dijeda
Menunggu guru melanjutkan...
```

Teacher:

```text
Game Paused
[ RESUME ]
```

Current state remains visible where appropriate.

---

# 59. Reconnect UI

If temporary network loss:

```text
Menghubungkan kembali...
```

After success:

```text
Permainan dipulihkan
```

The student returns to:

```text
same game
same group
same assignment
same turn
```

---

# 60. Error States

Every screen needs:

```text
loading
empty
error
success
```

Examples:

```text
Room not found
Session expired
Unauthorized
Connection lost
Game paused
Game finished
Invalid action
```

---

# 61. Toast Rules

Use toast for:

```text
password changed
room created
teacher created
class created
topic created
```

Do not use toast for critical gameplay information that must remain visible.

---

# 62. Confirmation Modal

Required for destructive/critical actions:

```text
Close Room
Reset Password
Delete/Deactivate Topic
Finish Game
```

Example:

```text
Apakah kamu yakin ingin menutup room?

Room code akan hangus selamanya.

[ Batal ] [ Tutup Room ]
```

---

# 63. Mobile Gameplay Priority

Mobile must prioritize:

```text
1. Current game state
2. Cards
3. Topic/problem
4. Group/turn status
5. Teacher controls
```

Avoid:

```text
large tables
horizontal overflow
tiny text
```

---

# 64. Touch Interaction

Cards and controls must be touch friendly.

Recommended minimum interactive target:

```text
44 × 44 px
```

Avoid hover-only interaction.

---

# 65. Accessibility

Required:

```text
semantic buttons
keyboard navigation
visible focus state
sufficient contrast
aria labels where necessary
reduced motion support
```

Card state should not rely only on color.

---

# 66. Loading Strategy

Dashboard:

```text
Skeleton
```

Gameplay:

```text
minimal loading overlay
```

Do not freeze entire screen when a small component is loading.

---

# 67. Realtime Indicator

Teacher dashboard can show:

```text
● Live
```

or:

```text
● Connecting...
```

Student:

```text
● Connected
```

If disconnected:

```text
⚠ Connection lost
Reconnecting...
```

---

# 68. Empty States

Example:

```text
Belum ada kelas.

[ Tambah Kelas ]
```

Teacher:

```text
Belum ada room.

[ Open Room ]
```

History:

```text
Belum ada permainan yang selesai.
```

---

# 69. Credential Display

When account generated:

```text
Email
Password
```

Use a credential card.

Example:

```text
┌─────────────────────────────────┐
│ Akun Admin Berhasil Dibuat      │
│                                 │
│ Email                           │
│ admin.sman4bandung@phillyogo.id │
│                                 │
│ Password                        │
│ SMA4@2026                       │
│                                 │
│ [ Salin ]                       │
└─────────────────────────────────┘
```

Password should not be exposed repeatedly later.

---

# 70. Navigation Rules

Super Admin:

```text
Dashboard
Sekolah
```

Admin:

```text
Dashboard
Kelas
Guru
Permasalahan
```

Teacher:

```text
Dashboard
Kelas
Room Aktif
History
Ganti Password
```

Student:

```text
No persistent navigation
```

---

# 71. Auth Guard

Frontend route guards:

```text
Super Admin routes
Admin routes
Teacher routes
Public Student routes
```

Unauthorized role:

```text
403 / redirect
```

Frontend guard is UX only.

Backend must always revalidate authorization.

---

# 72. JWT UX

Access token:

```text
2 hours
```

When access token expires:

```text
use refresh token
```

Do not immediately kick the user.

If refresh fails:

```text
redirect to login
```

Student does not use JWT login.

---

# 73. Frontend State Management

Avoid unnecessary global state.

Recommended separation:

```text
Auth State
UI State
Game State
Socket State
```

Game state should be normalized enough to avoid duplicated state.

---

# 74. Server State

Server state:

```text
game status
participants
groups
assignments
turn
cards
history
```

Client should derive UI from server state.

---

# 75. Local Student Session

Store:

```text
participantSessionId
gameSessionId
roomCode
```

Avoid storing:

```text
problem author
teacher-only history
sensitive credentials
```

Use browser storage only for reconnect functionality.

---

# 76. Gameplay State Priority

When receiving realtime event:

```text
validate event
→ update authoritative client state
→ trigger animation
```

Do not:

```text
animation
→ assume server state
```

---

# 77. Visual Consistency

Use reusable tokens:

```text
spacing
border radius
shadow
font sizes
transition
card dimensions
```

Avoid per-page arbitrary values.

---

# 78. Card Desktop Size

Use a responsive max width.

Example conceptual:

```text
participant card:
~320–420px

problem card:
~360–520px
```

Exact dimensions should follow the supplied HTML reference where possible.

---

# 79. Card Mobile Size

Cards should fit viewport width:

```text
width: calc(100vw - horizontal padding)
```

Avoid horizontal scrolling.

Problem text must wrap.

---

# 80. Long Problem Text

Use:

```text
word wrapping
scroll only when necessary
```

Do not let long text break the entire card layout.

---

# 81. Game Header

Display:

```text
Topic
Room
Group
Turn
Status
```

Teacher may additionally see:

```text
participant progress
```

Student sees only information appropriate to their role.

---

# 82. Visual Feedback

Card reveal:

```text
flip animation
```

Turn completion:

```text
subtle transition
```

Game finished:

```text
clear success state
```

Avoid excessive confetti or effects unless consistent with reference design.

---

# 83. Security UI

Never display:

```text
JWT
refresh token
database IDs
internal error stack
problem author to student
```

---

# 84. Final UI Contract

Frontend must implement:

```text
Role-based UI
Responsive layout
Reference card visual
Reference card animation
Realtime state
Reconnect
Pause/resume
Group isolation
Anonymous problems
Teacher-only history
Mobile gameplay
Accessible controls
```

---

# 85. Next Document

Setelah UI / Screen Specification:

```text
Frontend Architecture
```

akan menentukan:

```text
React folder structure
Atomic components
pages
layouts
hooks
services
socket client
state management
routing
API integration
environment variables
Tailwind configuration
responsive architecture
```

