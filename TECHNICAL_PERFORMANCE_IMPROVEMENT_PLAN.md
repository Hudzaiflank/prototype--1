# Rencana Perbaikan Performa Teknis PhillyoGo

Dokumen ini berisi daftar perbaikan teknis berdasarkan hasil monitoring pada
[MindPlay v2.md](./MindPlay%20v2.md), struktur backend, dan alur frontend saat ini.

## 1. Kesimpulan diagnosis

Masalah utama bukan semata-mata jumlah 27 siswa. Bottleneck utama berasal dari:

1. `startGame()` menjalankan banyak query database secara serial dalam satu transaksi.
2. Student state mengambil data melalui beberapa query terpisah untuk setiap siswa.
3. `getGroups()` menggunakan pola N+1 query.
4. Socket.IO dan REST sama-sama melakukan refresh state.
5. Frontend dapat memicu request berulang setelah event socket dan aksi guru.
6. Pool database kecil sehingga request tambahan masuk antrean.
7. Query penting belum diverifikasi dengan `EXPLAIN ANALYZE` dan index komposit.
8. Request log belum memisahkan waktu antrean koneksi, query, transaksi, dan serialisasi.

Caching dapat membantu, tetapi hanya setelah sumber data dan invalidasinya jelas.
Caching tidak akan memperbaiki transaksi `startGame()` yang terlalu banyak query.

## 2. Penilaian caching dan TanStack Query

### 2.1 Caching backend

Caching backend direkomendasikan untuk data yang:

- sering dibaca;
- jarang berubah;
- aman menggunakan data sedikit lama;
- memiliki aturan invalidasi yang jelas.

Contoh yang cocok:

- detail topik;
- daftar kelas;
- metadata sesi yang belum berjalan;
- daftar peserta ketika fase lobby;
- hasil konfigurasi game.

Contoh yang tidak boleh langsung dicache secara sederhana:

- current turn;
- status kartu;
- status game yang sedang berubah;
- hasil `startGame()`;
- data yang menentukan izin aksi.

Untuk game realtime, cache stale dapat membuat siswa melihat giliran atau status
kartu yang salah. Data otoritatif tetap harus berasal dari database atau state
server yang diinvalidasi secara eksplisit.

### 2.2 Pilihan cache backend

#### Tahap awal: process-local cache

Process-local cache dapat dipakai untuk metadata sederhana pada satu instance.
Namun cache ini hilang ketika aplikasi restart dan tidak konsisten jika backend
memiliki lebih dari satu instance.

Gunakan TTL pendek dan jangan simpan data otorisasi atau state game kritis.

#### Tahap berikutnya: Redis atau provider cache terkelola

Redis lebih tepat jika:

- backend memiliki lebih dari satu instance;
- state realtime perlu dibagikan;
- diperlukan pub/sub Socket.IO;
- invalidasi cache harus konsisten antar instance.

Jangan menambahkan Redis hanya untuk menutupi query N+1. Query dan transaksi
tetap perlu diperbaiki terlebih dahulu.

### 2.3 TanStack Query di frontend

TanStack Query cocok untuk REST API karena menyediakan:

- deduplikasi request yang sama;
- cache berdasarkan query key;
- stale time dan garbage collection;
- retry terkontrol;
- cancellation;
- invalidasi setelah mutation;
- state loading/error yang konsisten.

TanStack Query **bukan** pengganti Socket.IO. Rekomendasi arsitektur:

```text
TanStack Query : fetching, caching, dan mutation REST
Socket.IO      : event realtime dan perubahan state game
Server         : sumber kebenaran
```

Event Socket.IO dapat memperbarui cache TanStack Query menggunakan
`queryClient.setQueryData()` atau `invalidateQueries()`. Jangan membuat polling
agresif jika event realtime sudah tersedia.

### 2.4 Urutan penggunaan TanStack Query

TanStack Query sebaiknya diterapkan setelah query key dan kontrak response
ditentukan. Urutan yang aman:

1. Migrasikan query dashboard, kelas, siswa, history, dan groups.
2. Tambahkan `staleTime` sesuai jenis data.
3. Gunakan mutation untuk start/pause/resume/finish.
4. Sinkronkan event Socket.IO dengan query cache.
5. Hindari invalidasi global; invalidasi hanya query yang terdampak.

Contoh kebijakan cache frontend:

