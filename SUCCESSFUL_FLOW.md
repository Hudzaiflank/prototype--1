# PhillyoGo Successful Flow

Dokumen ini merangkum alur PhillyoGo yang sudah berhasil diuji pada environment lokal dan deployment frontend Cloudflare Pages.

## 1. Arsitektur Singkat

PhillyoGo terdiri dari:

- `backend`: Node.js, Express, MySQL, JWT, dan Socket.IO.
- `frontend`: React, Vite, Tailwind, REST API client, dan Socket.IO client.
- `database`: MySQL dengan migration dan seed.
- `prd`: spesifikasi alur produk, game state, realtime, dan UI.

Endpoint backend lokal:

```text
http://localhost:3000
```

API prefix:

```text
/api/v1
```

Frontend lokal:

```text
http://localhost:5173
```

Socket.IO namespace:

```text
/game
```

## 2. Menjalankan Lokal

### 2.1 Prasyarat

Pastikan tersedia:

- Node.js
- MySQL yang sedang berjalan
- Database `phillyogo`
- Dependency backend dan frontend

### 2.2 Backend

```powershell
cd E:\Innovation-hub\prototype-1\backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Health check:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "service": "phillyogo-backend",
    "status": "ok"
  }
}
```

### 2.3 Frontend

Buka terminal lain:

```powershell
cd E:\Innovation-hub\prototype-1\frontend
npm install
npm run dev
```

