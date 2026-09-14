# PhillyoGo — Frontend Architecture Specification

**Version:** 1.0  
**Status:** Development Baseline  
**Frontend Stack:** React + Vite + Tailwind CSS v3  
**Realtime:** Socket.IO Client  
**Language:** JavaScript/JSX  
**Responsive:** Mobile-first

---

# 1. Tujuan

Dokumen ini menentukan arsitektur frontend PhillyoGo agar implementasi konsisten, scalable, ringan, dan mudah dikembangkan.

Frontend harus:

- menggunakan React dengan Vite;
- menggunakan Tailwind CSS v3;
- terpisah dari backend;
- mendukung empat role;
- mendukung realtime gameplay;
- mendukung reconnect;
- mendukung pause/resume;
- mempertahankan visual dan animasi HTML referensi;
- responsive pada mobile, tablet, desktop;
- tidak menyimpan state sensitif yang tidak diperlukan.

---

# 2. Repository Structure

FE dan BE wajib terpisah.

```text
phillyogo/
├── frontend/
└── backend/
```

Frontend:

```text
frontend/
├── public/
├── src/
├── .env
├── .env.example
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
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

# 3. Recommended Frontend Folder Structure

```text
frontend/
└── src/
    ├── assets/
    │   ├── images/
    │   ├── icons/
    │   └── fonts/
    │
    ├── components/
    │   ├── common/
    │   ├── layout/
    │   ├── form/
    │   ├── feedback/
    │   ├── admin/
    │   ├── teacher/
    │   └── game/
    │
    ├── pages/
    │   ├── auth/
    │   ├── super-admin/
    │   ├── admin/
    │   ├── teacher/
    │   └── student/
    │
    ├── layouts/
    │   ├── AuthLayout.jsx
    │   ├── SuperAdminLayout.jsx
    │   ├── AdminLayout.jsx
    │   ├── TeacherLayout.jsx
    │   └── StudentLayout.jsx
    │
    ├── routes/
    │   ├── AppRouter.jsx
    │   ├── ProtectedRoute.jsx
    │   └── RoleRoute.jsx
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useSocket.js
    │   ├── useGame.js
    │   ├── useRoom.js
    │   ├── useParticipantSession.js
    │   └── useDebounce.js
    │
    ├── services/
    │   ├── api/
    │   │   ├── apiClient.js
    │   │   ├── authApi.js
    │   │   ├── schoolApi.js
    │   │   ├── classApi.js
    │   │   ├── teacherApi.js
    │   │   ├── topicApi.js
    │   │   ├── roomApi.js
    │   │   ├── gameApi.js
    │   │   └── historyApi.js
    │   │
    │   └── socket/
    │       ├── socketClient.js
    │       ├── socketEvents.js
    │       └── socketHandlers.js
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   └── GameContext.jsx
    │
    ├── store/
    │   └── gameStore.js
    │
    ├── utils/
    │   ├── storage.js
    │   ├── validation.js
    │   ├── formatters.js
    │   └── constants.js
    │
    ├── styles/
    │   ├── index.css
    │   └── card.css
    │
    ├── App.jsx
    └── main.jsx
```

---

# 4. Architecture Principle

Gunakan separation:

```text
UI
 ↓
Hooks / Context
 ↓
Services
 ↓
API / Socket
```

Jangan:

```text
Component
 → axios langsung
 → socket logic langsung
 → localStorage langsung
 → business logic campur
```

---

# 5. Pages vs Components

## Pages

Page menangani:

```text
route-level composition
data orchestration
page-specific state
```

## Components

Component menangani:

```text
visual UI
reusable interaction
small UI state
```

Contoh:

```text
pages/teacher/TeacherMonitorPage.jsx
```

menggunakan:

```text
GameBoard
GameStatus
GroupMonitor
TeacherControls
```

---

# 6. Layout Architecture

Authenticated dashboard menggunakan layout berdasarkan role.

```text
AppRouter
 ├── SuperAdminLayout
 ├── AdminLayout
 ├── TeacherLayout
 └── StudentLayout
