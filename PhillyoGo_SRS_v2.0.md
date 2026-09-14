# PhillyoGo — Software Requirements Specification (SRS)

**Version:** 2.0  
**Status:** Final Requirements Baseline  
**Project:** PhillyoGo — Digitalisasi Board Game Mental Health  
**Frontend:** React + Vite + Tailwind CSS v3  
**Backend:** Express.js  
**Database:** MySQL  
**Realtime:** Socket.IO  
**Authentication:** JWT + Refresh Token

---

# 1. Pendahuluan

## 1.1 Tujuan

PhillyoGo adalah platform digital untuk membantu Guru BK/fasilitator menjalankan board game mental health secara terstruktur, anonymous, realtime, dan terkontrol.

Sistem memungkinkan Guru membuka room permainan untuk satu kelas, mengumpulkan peserta dan permasalahan, melakukan pembagian secara fair menggunakan perfect matching, kemudian menjalankan permainan menggunakan dua kartu:

- Kartu kiri: nama peserta yang menerima giliran.
- Kartu kanan: permasalahan yang diterima secara anonymous.

Sistem juga menyediakan monitoring dan history permainan untuk Guru.

---

# 2. Scope Sistem

Sistem mencakup:

- Manajemen sekolah.
- Manajemen Admin sekolah.
- Manajemen Guru.
- Manajemen kelas.
- Assignment Guru ke kelas.
- Manajemen daftar permasalahan/topik.
- Room permainan.
- Konfigurasi permainan.
- Input peserta.
- Input permasalahan.
- Import data melalui Excel.
- Pembagian kelompok.
- Perfect matching.
- Gameplay realtime.
- Pause/resume.
- Reconnect peserta.
- Monitoring permainan.
- History permainan.
- Authentication dan authorization.
- Reset password.
- Retention data permainan 30 hari.

---

# 3. Role Sistem

Terdapat empat role utama:

```text
SUPER ADMIN
ADMIN
GURU
MURID
```

---

# 4. Matriks Hak Akses

| Fitur | Super Admin | Admin | Guru | Murid |
|---|---:|---:|---:|---:|
| Login | ✓ | ✓ | ✓ | - |
| Register | - | - | - | - |
| Membuat sekolah | ✓ | - | - | - |
| Melihat daftar sekolah | ✓ | - | - | - |
| Reset password Admin | ✓ | - | - | - |
| Kelola kelas | - | ✓ | - | - |
| Kelola Guru | - | ✓ | - | - |
| Assign Guru | - | ✓ | - | - |
| Reset password Guru | - | ✓ | - | - |
| Kelola topic sekolah | - | ✓ | ✓ | - |
| Membuat private topic | - | - | ✓ | - |
| Melihat kelas | - | ✓ | ✓ | - |
| Membuat room | - | - | ✓ | - |
| Konfigurasi permainan | - | - | ✓ | - |
| Monitoring permainan | - | - | ✓ | - |
| History permainan | - | - | ✓* | - |
| Ganti password | - | ✓ | ✓ | - |
| Join room | - | - | - | ✓ |
| Input nama | - | - | - | ✓ |
| Input masalah | - | - | - | ✓ |
| Melihat kelompok | - | - | - | ✓ |
| Gameplay | - | - | - | ✓ |

`*` Hanya Guru yang membuat game/session tersebut.

---

# 5. Super Admin

## 5.1 Karakteristik

Super Admin merupakan role dengan scope sistem secara keseluruhan.

Hanya terdapat satu akun Super Admin.

Super Admin tidak memiliki fitur register.

Credential Super Admin ditentukan ketika sistem pertama kali dikembangkan/deploy.

Super Admin tidak dapat mengganti password melalui aplikasi.

## 5.2 Fitur

Super Admin memiliki:

```text
Login
Dashboard
Daftar Sekolah
Tambah Sekolah
Detail Sekolah
Reset Password Admin
```

## 5.3 Membuat Sekolah

Super Admin menginput data sekolah.

Setelah berhasil:

```text
Create School
     ↓
Generate Admin
     ↓
Generate Admin Email
     ↓
Generate Admin Password
     ↓
Save School + Admin
```