| Data | Strategi |
|---|---|
| Dashboard | `staleTime` beberapa puluh detik |
| Kelas dan siswa | `staleTime` puluhan detik sampai beberapa menit |
| History | cache per halaman |
| Groups | fetch awal, update saat event group berubah |
| Current turn | update dari socket, bukan polling cepat |
| Game state | snapshot awal REST, perubahan utama dari socket |

## 3. Prioritas perbaikan

### P0 — wajib sebelum caching agresif

#### 3.1 Optimasi `startGame()`

Target file:

- `backend/src/repositories/game.repository.js`
- `backend/src/services/game.service.js`
- `backend/src/controllers/game.controller.js`
- frontend teacher monitor

Perbaikan:

- validasi peserta dan problem sebelum transaksi;
- gunakan bulk insert untuk group;
- gunakan bulk insert untuk `group_members`;
- gunakan bulk insert untuk assignments;
- gunakan bulk insert untuk game turns;
- gunakan ID hasil insert tanpa `SELECT` ulang;
- kurangi update per peserta dan per turn;
- pastikan rollback tidak menutupi error awal;
- tambahkan idempotency atau lock agar dua start bersamaan tidak menjalankan
  pekerjaan penuh dua kali;
- kirim satu payload hasil start yang konsisten ke REST dan Socket.IO.

Target:

```text
start game p95 < 3 detik
request start duplikat gagal cepat dengan 409
```

#### 3.2 Optimasi student state

Target file:

- `backend/src/repositories/game.repository.js`
- `backend/src/controllers/room.controller.js`
- `backend/src/sockets/game.socket.js`

Perbaikan:

- gabungkan query session, participant, dan group jika execution plan mendukung;
- ambil member dengan satu query;
- ambil current turn dengan query terindeks;
- kurangi kolom yang dikembalikan;
- buat DTO khusus student state;
- gunakan `stateVersion` untuk mendeteksi perubahan;
- jangan membaca ulang seluruh snapshot jika state belum berubah.

#### 3.3 Hilangkan N+1 pada groups

Target file:

- `backend/src/repositories/game.repository.js`
- `backend/src/controllers/game.controller.js`

Perbaikan:

- ambil semua group dan member dengan satu query join;
- kelompokkan member berdasarkan `groupId` di JavaScript;
- ganti subquery count berulang dengan agregasi atau query terpisah yang
  terukur;
- pastikan response groups tidak berisi kolom internal yang tidak diperlukan.

#### 3.4 Pisahkan `joinSession()` dan `request-state`

Target file:

- `backend/src/sockets/game.socket.js`

Saat ini `request-state` memanggil alur `joinSession()` lagi. Pisahkan menjadi:

```text
join-game       = validasi akses + join room + snapshot awal
request-state   = ambil snapshot tanpa join room ulang
```

Pastikan `request-state` tidak mengirim event tambahan seperti restored session,
room state, dan group assignment secara berulang.

## 4. Database dan query

### 4.1 Audit execution plan

Uji dengan `EXPLAIN ANALYZE` untuk:

- query session;
- query student state;
- query groups;
- query members;
- query current turn;
- query participant;
- query problem;
- query submission progress.

Catat:

- index yang digunakan;
- rows examined;
- filesort;
- temporary table;
- waktu eksekusi.

### 4.2 Kandidat index komposit

Index berikut perlu diverifikasi terhadap schema aktual sebelum dibuat:

```sql
participants (game_session_id, status, id)
problems (game_session_id, status, participant_id)
groups (game_session_id, group_number)
group_members (group_id, participant_id)
game_turns (game_session_id, group_id, status, turn_number)
game_turns (group_id, status)
assignments (game_session_id, group_id, participant_id, status)
```

Jangan menambahkan semua index secara membabi buta. Index harus dipilih dari
hasil execution plan dan diuji dampaknya terhadap insert serta update.

### 4.3 Kurangi round-trip database

- hindari `SELECT *`;
- gabungkan query yang selalu dijalankan bersama;
- gunakan bulk insert;
- gunakan hasil `insertId` langsung;
- jangan menjalankan query di dalam loop jika dapat diganti join, agregasi,
  atau bulk operation;
- gunakan transaksi hanya untuk bagian yang benar-benar harus atomik.

## 5. Connection pool dan transaksi

Target file:

- `backend/src/config/database.js`
- `backend/src/config/env.js`
- seluruh repository yang memakai `pool.getConnection()`

Perbaikan:

- ukur waktu menunggu koneksi;
- ukur waktu query dan transaksi;
- tambahkan connect timeout;
- tambahkan batas waktu transaksi;
- audit setiap `getConnection()` memiliki `finally { connection.release(); }`;
- uji pool bertahap, misalnya 3, 5, dan 8;
- jangan menaikkan pool tanpa melihat CPU dan jumlah koneksi database;
- tambahkan proteksi terhadap transaksi start yang berjalan terlalu lama.

## 6. Realtime dan desain state

Target file:

- `backend/src/sockets/game.socket.js`
- `backend/src/config/realtime.js`
- `frontend/src/pages/student/RoomGamePage.jsx`
- `frontend/src/pages/teacher/RoomMonitorPage.jsx`

Perbaikan:

- gunakan snapshot awal satu kali;
- gunakan event delta untuk perubahan kecil;
- tambahkan `stateVersion` pada event;
- abaikan event yang lebih lama dari state lokal;
- debounce beberapa `request-state` yang datang berdekatan;
- jangan mengirim state penuh untuk setiap perubahan kecil;
- pastikan event `GAME_STARTED` tidak memicu refresh berlapis;
- bersihkan listener socket secara deterministik;
- audit agar satu halaman hanya memiliki satu koneksi game aktif.

Jika backend nanti multi-instance, siapkan Redis adapter/pub-sub untuk Socket.IO.

## 7. Frontend dan TanStack Query

### 7.1 Migrasi endpoint non-realtime

Mulai dari endpoint yang tidak membutuhkan sinkronisasi per detik:

- dashboard;
- classes;
- students;
- history;
- detail sesi sebelum game berjalan;
- groups pada halaman monitor.

Jangan memulai dari current turn sebelum alur socket dan state version stabil.

### 7.2 Aturan query key

Gunakan query key yang eksplisit, misalnya:

```text
["teacher", "dashboard"]
["teacher", "classes"]
["game-session", sessionId]
["game-groups", sessionId]
["game-history", page, limit]
```

Jangan memakai satu key global untuk seluruh state game.

### 7.3 Aturan mutation

Mutation untuk start/pause/resume/finish harus:

- disable tombol selama request berjalan;
- mencegah double-click;
- menampilkan error bisnis secara jelas;
- meng-update cache dari response;
- tidak langsung memanggil banyak GET tambahan;
- mengandalkan event socket untuk perubahan siswa.

### 7.4 Cancellation dan retry

- batalkan request ketika halaman unmount;
- retry hanya untuk network error dan 502/503/504;
- jangan retry 400/401/403/404/409;
- gunakan exponential backoff;
- jangan polling cepat jika socket tersambung.

## 8. Caching yang direkomendasikan

### 8.1 Cache yang aman

Prioritaskan:

- metadata topik;
- daftar kelas;
- daftar siswa;
- dashboard;
- history per halaman;
- konfigurasi sesi sebelum game dimulai.

### 8.2 Cache yang harus diinvalidasi ketat

- daftar peserta lobby setelah participant join;
- groups setelah game start;
- leader setelah perubahan leader;
- session setelah start/pause/resume/finish.

### 8.3 Data yang tidak boleh stale

Jangan mengandalkan cache biasa untuk:

- izin aksi;
- status game yang menentukan transisi;
- current turn;
- status kartu;
- hasil validasi start;
- participant status yang memengaruhi aturan game.

Untuk data tersebut, gunakan database transaction atau server-side game state
yang memiliki mekanisme event dan invalidasi.

## 9. Observability

Target file:

- `backend/src/middleware/request-log.middleware.js`
- `backend/src/services/request-log.service.js`
- `backend/src/config/database.js`
- `backend/src/config/realtime.js`

Tambahkan:

- `requestId`;
- route template, bukan hanya URL mentah;
- waktu menunggu connection pool;
- jumlah query;
- total waktu query;
- waktu transaksi;
- ukuran response;
- jumlah socket aktif;
- event socket dan target room;
- heap used dan RSS;
- event-loop lag.

Request log in-memory maksimal 500 item tetap boleh dipakai untuk tampilan cepat,
tetapi bukan satu-satunya sumber observability karena hilang saat restart.