```

Dashboard layout:

```text
Layout
├── Sidebar
├── Header
└── Main
```

Mobile:

```text
Layout
├── MobileHeader
├── Drawer
└── Main
```

---

# 7. Authentication Architecture

Roles:

```text
SUPER_ADMIN
ADMIN
TEACHER
STUDENT
```

Student bukan authenticated role.

Student menggunakan:

```text
participant session
```

---

# 8. Auth Context

`AuthContext` bertanggung jawab terhadap:

```text
current user
role
access token state
login
logout
refresh
```

Tidak menyimpan:

```text
game state
student problem
teacher history
```

---

# 9. Access Token

Access token berlaku:

```text
2 hours
```

Saat expired:

```text
refresh token
```

Frontend tidak langsung logout.

Jika refresh berhasil:

```text
continue session
```

Jika refresh gagal:

```text
clear auth
redirect /login
```

---

# 10. Refresh Token

Refresh token harus diperlakukan sebagai credential sensitif.

Preferred browser strategy:

```text
HttpOnly
Secure
SameSite
```

Jika backend menggunakan HttpOnly cookie:

```text
frontend JavaScript tidak membaca refresh token
```

Access token dapat dikelola sesuai security architecture backend.

---

# 11. Axios/API Client

Gunakan satu centralized API client.

```text
services/api/apiClient.js
```

Responsibilities:

```text
baseURL
headers
access token
error handling
401 refresh
```

Feature service tidak membuat axios instance sendiri.

---

# 12. API Service Separation

Contoh:

```text
schoolApi.js
```

berisi:

```text
getSchools()
getSchool()
createSchool()
resetAdminPassword()
```

`teacherApi.js`:

```text
getTeachers()
createTeacher()
assignTeacher()
resetTeacherPassword()
```

---

# 13. Socket Architecture

Gunakan satu socket abstraction.

```text
socketClient.js
```

Responsibilities:

```text
connect
disconnect
reconnect
authentication
event subscription
event cleanup
```

Jangan membuat socket baru setiap render.

---

# 14. Socket Lifecycle

Teacher:

```text
login
 ↓
connect socket
 ↓
join game socket room
 ↓
listen events
 ↓
leave room
 ↓
disconnect when appropriate
```

Student:

```text
join room
 ↓
create/recover participant session
 ↓
connect
 ↓
join game room
 ↓
listen
```

---

# 15. Socket Room Separation

Gunakan logical rooms:

```text
game:{gameSessionId}
group:{groupId}
```

Teacher dapat menerima:

```text
game-level events
group-level events
```

Student hanya menerima:

```text
authorized game/group events
```

Backend tetap menentukan authorization.

---

# 16. Socket Event Constants

Jangan hardcode event string di banyak component.

Gunakan:

```text
socketEvents.js
```

Contoh:

```javascript
export const SOCKET_EVENTS = {
  GAME_STATE: "game:state",
  GAME_STARTED: "game:started",
  GAME_PAUSED: "game:paused",
  GAME_RESUMED: "game:resumed",
  CARD_REVEALED: "card:revealed",
  TURN_COMPLETED: "turn:completed",
  GAME_FINISHED: "game:finished",
};
```

---

# 17. Socket Cleanup

Setiap listener wajib dibersihkan.

```text
useEffect
  → socket.on()

cleanup
  → socket.off()
```

Tidak boleh terjadi:

```text
duplicate listeners
```

karena component remount.

---

# 18. Game State Architecture

Game state terdiri dari:

```text
game
participants
groups
assignments
turn
cards
connection
```

Frontend tidak boleh membuat matching sendiri.

---

# 19. Game State Source of Truth

Prioritas:

```text
Server
 ↓
Socket event / API snapshot
 ↓
Frontend state
 ↓
UI
```

Bukan:

```text
UI
 ↓