Operasi harus atomic.

Jika pembuatan Admin gagal, pembuatan sekolah harus dibatalkan.

## 5.4 Format Credential Admin

Contoh:

```text
Admin Email:
admin.sman4bandung@phillyogo.id

Password:
SMA4@2026
```

Satu sekolah hanya memiliki satu Admin.

Admin tidak dapat membuat Admin lain.

## 5.5 Reset Password Admin

Jika Admin lupa password:

```text
Admin
 ↓
Super Admin
 ↓
Reset Password
```

---

# 6. Admin Sekolah

## 6.1 Scope

Admin hanya dapat mengakses data sekolahnya sendiri.

Admin sekolah tidak dapat:

- Membuat Admin lain.
- Mengakses sekolah lain.
- Mengakses history permainan Guru.

## 6.2 Fitur

```text
Login
Dashboard
Kelola Kelas
Kelola Guru
Assign Guru
Detail Kelas
Reset Password Guru
Kelola Daftar Permasalahan
Ganti Password
```

---

# 7. Manajemen Kelas

Admin dapat membuat kelas.

Struktur:

```text
Tingkat:
X

Jurusan:
IPA

Nomor:
1
```

Nama kelas:

```text
X-IPA-1
```

Tingkat yang tersedia:

```text
X
XI
XII
```

Contoh:

```text
X-IPA-1
X-IPA-2
XI-IPA-1
XII-IPS-1
```

Satu sekolah tidak boleh memiliki dua kelas dengan kombinasi:

```text
Tingkat + Jurusan + Nomor
```

yang sama.

---

# 8. Manajemen Guru

Admin dapat membuat data Guru.

Guru tidak dapat register sendiri.

Data Guru minimal:

```text
Nama lengkap
Data identitas yang dibutuhkan sistem
```

Email Guru otomatis dibuat.

Format:

```text
guru.nama@sman4bandung.co.id
```

Default password:

```text
Guru@123
```

Admin dapat:

- Membuat Guru.
- Melihat Guru.
- Mengedit data Guru.
- Assign Guru ke kelas.
- Reset password Guru.

---

# 9. Assignment Guru

Satu kelas dapat memiliki banyak Guru.

Satu Guru dapat mengajar banyak kelas.

Assignment dilakukan oleh Admin sekolah.

Rule:

```text
Guru dan kelas harus berasal dari sekolah yang sama.
```

---

# 10. Reset Password Guru

Guru dapat mengganti password sendiri.

Jika lupa:

```text
Guru
 ↓
Admin
 ↓
Reset Password
 ↓
Guru@123
```

Reset password hanya dapat dilakukan Admin.

---

# 11. Daftar Permasalahan / Topic

Sistem memiliki daftar topik/permasalahan.

Topik dapat dibuat oleh:

- Admin sekolah.
- Guru.

Guru juga dapat membuat topic baru secara pribadi.

## 11.1 School Topic

Topic yang dibuat Admin dapat digunakan dalam sekolah tersebut sesuai hak akses.

## 11.2 Private Topic

Topic yang dibuat Guru dapat dibuat private.

Private topic hanya dapat diakses Guru pembuatnya.

Guru lain tidak dapat menggunakan private topic tersebut.

---

# 12. Guru

## 12.1 Authentication

Guru:

- Tidak dapat register.
- Login menggunakan email/password yang dibuat Admin.
- Dapat logout.
- Dapat mengganti password.
- Dapat di-reset password oleh Admin.

## 12.2 Fitur

```text
Login
Dashboard
Daftar Kelas
Detail Kelas
Open Room
Konfigurasi Permainan
Monitoring Permainan
History Permainan
Ganti Password
```

Guru hanya dapat mengakses kelas yang diassign kepadanya.

---

# 13. Room

Room dibuat oleh Guru.

Satu kelas hanya boleh memiliki satu room aktif pada satu waktu.

Room memiliki kode:

```text
6 karakter
```

Karakter:

```text
A-Z
0-9
```

Contoh:

```text
A7K2P9
```

## 13.1 Room Code Rules

