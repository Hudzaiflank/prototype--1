# Deploy PhillyoGo dengan Render dan TiDB Cloud

Panduan ini memakai Render Free untuk backend dan TiDB Cloud Starter untuk database MySQL-compatible.

> **Penting:** Render dapat meminta kartu kredit untuk verifikasi akun, seperti yang muncul pada akun Anda. Jika tidak ingin memasukkan kartu sama sekali, jangan lanjutkan langkah Render di panduan ini. Jalur ini juga tidak menjamin backend selalu aktif: Render Free dapat sleep setelah idle. Untuk backend cloud tanpa laptop dan tanpa kartu, backend perlu dimigrasikan ke layanan Cloudflare Workers; itu bukan deployment langsung dari backend Node.js + Express + Socket.IO saat ini.

```text
Browser -> Cloudflare Pages -> Render Web Service (Node.js + Socket.IO) -> TiDB Cloud Starter
```

Keduanya memiliki opsi kuota gratis, tetapi persyaratan akun dapat berbeda. Ini cocok untuk demo, bukan uptime produksi: Render menghentikan service gratis setelah 15 menit tanpa traffic dan biasanya memerlukan sekitar satu menit untuk aktif kembali. WebSocket juga dapat terputus ketika service sleep atau restart. TiDB Cloud Starter membatasi penggunaan database pada kuota gratis bulanannya.

## 1. Buat database TiDB

1. Buat akun TiDB Cloud dan pilih **TiDB Cloud Starter** dengan mode kompatibilitas **MySQL**.
2. Buat instance dan database untuk PhillyoGo.
3. Dari halaman koneksi instance, catat host, port, nama database, username, dan password. Pilih opsi koneksi Node.js/MySQL jika tersedia.
4. Jangan menaruh credential database di repository.

## 2. Deploy backend ke Render

1. Push perubahan project ke repository GitHub yang akan dipakai untuk deployment.
2. Buat akun Render, lalu pilih **New > Blueprint** dan hubungkan repository tersebut. Jika Render meminta kartu dan Anda tidak ingin memasukkannya, berhenti di sini; tidak perlu menambahkan kartu.
3. Render akan membaca [render.yaml](../render.yaml). Pastikan Root Directory backend terdeteksi sebagai `backend`.
4. Isi prompt variable:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASSWORD`: nilai koneksi TiDB.
   - `FRONTEND_URLS`: sementara isi `https://nama-aplikasi.pages.dev`; nanti ganti dengan domain Cloudflare Pages yang sebenarnya.
   - `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD`, `SEED_SCHOOL_NAME`, `SEED_SCHOOL_DOMAIN`, dan `SEED_SCHOOL_ADMIN_PASSWORD`: nilai awal yang aman dan sesuai sekolah.
5. Biarkan `DB_SSL=true`; koneksi TiDB menggunakan TLS. Secret JWT dibuat otomatis oleh konfigurasi Blueprint.
6. Tunggu service selesai deploy, lalu salin URL publik Render, misalnya `https://phillyogo-backend.onrender.com`.

Jangan menetapkan `PORT` sendiri. Render mengatur port yang dipakai service.

## 3. Jalankan migration dan seed

Paket Free tidak menyediakan shell service untuk menjalankan command satu kali. Jalankan migration dari komputer lokal ke database cloud:

1. Buat atau perbarui `backend/.env` (file ini diabaikan Git). Pertahankan nilai lokal yang masih diperlukan, lalu isi koneksi TiDB dan nilai seed produksi:

   ```env
   NODE_ENV=production
   DB_HOST=HOST_TIDB
   DB_PORT=4000
   DB_NAME=NAMA_DATABASE
   DB_USER=USERNAME
   DB_PASSWORD=PASSWORD
   DB_SSL=true
   DB_CONNECTION_LIMIT=5

   SEED_SUPER_ADMIN_EMAIL=admin@domain-anda
   SEED_SUPER_ADMIN_PASSWORD=PASSWORD_ACAK_PANJANG
   SEED_SCHOOL_NAME=NAMA_SEKOLAH
   SEED_SCHOOL_DOMAIN=domain-sekolah.id
   SEED_SCHOOL_ADMIN_PASSWORD=PASSWORD_ACAK_LAIN
   ```

2. Pastikan variable koneksi database yang sama sudah disimpan pada service Render.
3. Dari folder `backend`, jalankan:

   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

Migration dan seed mengubah database cloud. Jalankan seed hanya sekali pada database baru. Jangan gunakan password contoh di atas secara literal.

## 4. Buat project frontend di Cloudflare Pages