guess state
```

---

# 20. Game Store

`gameStore.js` menangani:

```text
currentGame
currentGroup
currentTurn
participants
cardState
connectionState
```

Jika project tidak membutuhkan state library tambahan, Context + reducer dapat digunakan.

Jangan menambah state library hanya untuk state kecil.

---

# 21. Recommended State Strategy

Administrative pages:

```text
local component state
+
API service
```

Authentication:

```text
AuthContext
```

Gameplay:

```text
GameContext / game store
+
Socket
```

Student session:

```text
Participant session hook
+
browser storage
```

---

# 22. Student Session

Setelah nama berhasil dikirim:

```text
participantSessionId
```

disimpan browser.

Recommended:

```text
sessionStorage
```

atau local storage jika reconnect lintas tab/reopen browser diperlukan oleh product behavior.

Session harus tidak berisi password.

---

# 23. Student Session Recovery

Saat membuka:

```text
/room/:roomCode
```

frontend mengecek:

```text
existing participant session
```

Jika ada:

```text
attempt reconnect
```

Jika valid:

```text
restore state
```

Jika invalid:

```text
start fresh join flow
```

---

# 24. Game Hooks

## useGame

Mengelola:

```text
game state
game actions
game events
```

## useSocket

Mengelola:

```text
socket lifecycle
```

## useRoom

Mengelola:

```text
room state
join
leave
```

## useParticipantSession

Mengelola:

```text
session persistence
recovery
```

---

# 25. Teacher Game Hook

Teacher membutuhkan:

```text
useTeacherGame()
```

Responsibilities:

```text
startGame()
pauseGame()
resumeGame()
revealCard()
completeTurn()
finishGame()
```

Hook tidak melakukan matching.

---

# 26. UI State vs Server State

UI state:

```text
modal open
sidebar open
selected tab
animation state
```

Server state:

```text
game status
turn
assignment
participant
group
room
```

Jangan mencampur keduanya.

---

# 27. Card State

Card component menerima server state:

```text
hidden
revealed
```

Animation internal:

```text
idle
flipping
complete
```

Animation state tidak mengubah game state.

---

# 28. Card Animation Implementation

HTML reference harus dipindahkan sedekat mungkin.

Recommended:

```text
GameCard.jsx
CardBack.jsx
CardFront.jsx
```

CSS animation dapat ditempatkan di:

```text
styles/card.css
```

Jika Tailwind tidak cukup untuk behavior 3D:

```text
custom CSS allowed
```

Jangan mengorbankan animation fidelity hanya agar semua CSS menjadi utility class.

---

# 29. Card CSS Rule

Pertahankan konsep:

```text
perspective
transform-style
backface-visibility
transform
transition
```

sesuai HTML reference.

Exact values harus mengikuti reference apabila tersedia.

---

# 30. Game Board

```text
GameBoard
├── GameHeader
├── CardPair
│   ├── ParticipantCard
│   └── ProblemCard
├── TurnIndicator
└── GameStatus
```

Teacher:

```text
GameBoard
├── ...
├── TeacherControls
└── GroupMonitor
```

---

# 31. Role-Based Rendering

Jangan duplikasi seluruh game board untuk Teacher dan Student.

Gunakan:

```text
shared GameBoard
```

dengan role-specific controls.

Contoh:

```text
Teacher:
GameBoard + TeacherControls