Room code:

- Harus unik secara global.
- Tidak boleh sama dengan room lain.
- Setelah room ditutup, code hangus selamanya.
- Code yang sudah pernah digunakan tidak boleh digunakan kembali.
- Penutupan room tidak menghapus data kelas.
- Satu kelas hanya boleh memiliki satu room aktif.

## 13.2 Room Lifecycle

```text
WAITING
   ↓
PLAYING
   ↓
PAUSED
   ↓
PLAYING
   ↓
FINISHED
   ↓
CLOSED
```

Tidak semua transisi harus digunakan pada setiap session.

---

# 14. Konfigurasi Permainan

Sebelum permainan dimulai, Guru menentukan:

```text
Topic / Permasalahan
Input Mode
Game Mode
Problem Display Limit
```

Jika menggunakan kelompok:

```text
Jumlah Kelompok
```

---

# 15. Input Mode

Terdapat dua mode.

## 15.1 Student Input

Murid mengisi:

```text
Nama lengkap
Permasalahan
```

Murid hanya dapat mengisi satu masalah.

## 15.2 Teacher Input

Guru memasukkan:

```text
Nama murid
Permasalahan
```

Untuk mempercepat input, sistem wajib mendukung import Excel.

Alur:

```text
Upload Excel
      ↓
Parse
      ↓
Validate
      ↓
Preview
      ↓
Confirm
      ↓
Insert
```

Jika validasi gagal, data tidak boleh masuk sebagian.

---

# 16. Student Access

Murid tidak perlu login.

Alur:

```text
Website
 ↓
Join Room
 ↓
Input 6 digit/karakter room code
 ↓
Validasi room
 ↓
Jika valid → masuk
Jika invalid/closed → ditolak
```

Room code harus sesuai dengan room yang sedang aktif.

---

# 17. Student Session

Setelah murid memasukkan nama lengkap, sistem membuat:

```text
Student/Participant Session ID
```

Session ID disimpan pada browser.

Session ID digunakan untuk:

- Identifikasi participant.
- Reconnect.
- Melanjutkan state.
- Mengambil assignment.
- Mempertahankan kelompok.

Nama tidak menjadi identifier utama.

---

# 18. Duplicate Name

Jika terdapat nama yang sama:

```text
Andi
Andi
```

sistem tetap membedakan participant berdasarkan session ID.

Nama dapat ditampilkan kepada Guru dengan mekanisme yang membedakan peserta jika diperlukan.

---

# 19. Participant Status

Peserta memiliki tiga status utama:

```text
CONNECTED
DISCONNECTED
FINISHED
```

## CONNECTED

Peserta sedang terhubung.

## DISCONNECTED

Browser/device terputus.

Assignment tetap tersimpan.

## FINISHED

Peserta telah menyelesaikan partisipasinya setelah game selesai.

---

# 20. Reconnect

Jika peserta disconnect:

```text
CONNECTED
     ↓
DISCONNECTED
```

Data tetap disimpan.

Jika reconnect menggunakan session ID yang sama:

```text
DISCONNECTED
     ↓
CONNECTED
```

Peserta melanjutkan permainan sebelumnya.

Sistem tidak membuat participant baru.

Assignment tidak dibuat ulang.

Group tidak dibuat ulang.

---

# 21. Problem Submission

Dalam Student Input:

```text
Nama
+
Permasalahan
```

Satu peserta menghasilkan satu masalah.

Dalam satu game session:

```text
1 participant = 1 problem
```

Semua peserta harus submit sebelum permainan dapat dimulai.

---

# 22. Start Game Rule

Guru tidak dapat memulai permainan sampai seluruh peserta memenuhi requirement.

Contoh:

```text
30 peserta
29 submit
```

Maka:

```text
START = DITOLAK
```

Jika:

```text
30 peserta
30 problem
```

maka sistem dapat melakukan matching.

---

# 23. Perfect Matching

Sistem menggunakan perfect matching.

Untuk N peserta:

```text
N participant
N problem
N assignment
```

Rules:

1. Satu participant hanya mendapatkan satu problem.
2. Satu problem hanya diberikan satu kali.
3. Participant tidak boleh mendapatkan problem miliknya sendiri.
4. Matching harus lengkap.
5. Matching dibuat server-side.
6. Matching diacak.
7. Setelah dibuat, assignment fixed.

Jika perfect matching tidak dapat dibuat:

```text
GAME START = REJECTED
```

Sistem tidak boleh menjalankan permainan sebagian.

---

# 24. Assignment

Assignment dihasilkan saat game dimulai.

Contoh:

```text
A → Problem C
B → Problem A
C → Problem D
D → Problem B
```

Tidak valid:

```text
A → Problem A
```

Assignment tidak boleh berubah karena:

- Refresh.
- Reconnect.
- Browser close.
- Pause.
- Resume.

---

# 25. Anonymous Problem

Saat kartu masalah dibuka, peserta hanya dapat melihat:

```text
Problem Text
```

Tidak boleh melihat:

```text
Nama pembuat masalah
Participant ID pembuat
```

Contoh:

```text
Saya sering merasa tidak percaya diri
ketika berbicara di depan kelas.
```

Tidak boleh:

```text
Ditulis oleh: Andi
```

---

# 26. Problem Display Limit

Guru dapat menentukan limit masalah yang sedang ditampilkan kepada siswa ketika melakukan Open Room.

Limit ini berlaku pada tampilan siswa.

Guru tetap dapat melihat data lengkap sesuai hak aksesnya.

---

# 27. Game Mode

Terdapat dua skema.

## 27.1 All Students

Seluruh siswa bermain bersama.

Hanya terdapat satu board/game state.

## 27.2 Groups

Guru menentukan jumlah kelompok.

Sistem membagi peserta secara fair.

Setiap kelompok:

- Memiliki board sendiri.
- Memiliki game state sendiri.
- Memiliki turn sendiri.
- Dapat bermain bersamaan dengan kelompok lain.
- Hanya memiliki satu pasangan kartu aktif pada satu waktu.

Guru tetap menjadi controller.

---

# 28. Fair Group Distribution

Pembagian kelompok dilakukan setelah seluruh peserta siap.

Ukuran kelompok harus seimbang.

Contoh:

```text
29 siswa
5 kelompok

6
6
6
6
5
```

Contoh:

```text
31 siswa
4 kelompok

8
8
8
7
```

Perbedaan jumlah peserta antar kelompok maksimal 1 jika memungkinkan.

Peserta diacak terlebih dahulu.

Setelah game dimulai, membership kelompok bersifat fixed.

---

# 29. Group State

Untuk group mode:

```text
Session
 ├── Group 1
 │    └── Game State 1
 │
 ├── Group 2
 │    └── Game State 2
 │
 └── Group 3
      └── Game State 3
```

Kelompok dapat bermain secara paralel.

Satu kelompok tidak boleh mengubah state kelompok lain.

---

# 30. Card System

Tampilan utama permainan terdiri dari dua kartu:

```text
Kartu kiri  = Participant
Kartu kanan = Problem
```

Sebelum kartu dibuka:

```text
[ CARD BACK ]   [ CARD BACK ]
```

Informasi tidak boleh terlihat.

Ketika turn dimulai:

```text
[ NAMA ]   [ MASALAH ]
```

Kartu kiri dan kanan dibuka pada saat permainan dimulai sesuai animasi yang ditentukan.

---

# 31. Active Card Pair

Dalam satu kelompok hanya boleh ada satu pasangan kartu aktif.

```text
Group 1:
Turn 5 = ACTIVE
```

Tidak boleh:

```text
Turn 5 = ACTIVE
Turn 6 = ACTIVE
```

Tetapi kelompok berbeda dapat aktif bersamaan:

```text
Group 1 → Turn 5
Group 2 → Turn 3
Group 3 → Turn 7
```

---

# 32. Game Turn

Turn mempunyai state:

```text
PENDING
ACTIVE
COMPLETED
```

Card state:

```text
HIDDEN
REVEALED
```

Flow:

```text
PENDING
   ↓
ACTIVE
   ↓
REVEALED
   ↓
COMPLETED
```