1. Pastikan project sudah memiliki branch production di GitHub dan perubahan konfigurasi backend di atas sudah di-push. Hindari meng-commit `.env`.
2. Login ke Cloudflare, buka **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Hubungkan GitHub jika diminta, pilih repository PhillyoGo, lalu klik **Begin setup**.
4. Isi konfigurasi build:
   - **Project name**: misalnya `phillyogo`.
   - **Production branch**: pilih branch yang dipakai untuk rilis, biasanya `main`.
   - **Framework preset**: pilih **Vite** jika tersedia.
   - **Root directory (advanced) > Path**: `frontend`.
   - **Build command**: `npm run build`.
   - **Build output directory**: `dist`.
5. Buka **Environment variables** untuk konfigurasi Production dan tambahkan:

   | Variable | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://URL-BACKEND-RENDER/api/v1` |
   | `VITE_SOCKET_URL` | `https://URL-BACKEND-RENDER/game` |

   Ganti `URL-BACKEND-RENDER` dengan hostname backend yang didapat di langkah 2, tanpa `/` di akhir. Contoh: `https://phillyogo-backend.onrender.com/api/v1`.

6. Klik **Save and Deploy**. Tunggu proses build berstatus **Success**. Buka URL `*.pages.dev` yang diberikan Cloudflare dan salin origin-nya, misalnya `https://phillyogo.pages.dev`.
7. Jika ingin menguji preview deployments dari branch selain production, isi variable `VITE_API_URL` dan `VITE_SOCKET_URL` juga di bagian **Preview**. Jika tidak, jangan gunakan URL preview untuk uji integrasi dengan backend production.

`VITE_*` adalah konfigurasi build frontend dan tertanam di file JavaScript yang dikirim ke browser. Jangan masukkan password, JWT secret, atau credential database ke variable frontend.

## 5. Izinkan origin frontend di backend

1. Buka service backend di Render, lalu pilih **Environment**.
2. Ubah `FRONTEND_URLS` menjadi origin Pages yang sebenarnya, misalnya `https://phillyogo.pages.dev`. Isi origin saja, tanpa path atau slash akhir.
3. Simpan perubahan dan tunggu Render selesai melakukan redeploy.
4. Pastikan backend sehat:

   ```powershell
   Invoke-WebRequest -UseBasicParsing https://URL-BACKEND-RENDER/health
   ```

   Hasil yang benar berstatus `200`.

## 6. Cara update atau refresh frontend

Dengan Git integration, perubahan di branch production otomatis membuat deployment production baru:

1. Ubah kode di `frontend/` atau ubah variable build di Cloudflare Pages.
2. Untuk perubahan kode, commit lalu push ke branch production yang dipilih. Jangan gunakan `git add .` jika ada perubahan lokal lain yang tidak ingin ikut ter-commit.
3. Untuk perubahan variable, di Cloudflare buka **Workers & Pages** > project Pages > **Settings** > **Environment variables**. Ubah `VITE_API_URL` atau `VITE_SOCKET_URL`, pilih **Save**, lalu buat deployment baru dari **Deployments** (misalnya **Retry deployment** pada deployment terbaru) agar variable baru masuk ke hasil build.
4. Buka **Deployments** dan tunggu status deployment production menjadi **Success**. Klik **Visit** untuk membuka situs hasil deploy.
5. Uji login, panggilan API, dan koneksi permainan realtime. Di browser, lakukan hard refresh (`Ctrl+F5`) bila tab masih menampilkan asset lama.

Jika update kode tidak memicu deployment, pastikan push masuk ke branch production yang benar dan buka **Deployments** untuk memeriksa build log atau jalankan retry deployment terbaru.

## 7. Verifikasi menyeluruh

1. Buka `https://URL-BACKEND-RENDER/health`; pastikan response berstatus `200`.
2. Buka URL Pages production; pastikan halaman utama tampil.
3. Tes login menggunakan akun yang dibuat dari seed.
4. Tes alur membuat room dan bergabung sebagai siswa, termasuk koneksi Socket.IO.
5. Jika API ditolak browser karena CORS, cocokkan `FRONTEND_URLS` di Render dengan origin Pages persis, simpan, dan tunggu backend redeploy.
6. Setelah backend sleep, request pertama dapat lambat; tunggu hingga aktif lalu ulangi tes.

## Batasan dan operasi

- Setelah 15 menit tanpa traffic masuk, Render Free akan sleep. Request berikutnya membangunkannya; request pertama dapat lambat.
- Render dapat restart service gratis. Jangan menyimpan data persisten pada filesystem backend.
- TiDB Cloud Starter memiliki kuota gratis per bulan; koneksi baru dapat ditolak jika kuota habis.
- Pantau kuota kedua layanan dan siapkan backup data. Untuk penggunaan rutin/produksi, gunakan paket dengan uptime dan dukungan sesuai kebutuhan.
- Jangan mengandalkan ping berkala untuk menghindari sleep; layanan hosting dapat membatasi praktik tersebut.