Student:
GameBoard + StudentStatus
```

---

# 32. Student Privacy

Student component tidak menerima:

```text
problemAuthor
teacherHistory
internalAssignment
```

Jika data tidak dibutuhkan UI:

```text
jangan kirim dari backend
```

Frontend filtering bukan security mechanism.

---

# 33. Teacher History

History page:

```text
TeacherHistoryPage
```

memanggil:

```text
historyApi
```

Hanya game milik teacher tersebut.

---

# 34. Admin School Isolation

Admin hanya mendapatkan:

```text
school data miliknya
```

Frontend tidak boleh menyediakan selector sekolah.

Backend tetap wajib memvalidasi school ownership.

---

# 35. Super Admin

Super Admin memiliki:

```text
all schools
```

dan dapat:

```text
create school
view school
reset admin password
```

---

# 36. Routing

Gunakan React Router.

Recommended:

```text
createBrowserRouter
```

atau:

```text
BrowserRouter + Routes
```

Pilih satu approach dan konsisten.

---

# 37. Route Protection

```text
ProtectedRoute
```

memeriksa:

```text
authenticated
```

`RoleRoute` memeriksa:

```text
required role
```

Contoh:

```text
/admin/*
→ ADMIN

/teacher/*
→ TEACHER
```

---

# 38. Public Routes

```text
/join
/room/:roomCode
```

Student flow tidak membutuhkan authentication.

---

# 39. Redirect Rules

Authenticated Admin membuka:

```text
/login
```

redirect:

```text
/admin/dashboard
```

Teacher:

```text
/teacher/dashboard
```

Super Admin:

```text
/dashboard
```

Unauthenticated dashboard access:

```text
redirect login
```

---

# 40. Environment Variables

`.env.example`:

```text
VITE_API_BASE_URL=
VITE_SOCKET_URL=
VITE_APP_NAME=PhillyoGo
```

Do not put:

```text
database password
JWT secret
refresh secret
private key
```

di frontend environment.

---

# 41. Vite Environment Rule

Hanya variable:

```text
VITE_*
```

yang boleh dianggap frontend-exposed.

Semua value tersebut harus dianggap public.

---

# 42. Tailwind Configuration

Gunakan:

```text
Tailwind CSS v3
```

`tailwind.config.js` harus memindai:

```text
./index.html
./src/**/*.{js,ts,jsx,tsx}
```

---

# 43. Design Tokens

Jika HTML reference memiliki warna tertentu:

```text
extract into Tailwind theme
```

Contoh:

```javascript
theme: {
  extend: {
    colors: {
      ...
    }
  }
}
```

Jangan mengulang hex value di puluhan component.

---

# 44. Assets

```text
assets/
├── images/
├── icons/
└── fonts/
```

Gunakan asset lokal untuk:

```text
logo
illustrations
custom fonts
game assets
```

Jika tidak diperlukan, jangan menambah asset besar.

---

# 45. Performance Rules

Prioritas:

```text
small bundle
lazy routes
optimized images
limited socket listeners
no unnecessary rerenders
```

Gunakan route lazy loading untuk dashboard-heavy pages bila diperlukan.

---

# 46. React Rendering

Hindari:

```text
large object recreation
inside render
```

Hindari:

```text
socket listener
inside component body
```

Gunakan:

```text
useEffect
```

untuk subscription.

---

# 47. Realtime Rendering Optimization

Jangan rerender seluruh dashboard untuk:

```text
one participant status change
```

Gunakan component boundaries:

```text
ParticipantList
ParticipantItem
GroupMonitor
GroupCard
```

---

# 48. Group Mode Optimization

Jika 5 group aktif:

```text
GroupCard x 5
```

Perubahan Group 1 tidak harus rerender Group 2–5.

State sebaiknya dipisah berdasarkan group ID.

---

# 49. API Error Handling

Normalize error:

```text
network error
401
403
404
409
422
500
```

UI message harus user-friendly.

Jangan menampilkan raw server stack.

---

# 50. Gameplay Error Handling

Contoh:

```text
GAME_NOT_READY
TURN_NOT_ACTIVE
TURN_ALREADY_REVEALED
GAME_ALREADY_PAUSED
GAME_FINISHED
UNAUTHORIZED
```

Frontend menampilkan pesan yang relevan.

---

# 51. Optimistic Updates

Untuk critical game actions:

```text
START
PAUSE
RESUME
REVEAL
COMPLETE
FINISH
```

jangan melakukan optimistic state sebagai authoritative state.

Flow:

```text
click
 ↓
request
 ↓
server validates
 ↓
server persists
 ↓
socket event
 ↓