---

# 33. Game Control

Guru menjadi controller permainan.

Guru dapat:

- Start game.
- Membuka pasangan kartu.
- Melanjutkan turn.
- Pause game.
- Resume game.
- Mengakhiri game sesuai state permainan.
- Monitoring peserta.

Murid tidak memiliki kontrol global terhadap game.

---

# 34. Pause

Permainan dapat dipause jika belum selesai.

Saat pause:

- Assignment tetap.
- Group tetap.
- Turn tetap.
- Game state tetap.
- Participant tetap tersimpan.
- History tetap tersimpan.

Permainan dapat dilanjutkan pada minggu berikutnya.

---

# 35. Resume

Saat Guru login kembali:

```text
PAUSED
   ↓
RESUME
   ↓
PLAYING
```

Sistem mengambil state terakhir dari database.

Tidak boleh:

- Mengacak ulang peserta.
- Membuat group baru.
- Membuat assignment baru.
- Mengubah turn yang sudah selesai.

---

# 36. Monitoring

Guru dapat melihat status permainan secara realtime.

Monitoring mencakup informasi yang diperlukan untuk menjalankan permainan, seperti:

```text
Jumlah peserta
Peserta connected
Peserta disconnected
Peserta selesai
Status group
Progress permainan
Turn aktif
```

Monitoring tidak boleh mengekspos author problem kepada murid.

---

# 37. History

History tersedia setelah permainan berjalan/selesai sesuai state.

History hanya dapat diakses oleh:

```text
Guru yang membuat game session
```

Guru dapat melihat:

```text
Nama peserta
Problem yang diterima
Urutan permainan
Group
Status assignment
History turn
```

Murid tidak dapat melihat history global.

Admin tidak dapat melihat history permainan Guru.

Guru lain tidak dapat melihat history Guru tersebut.

---

# 38. Realtime Requirement

Gameplay wajib realtime.

Teknologi:

```text
Socket.IO
```

Database tetap menjadi source of truth.

Flow:

```text
Guru Action
    ↓
Backend Validation
    ↓
Database Transaction
    ↓
Socket.IO Broadcast
    ↓
Client Update
```

Frontend tidak boleh menjadi source of truth untuk state permainan.

Jika server restart, state harus dapat dipulihkan dari database.

---

# 39. Authentication

Authentication digunakan untuk:

```text
Super Admin
Admin
Guru
```

Murid tidak menggunakan authentication akun.

---

# 40. JWT

Access token menggunakan JWT.

Masa berlaku:

```text
2 jam
```

Ketika access token expired, user tidak langsung dipaksa login ulang jika refresh token masih valid.

---

# 41. Refresh Token

Sistem menggunakan refresh token.

Flow:

```text
Access Token Expired
        ↓
Refresh Token
        ↓
Validate
        ↓
Issue New Access Token
```

Refresh token harus:

- Secure.
- Disimpan secara aman.
- Tidak menyimpan plaintext token di database.
- Dapat dicabut/revoke.
- Memiliki expiry.

---

# 42. Password Security

Password tidak boleh disimpan plaintext.

Gunakan password hashing yang aman dan efisien.

Contoh pendekatan:

```text
Argon2id
```

atau algoritma secure password hashing equivalent.

---

# 43. Authorization

Authorization wajib dilakukan di backend.

Frontend route protection saja tidak cukup.

Contoh:

Guru SMA 4 tidak boleh mengakses:

```text
kelas SMA 5
room SMA 5
game session SMA 5
```

meskipun mengetahui ID resource.

Backend harus melakukan school/ownership validation.

---

# 44. Data Isolation

## Super Admin

Scope:

```text
ALL SCHOOLS
```

## Admin

Scope:

```text
OWN SCHOOL
```

## Guru

Scope:

```text
OWN SCHOOL
+
ASSIGNED CLASSES
+
OWN GAME SESSIONS
```

## Murid

Scope:

```text
OWN PARTICIPANT SESSION
```

---

# 45. UI / Visual Requirement

HTML yang diberikan oleh pemilik proyek menjadi referensi visual utama.