Frontend lokal menggunakan:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000/game
```

## 3. Akun Seed Lokal

### Super Admin

```text
Email: superadmin@gmail.com
Password: Bismillah
```

Jika password tidak berhasil, jalankan ulang:

```powershell
cd E:\Innovation-hub\prototype-1\backend
npm run db:seed
```

Seed memperbarui hash password Super Admin menjadi nilai `SEED_SUPER_ADMIN_PASSWORD` pada `.env`.

### Sample Admin

```text
Email: admin.sma-negeri-4-bandung@phillyogo.id
Password: SMA4@2026
```

### Teacher

Teacher dibuat oleh Admin. Password default saat pembuatan teacher:

```text
Guru@123
```

## 4. Alur Role

### 4.1 Super Admin

1. Login sebagai Super Admin.
2. Melihat dashboard.
3. Membuat atau mengelola sekolah.
4. Melihat detail sekolah.
5. Mengaktifkan atau menonaktifkan sekolah.
6. Mereset password Admin sekolah.

### 4.2 Admin Sekolah

1. Login sebagai Admin.
2. Melihat dashboard sekolah.
3. Membuat kelas.
4. Membuat teacher.
5. Menghubungkan teacher ke kelas.
6. Membuat atau mengelola topik.
7. Mereset password teacher bila diperlukan.

### 4.3 Guru

1. Login sebagai Teacher.
2. Membuka kelas yang ditugaskan.
3. Membuka room.
4. Membuat game session.
5. Memilih topik.
6. Memilih input mode:
   - `STUDENT`: student mengisi nama dan masalah sendiri.
   - `TEACHER`: teacher memasukkan participant dan masalah.
7. Memilih game mode:
   - `GROUPS`: participant dibagi ke kelompok.
   - `ALL_STUDENTS`: tidak ada label kelompok.
8. Membuka halaman monitor room.
9. Menunggu participant masuk.
10. Memulai game.
11. Memantau kelompok dan turn.
12. Melakukan pause, resume, reveal card, complete turn, atau finish game.
13. Melihat history setelah game selesai.

### 4.4 Student

1. Membuka halaman join room.
2. Memasukkan kode room.
3. Melihat topik game.
4. Mengisi nama dan satu masalah.
5. Menunggu guru memulai game.
6. Saat game berjalan:
   - Melihat topik.
   - Jika mode `GROUPS`, melihat `Kelompok N`.
   - Mengikuti turn dan card game.
7. Melihat hasil setelah game selesai.

## 5. Alur Room dan Game Session

### 5.1 Teacher Membuat Room

Teacher membuka room dari kelas yang sudah ditugaskan. Room menghasilkan kode enam karakter yang digunakan student untuk masuk.

### 5.2 Teacher Membuat Session

Teacher membuat game session dengan konfigurasi:

```json
{
  "topicId": 1,
  "inputMode": "STUDENT",
  "gameMode": "GROUPS",
  "problemDisplayLimit": 1,
  "groupCount": 2
}
```

Topik dipersist ke game session. Student menerima `topicTitle` saat join room dan saat mengambil state game.

### 5.3 Student Join

Student mengirim kode room melalui:

```http
POST /api/v1/public/rooms/join
```

Setelah room ditemukan, frontend menyimpan data room dan membuka form input student.

### 5.4 Student Register

Student mengirim:

```http
POST /api/v1/public/game-sessions/:sessionId/participants
```

Payload:

```json
{
  "sessionId": "participant-session-uuid",
  "fullName": "Nama Student"
}
```

Backend membuat participant dengan session UUID yang dapat digunakan untuk reconnect.

### 5.5 Student Submit Problem

Student mengirim:

```http
POST /api/v1/public/game-sessions/:sessionId/problems
```

Payload:

```json
{
  "participantSessionId": "participant-session-uuid",
  "content": "Masalah yang ingin dibagikan"
}
```

Setelah berhasil, student diarahkan ke waiting room.

## 6. Waiting Room dan Monitoring Teacher

Saat session berstatus `WAITING`:

- Teacher melihat daftar nama student yang sudah join.
- Daftar diperbarui realtime melalui event `participant-joined`.
- Jika student keluar, status participant berubah melalui `participant-status-changed`.
- Jika student reconnect, status dikembalikan menjadi `CONNECTED`.
- Hanya nama participant yang ditampilkan pada panel waiting.
- Setelah game dimulai, panel waiting menghilang dan teacher melihat tampilan kelompok seperti biasa.

Event realtime yang digunakan:

```text
participant-joined
participant-status-changed
state-snapshot
all-participants-ready
```

## 7. Start, Grouping, dan Gameplay

Teacher dapat melakukan start setelah participant dan problem memenuhi requirement.

Saat start:

1. Backend mengunci game session.
2. Backend membuat kelompok jika mode `GROUPS`.
3. Backend membuat assignment.
4. Backend membuat game turn.
5. Student menerima state terbaru melalui Socket.IO.
6. Student melihat nomor kelompok, misalnya:

```text
Kelompok 2
```

Pada mode `ALL_STUDENTS`, label kelompok tidak ditampilkan.

Setiap group memiliki turn sendiri. Teacher dapat memilih kelompok di monitor dan mengatur:

- reveal card
- complete turn
- pause game
- resume game
- finish game

## 8. Pause, Keluar, dan Reconnect

Jika game sedang `PAUSED` lalu student keluar dari website:

1. Socket student disconnect.
2. Backend mengubah status participant menjadi `DISCONNECTED`.
3. Game tetap `PAUSED`.
4. Assignment, group, problem, turn, dan history tetap tersimpan.
5. Tidak ada participant baru yang dibuat saat reconnect.

Saat student masuk kembali:

1. Student memasukkan kode room yang sama.
2. Frontend membaca `participantSessionId` lama dari `localStorage`.
3. Frontend mencocokkan session lama dengan `gameSessionId` room.
4. Frontend meminta state melalui:

```http
GET /api/v1/public/game-sessions/:sessionId/state
x-participant-session-id: participant-session-uuid
```

5. Jika session valid, student langsung diarahkan ke halaman yang sesuai:
   - `WAITING`: waiting room
   - `PLAYING` atau `PAUSED`: game room
   - `FINISHED`: result room
6. Backend mengembalikan participant lama menjadi `CONNECTED`.
7. Group, assignment, current turn, dan progress dipulihkan.

Jika browser storage dihapus atau session tidak ditemukan, frontend menganggap student sebagai participant baru dan menampilkan form input.

## 9. Socket.IO Realtime Flow

### Student Socket

Student connect dengan:

```json
{
  "participantSessionId": "participant-session-uuid",
  "gameSessionId": 123
}
```

### Teacher Socket

Teacher connect dengan access token:

```json
{
  "token": "teacher-access-token"
}
```

### Event Utama

```text
state-snapshot
room-state
participant-joined
participant-status-changed
your-session-restored
your-group-assigned
game-started
game-paused
game-resumed
turn-started
cards-revealed
turn-completed
game-finished
server-error
```

State yang menjadi sumber kebenaran adalah state backend. Frontend hanya menampilkan snapshot dan event yang diterima.

## 10. Deployment Frontend dengan Cloudflare Pages

### 10.1 Environment Variable Production

Set variable langsung di Cloudflare Pages, bukan hanya di `.env.production.local` lokal:

```env
VITE_API_URL=https://YOUR-BACKEND-HOST/api/v1
VITE_SOCKET_URL=https://YOUR-BACKEND-HOST/game
```

Setelah mengubah variable, lakukan redeploy karena `VITE_*` ditanam ke bundle saat build.

### 10.2 Quick Tunnel untuk Testing

Backend lokal dapat diekspos sementara dengan:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Cloudflare akan memberi URL seperti:

```text
https://example.trycloudflare.com
```

Gunakan URL tersebut dengan path:

```env
VITE_API_URL=https://example.trycloudflare.com/api/v1
VITE_SOCKET_URL=https://example.trycloudflare.com/game
```

Catatan:

- Quick Tunnel bersifat sementara.
- URL berubah ketika proses `cloudflared` berhenti atau restart.
- Jika hostname tidak resolve, tunnel sudah mati atau URL sudah berubah.
- Setelah URL berubah, update environment variable Cloudflare Pages dan redeploy.
- Untuk penggunaan stabil, gunakan named tunnel atau backend yang memiliki domain tetap.

### 10.3 Validasi CORS Production

Origin frontend harus terdaftar di backend melalui `FRONTEND_URLS`:

```env
FRONTEND_URLS=http://localhost:5173,https://your-frontend.pages.dev
```

Preflight yang berhasil harus mengembalikan:

```text
Status: 204
Access-Control-Allow-Origin: https://your-frontend.pages.dev
Access-Control-Allow-Credentials: true
```

Jika hostname tunnel sudah tidak resolve, error browser dapat terlihat seperti error CORS walaupun akar masalahnya adalah URL backend tidak aktif.

## 11. Validasi yang Sudah Berhasil

### Backend

```powershell
cd E:\Innovation-hub\prototype-1\backend
npm test
```

Hasil terakhir:

```text
9 passed
1 skipped
0 failed
```

Test yang berhasil mencakup:

- room code format
- login validator
- class validator
- perfect matching
- invalid one-participant matching
- public event sanitization
- rate limiter
- game state transition
- socket event contract

### Frontend

```powershell
cd E:\Innovation-hub\prototype-1\frontend
npm run lint
npm run build
```

Keduanya berhasil.

### Runtime

Health endpoint lokal berhasil mengembalikan HTTP `200`.

Login Super Admin berhasil dengan:

```text
Email: superadmin@gmail.com
Password: Bismillah
```

CORS preflight lokal dan tunnel aktif juga sudah berhasil diverifikasi saat URL tunnel masih aktif.

## 12. Troubleshooting Cepat

### Login mendapatkan 401

Periksa:

- email `superadmin@gmail.com`
- password `Bismillah`
- backend memakai database lokal yang benar
- jalankan `npm run db:seed`

### Error CORS atau `net::ERR_FAILED`

Periksa:

1. URL backend masih resolve.
2. URL API memiliki `/api/v1`.
3. Cloudflare Pages sudah redeploy.
4. `VITE_API_URL` dan `VITE_SOCKET_URL` memakai tunnel yang sama.
5. Origin frontend terdaftar di `FRONTEND_URLS`.

### Request menuju `/auth/login` tanpa `/api/v1`

Bundle frontend masih memakai base URL yang salah. Nilai yang benar:

```text
https://backend-host/api/v1
```

### Backend watch berhenti atau crash

Jalankan tanpa watch untuk melihat error lengkap:

```powershell
cd E:\Innovation-hub\prototype-1\backend
npm start
```

### Tunnel tidak dapat diakses

Cek:

```powershell
Get-Process cloudflared
Invoke-WebRequest -UseBasicParsing https://YOUR-TUNNEL.trycloudflare.com/health
```

Jika hostname tidak resolve, buat tunnel baru dan update environment production.

## 13. Checklist Smoke Test

- [ ] MySQL berjalan.
- [ ] Migration berhasil.
- [ ] Seed berhasil.
- [ ] Backend health mengembalikan `200`.
- [ ] Frontend dapat dibuka.
- [ ] Super Admin dapat login.
- [ ] Admin dapat membuat class dan teacher.
- [ ] Teacher dapat membuka room.
- [ ] Teacher dapat membuat session dan memilih topik.
- [ ] Student dapat join memakai room code.
- [ ] Student dapat melihat topik.
- [ ] Student dapat submit nama dan problem.
- [ ] Teacher melihat nama participant saat waiting.
- [ ] Daftar participant ter-update realtime.
- [ ] Teacher dapat start game.
- [ ] Student melihat nomor kelompok pada mode `GROUPS`.
- [ ] Student tidak melihat label kelompok pada mode `ALL_STUDENTS`.
- [ ] Teacher dapat pause dan resume game.
- [ ] Student yang keluar dapat reconnect ke session lama.
- [ ] State game dan assignment tetap tersimpan setelah reconnect.
- [ ] Frontend production memakai API URL yang aktif.
- [ ] Cloudflare Pages sudah redeploy setelah perubahan environment.