UI updates
```

---

# 52. Button Loading

Saat request:

```text
REVEAL
```

button menjadi:

```text
loading / disabled
```

untuk mencegah accidental duplicate request.

Backend tetap wajib idempotent.

---

# 53. Connection Recovery

Display:

```text
CONNECTED
RECONNECTING
DISCONNECTED
```

Student:

```text
reconnect automatically
```

Teacher:

```text
reconnect automatically
```

After reconnect:

```text
request/receive state snapshot
```

---

# 54. State Snapshot

Frontend harus mampu replace/reconcile current state dari:

```text
GET game state
```

atau:

```text
socket state snapshot
```

Ini penting ketika event terlewat.

---

# 55. Stale Event Protection

Jika backend mengirim:

```text
stateVersion
```

frontend membandingkan:

```text
incoming.version
current.version
```

Jika incoming lebih lama:

```text
ignore
```

Jika lebih baru:

```text
apply
```

---

# 56. Browser Refresh

Teacher:

```text
refresh
→ auth recovery
→ game recovery if active
```

Student:

```text
refresh
→ participant session recovery
→ game state recovery
```

---

# 57. Browser Close

Student session tetap dapat direcover sesuai expiration/session policy.

Game state tetap berada di server.

Tidak boleh bergantung pada browser untuk menyimpan:

```text
assignment
turn
matching
```

---

# 58. Security Rules

Frontend:

```text
never trust role from localStorage alone
never trust game state from URL
never expose secrets
never expose teacher history to student
```

Backend adalah final authority.

---

# 59. Logging

Development:

```text
socket connection
socket event
API errors
game state transition
```

Production:

```text
avoid excessive console.log
```

Jangan log:

```text
password
JWT
refresh token
sensitive problem content unnecessarily
```

---

# 60. Testing Structure

Recommended:

```text
src/
└── __tests__/
    ├── components/
    ├── hooks/
    ├── services/
    └── utils/
```

Test:

```text
component rendering
role guards
student session
socket lifecycle
card states
game state rendering
```

---

# 61. E2E Priority

E2E paling penting:

```text
Teacher login
→ open room
→ student join
→ submit
→ all ready
→ start
→ reveal
→ complete
→ finish
```

Group:

```text
multiple groups
→ parallel turns
→ state isolation
```

Reconnect:

```text
student disconnect
→ reconnect
→ restore state
```

---

# 62. Build & Deployment

Frontend harus dapat dibuild:

```bash
npm run build
```

Output:

```text
dist/
```

Deployment dapat menggunakan static hosting.

Backend API dan Socket.IO berada di server terpisah.

---

# 63. API/Socket URL Separation

Development:

```text
Frontend
http://localhost:5173

Backend API
http://localhost:<API_PORT>

Socket
http://localhost:<SOCKET_PORT>
```

Production:

```text
Frontend
https://...

API
https://...

Socket
wss://...
```

---

# 64. CORS

Frontend tidak mengatur CORS.

Backend yang menentukan:

```text
allowed origins
```

Production origin harus explicit.

Jangan:

```text
Access-Control-Allow-Origin: *
```

untuk authenticated production API.

---

# 65. Mobile Performance

Target:

```text
fast first render
low JS execution
minimal animation overhead
```

Card animation tidak boleh menyebabkan:

```text
layout thrashing
```

Gunakan transform/opacity bila memungkinkan.

---

# 66. Final Architecture

```text
                    React App
                        │
             ┌──────────┴──────────┐
             │                     │
          Routes                 Context
             │              ┌──────┴──────┐
             │              │             │
           Pages           Auth          Game
             │                            │
        Components                    Hooks
             │                            │
             └──────────────┬─────────────┘
                            │
                       Services
                       ┌────┴────┐
                       │         │
                      API     Socket.IO
                       │         │
                       └────┬────┘
                            │
                         Backend
```

---

# 67. Frontend Golden Rules

```text
1. React + Vite only.
2. Tailwind CSS v3.
3. FE dan BE terpisah.
4. Server authoritative.
5. Matching tidak pernah dilakukan frontend.
6. Critical game actions tidak optimistic.
7. Socket listener selalu cleanup.
8. Student session harus reconnect-safe.
9. Teacher history tidak pernah dikirim ke student.
10. Problem author tidak pernah dikirim ke student.
11. Card animation mengikuti HTML reference.
12. Mobile-first.
13. Jangan menambah dependency tanpa alasan.
14. Jangan menyimpan secret di frontend.
15. Backend tetap menjadi security boundary.
```

---

# 68. Next Document

Setelah Frontend Architecture:

```text
Backend Architecture Specification
```

Dokumen berikutnya akan mengunci:

```text
Express architecture
modules
controllers
services
repositories
middleware
JWT + refresh token
Socket.IO server
authorization
school isolation
game engine
matching service
transactions
database access
rate limiting
security
logging
error handling
deployment
```