Implementasi React harus mempertahankan semirip mungkin:

- Layout.
- Card.
- Warna.
- Typography.
- Spacing.
- Border.
- Shadow.
- Hover.
- Transition.
- Animation.
- Card flip.
- Interaction behavior.

Jika memungkinkan, behavior dan animasi harus di-copy secara fungsional dari HTML reference.

Namun implementasi harus disesuaikan ke:

```text
React
Vite
Tailwind CSS v3
```

---

# 46. Responsive Requirement

Seluruh sistem wajib responsive.

Target:

```text
Mobile
Tablet
Desktop
```

Gameplay harus menjadi prioritas utama untuk mobile karena murid kemungkinan besar menggunakan smartphone.

---

# 47. Frontend Architecture

Frontend dan backend harus dipisahkan.

Struktur repository:

```text
phillyogo/
│
├── frontend/
│
└── backend/
```

Frontend:

```text
React
Vite
Tailwind CSS v3
```

Backend:

```text
Node.js
Express.js
Socket.IO
```

---

# 48. Backend Requirements

Backend bertanggung jawab terhadap:

- Authentication.
- Authorization.
- School isolation.
- CRUD.
- Room generation.
- Room validation.
- Participant session.
- Problem submission.
- Excel import.
- Group generation.
- Perfect matching.
- Assignment persistence.
- Game state.
- Turn state.
- Pause/resume.
- Reconnect.
- Realtime event authorization.
- History.
- Password reset.
- Retention.

---

# 49. Database Requirements

Database:

```text
MySQL
```

Database menjadi source of truth untuk:

- Room.
- Participant.
- Problem.
- Group.
- Assignment.
- Turn.
- Game session.
- Pause/resume state.
- History.

Critical operations harus menggunakan transaction.

---

# 50. School Creation Transaction

Saat Super Admin membuat sekolah:

```text
BEGIN
 ↓
Create School
 ↓
Generate Admin
 ↓
Create Admin
 ↓
COMMIT
```

Jika salah satu gagal:

```text
ROLLBACK
```

---

# 51. Game Start Transaction

Saat Guru menekan START:

```text
BEGIN
 ↓
Validate Room
 ↓
Validate Participants
 ↓
Validate Problems
 ↓
Check All Submitted
 ↓
Generate Groups
 ↓
Generate Perfect Matching
 ↓
Validate Matching
 ↓
Persist Assignments
 ↓
Create Turns
 ↓
Set Game PLAYING
 ↓
COMMIT
```

Jika matching gagal:

```text
ROLLBACK
```

Game tidak dimulai.

---

# 52. Game Completion

Game dianggap selesai setelah seluruh assignment/turn yang diperlukan telah selesai.

Setelah game selesai:

```text
Participants
→ FINISHED
```

Room dapat ditutup oleh Guru.

Setelah room ditutup:

```text
Room Code = Permanently Expired
```

---

# 53. Data Retention

Data permainan disimpan selama:

```text
30 hari
```

Setelah 30 hari, data game dapat dihapus.

Data yang termasuk:

- Game session.
- Participant.
- Participant problem.
- Group.
- Group membership.
- Assignment.
- Turn.
- History.

Master data tidak ikut dihapus:

```text
School
Admin
Teacher
Class
Teacher Assignment
Problem Topic
```

Room code yang pernah digunakan tetap dianggap pernah digunakan sehingga tidak dapat direuse.

---

# 54. Audit

Aktivitas administratif dan kritis harus dapat dicatat.

Contoh:

```text
SCHOOL_CREATED
ADMIN_PASSWORD_RESET
TEACHER_CREATED
TEACHER_PASSWORD_RESET
TEACHER_ASSIGNED
ROOM_CREATED
GAME_STARTED
GAME_PAUSED
GAME_RESUMED
GAME_FINISHED
ROOM_CLOSED
```

---

# 55. Error Handling

Backend harus menggunakan error code yang konsisten.

Contoh:

```text
INVALID_ROOM_CODE
ROOM_CLOSED
ROOM_NOT_OPEN
PARTICIPANT_SESSION_INVALID
DUPLICATE_SUBMISSION
INCOMPLETE_PARTICIPANTS
PERFECT_MATCHING_FAILED
UNAUTHORIZED
FORBIDDEN
TOKEN_EXPIRED
REFRESH_TOKEN_INVALID
```

Frontend harus menampilkan pesan yang mudah dipahami pengguna tanpa membocorkan informasi sensitif.

---

# 56. Non-Functional Requirements

## Performance

Sistem harus ringan dan tidak menggunakan resource berlebihan.

Prioritas:

- Efficient database queries.
- Index yang sesuai.
- Socket.IO hanya untuk event yang diperlukan.
- Hindari polling berlebihan.
- Hindari state duplication yang tidak perlu.

## Security

- Password hashing.
- JWT.
- Refresh token.
- Authorization backend.
- School isolation.
- Input validation.
- SQL injection prevention.
- XSS protection.
- Rate limiting untuk endpoint sensitif.
- Secure cookie/storage strategy.
- File upload validation untuk Excel.

## Reliability

Game state harus dapat dipulihkan jika:

- Browser refresh.
- Student disconnect.
- Student reconnect.
- Guru logout.
- Guru login kembali.
- Game dipause.
- Server restart.

---

# 57. Functional Flow — Super Admin

```text
Login
  ↓
Dashboard
  ↓
Daftar Sekolah
  ↓
Tambah Sekolah
  ↓
Input Data Sekolah
  ↓
Generate Admin
  ↓
School Created
  ↓
Tampilkan Credential
```

---

# 58. Functional Flow — Admin

```text
Login
 ↓
Dashboard
 ↓
Kelola Guru
 ↓
Buat Guru
 ↓
Generate Email + Password
 ↓
Kelola Kelas
 ↓
Buat Kelas
 ↓
Assign Guru
 ↓
Kelola Topic
```

---

# 59. Functional Flow — Guru

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
Konfigurasi
 ↓
Pilih Topic
 ↓
Pilih Input Mode
 ↓
Pilih Game Mode
 ↓
Atur Problem Display Limit
 ↓
Jika Group → Tentukan Jumlah Kelompok
 ↓
Room Open
 ↓
Peserta Join
 ↓
Semua Peserta Submit
 ↓
START
 ↓
Perfect Matching
 ↓
Gameplay
 ↓
Monitoring
 ↓
Pause / Resume jika diperlukan
 ↓
Finish
 ↓
History
```

---

# 60. Functional Flow — Student

```text
Join Room
 ↓
Input Room Code
 ↓
Validate
 ↓
Input Nama
 ↓
Input Problem
 ↓
Waiting
 ↓
Game Start
 ↓
Jika Group → Tampilkan Group
 ↓
Gameplay
 ↓
Melihat Card
 ↓
Problem Anonymous
 ↓
Finish
```

---

# 61. Functional Flow — Teacher Input

```text
Open Room
 ↓
Teacher Input
 ↓
Upload Excel
 ↓
Validate
 ↓
Preview
 ↓
Confirm
 ↓
Participants Ready
 ↓
START
```

---

# 62. Functional Flow — Group Mode

```text
All Participants Ready
       ↓
Shuffle Participants
       ↓
Determine Group Count
       ↓
Fair Distribution
       ↓
Persist Group Membership
       ↓
Generate Perfect Matching
       ↓
Persist Assignments
       ↓
Start Groups
       ↓
Group 1 ── Game State 1
Group 2 ── Game State 2
Group 3 ── Game State 3
       ↓
Parallel Gameplay
       ↓
All Groups Complete
       ↓
Game Finished
```

---

# 63. Core Business Rules

```text
BR-001
Sistem hanya memiliki satu Super Admin.

BR-002
Satu sekolah hanya memiliki satu Admin.

BR-003
Admin tidak dapat membuat Admin lain.

BR-004
Guru tidak dapat register.

BR-005
Murid tidak memerlukan akun.

BR-006
Guru hanya dapat mengakses kelas yang diassign.

BR-007
Satu kelas dapat memiliki banyak Guru.