## 10. Reliability

Perbaikan:

- pisahkan `/health/live` dan `/health/ready`;
- readiness harus menguji koneksi database;
- tambahkan graceful shutdown untuk HTTP, Socket.IO, dan pool;
- bedakan error bisnis, timeout, database unavailable, dan bug internal;
- gunakan idempotency key untuk register, submit, start, reveal, dan complete;
- jangan mengembalikan success palsu ketika event realtime gagal dikirim;
- tetapkan batas payload dan timeout request.

## 11. Load test dan acceptance criteria

Skenario minimum:

1. 1 guru + 27 siswa join bersamaan.
2. 1 guru + 27 siswa submit bersamaan.
3. Guru memulai game.
4. 27 siswa mengambil snapshot atau menerima event.
5. Reveal card.
6. Complete turn.
7. Finish game.
8. Dua request start bersamaan.
9. Socket disconnect lalu reconnect.

Ukur p50, p90, p95, p99, error rate, dan timeout rate.

Target awal:

```text
join/state p95       < 1 detik
groups p95           < 1 detik
submit p95           < 1 detik
start p95            < 3 detik
socket event         < 500 ms
error rate           < 1%
```

## 12. Urutan implementasi

### Batch 1 — bottleneck langsung

1. Tambahkan instrumentasi query dan connection pool.
2. Optimasi `startGame()`.
3. Hilangkan N+1 pada `getGroups()`.
4. Optimasi student state.
5. Verifikasi query dengan `EXPLAIN ANALYZE`.
6. Tambahkan index yang terbukti diperlukan.

### Batch 2 — realtime dan frontend

1. Pisahkan `joinSession()` dan `request-state`.
2. Hilangkan refresh REST duplikat.
3. Tambahkan state version dan timestamp server pada event.
4. Abaikan event yang lebih lama dan merge event ringkas tanpa menimpa snapshot lengkap.
5. Coalesce `request-state` yang terjadi berurutan pada client student.
6. Migrasikan endpoint dashboard dan history ke TanStack Query.

### Batch 3 — caching terkontrol

1. Tambahkan cache frontend untuk data non-realtime.
2. Sinkronkan event socket dengan TanStack Query cache.
3. Tambahkan cache backend hanya untuk metadata yang aman.
4. Tambahkan invalidasi eksplisit setelah mutation.
5. Evaluasi Redis hanya jika diperlukan oleh multi-instance atau pub/sub.

### Batch 4 — validasi

1. Jalankan load test 27 siswa.
2. Bandingkan p50/p95/p99 sebelum dan sesudah.
3. Uji reconnect dan transaksi bersamaan.
4. Periksa memory, CPU, connection pool, dan database.
5. Dokumentasikan hasil regresi dan batas kapasitas.

## 13. Keputusan teknis

Rekomendasi akhir:

- **Ya untuk TanStack Query**, terutama untuk REST non-realtime dan deduplikasi
  request.
- **Ya untuk caching**, tetapi dimulai dari frontend dan data metadata yang aman.
- **Tidak untuk menjadikan cache sebagai solusi utama game state**.
- **Tidak untuk menambahkan Redis sebelum query dan transaksi diperbaiki**.
- **Socket.IO tetap digunakan untuk perubahan realtime**, dengan TanStack Query
  sebagai pengelola cache dan mutation REST.

## 14. Urutan deployment

Perubahan ini tidak membutuhkan service baru atau environment variable baru.
Setelah backup Aiven terverifikasi:

1. Push source code dan lockfile ke GitHub.
2. Jalankan migration backend dengan `npm run db:migrate` terhadap database Aiven.
3. Pastikan migration `010_performance_indexes.sql` tercatat di
   `schema_migrations`.
4. Redeploy backend agar perubahan query, Socket.IO, health check, dan graceful
   shutdown aktif.
5. Verifikasi `/health/live`, `/health/ready`, login, join room, dan start game.
6. Redeploy frontend agar dependency TanStack Query dan perubahan teacher monitor
   aktif.
7. Uji satu sesi dengan satu guru dan 27 siswa.

Migration memeriksa keberadaan index sebelum membuatnya. Jangan menghapus
migration lama atau menjalankan `DROP DATABASE`. Jika pipeline deployment
menjalankan migration otomatis, langkah migration manual digantikan oleh
verifikasi log deployment.