BR-008
Satu Guru dapat memiliki banyak kelas.

BR-009
Satu kelas hanya memiliki satu room aktif.

BR-010
Room code terdiri dari 6 karakter alphanumeric.

BR-011
Room code yang ditutup hangus permanen.

BR-012
Room code tidak boleh digunakan ulang.

BR-013
Semua peserta wajib submit sebelum START.

BR-014
Jumlah problem harus sama dengan jumlah participant.

BR-015
Perfect matching wajib berhasil sebelum game dimulai.

BR-016
Participant tidak boleh mendapatkan problem miliknya sendiri.

BR-017
Satu participant hanya mendapatkan satu problem.

BR-018
Satu problem hanya digunakan satu kali.

BR-019
Assignment fixed setelah game dimulai.

BR-020
Reconnect tidak mengubah assignment.

BR-021
Group membership fixed setelah game dimulai.

BR-022
Pembagian kelompok harus seimbang.

BR-023
Setiap kelompok memiliki game state sendiri.

BR-024
Setiap kelompok hanya memiliki satu active card pair.

BR-025
Problem author tidak ditampilkan kepada murid.

BR-026
History hanya dapat diakses Guru pembuat game.

BR-027
Game dapat dipause dan dilanjutkan.

BR-028
Resume tidak mengacak ulang game.

BR-029
Gameplay realtime.

BR-030
Database adalah source of truth.

BR-031
Access token berlaku 2 jam.

BR-032
Refresh token digunakan untuk mempertahankan login.

BR-033
Data game dihapus setelah 30 hari.

BR-034
Master data sekolah tidak ikut terhapus.

BR-035
Semua authorization dilakukan di backend.
```

---

# 64. Acceptance Criteria Utama

Sistem dianggap memenuhi requirement jika:

### School

- Super Admin dapat membuat sekolah.
- Admin otomatis dibuat.
- Credential Admin berhasil digenerate.
- Satu sekolah tidak dapat memiliki Admin kedua.

### Teacher

- Admin dapat membuat Guru.
- Email Guru mengikuti domain sekolah.
- Default password `Guru@123`.
- Guru tidak dapat register.
- Guru dapat diassign ke banyak kelas.

### Room

- Guru dapat membuat room.
- Code terdiri dari 6 karakter alphanumeric.
- Code unique.
- Code tidak dapat digunakan ulang setelah closed.
- Satu kelas tidak memiliki dua room aktif.

### Student

- Murid dapat join tanpa login.
- Session ID dibuat dan disimpan di browser.
- Room yang closed tidak dapat dimasuki.
- Reconnect menggunakan session yang sama.

### Game

- START ditolak jika ada participant yang belum submit.
- START ditolak jika jumlah problem tidak sama dengan participant.
- Perfect matching harus complete.
- Self-assignment tidak diperbolehkan.
- Assignment tidak berubah setelah dibuat.
- Problem author anonymous bagi murid.
- Group distribution fair.
- Group memiliki game state terpisah.
- Satu group hanya memiliki satu active card pair.
- Semua group dapat bermain bersamaan.

### Pause / Resume

- Game dapat dipause.
- Game dapat dilanjutkan kemudian.
- Assignment tetap.
- Group tetap.
- Turn tetap.
- State tetap.

### History

- Guru pembuat dapat melihat history.
- Murid tidak dapat melihat history global.
- Admin tidak dapat melihat history game Guru.
- Guru lain tidak dapat melihat history tersebut.

---

# 65. Requirement Baseline

Dokumen ini merupakan baseline requirement PhillyoGo versi 2.0.

Dokumen teknis berikutnya harus mengacu pada SRS ini:

```text
SRS v2.0
   ↓
Database / ERD
   ↓
API Specification
   ↓
Realtime / Socket.IO Specification
   ↓
Game State Machine
   ↓
Perfect Matching Specification
   ↓
UI / Screen Specification
   ↓
Frontend Architecture
   ↓
Backend Architecture
   ↓
Implementation
```

Perubahan terhadap business rule harus diperbarui pada SRS terlebih dahulu sebelum memengaruhi dokumen teknis lainnya.
