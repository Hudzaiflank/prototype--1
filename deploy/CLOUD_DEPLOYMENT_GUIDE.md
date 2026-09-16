# PhillyoGo Cloud Deployment Guide

Panduan ini deploy PhillyoGo dengan asumsi laptop setelah deployment boleh mati.

Arsitektur yang digunakan:

```text
Browser
  |
  v
Cloudflare Pages (frontend React/Vite)
  |
  v
Railway (backend Node.js + Socket.IO)
  |
  v
Railway MySQL
```

Dengan arsitektur ini, backend, database, dan Socket.IO tidak bergantung pada laptop atau Cloudflare Quick Tunnel.

> Jangan gunakan `cloudflared tunnel --url http://localhost:3000` untuk deployment ini. Quick Tunnel hanya meneruskan traffic ke laptop dan akan mati ketika laptop atau proses tunnel berhenti.

## Prasyarat

Siapkan akun:

- GitHub, berisi repository project ini.
- Railway, untuk backend dan MySQL.
- Cloudflare, untuk frontend Pages.

Pastikan repository memiliki struktur berikut:

```text
prototype--111/
  backend/
    package.json
    src/
    database/
  frontend/
    package.json
    src/
```

Pastikan file `backend/.env` tidak di-commit. Environment production harus diisi melalui Railway, bukan melalui file `.env` di GitHub.

## 1. Push kode terbaru ke GitHub

Dari folder repository:

```powershell
Set-Location E:\Innovation-hub\prototype-1
git status
git add backend frontend deploy
git commit -m "Document cloud deployment"
git push origin main
```

Jika ada perubahan lain yang belum siap di-commit, jangan gunakan `git add .`. Pilih file yang memang ingin dikirim.

## 2. Buat project Railway

1. Buka <https://railway.app>.
2. Login dengan GitHub.
3. Klik **New Project**.
4. Pilih **Deploy from GitHub repo**.
5. Pilih repository PhillyoGo.

Railway dapat membuat service dari repository tersebut. Backend belum akan berjalan sebelum environment database diisi.

## 3. Tambahkan MySQL di Railway

Di project Railway yang sama:

1. Klik **New**.
2. Pilih **Database**.
3. Pilih **MySQL**.
4. Tunggu sampai service MySQL berstatus running.
5. Buka tab **Variables** atau **Connect** pada service MySQL.
6. Catat host, port, database name, username, dan password yang diberikan Railway.

Nama variable MySQL dapat berbeda sesuai provider. Jangan menebak nama variable. Gunakan nilai koneksi yang ditampilkan pada service MySQL untuk mengisi `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASSWORD` pada service backend.

## 4. Atur service backend Railway

Pilih service yang terhubung ke repository GitHub, lalu buka **Settings**.

Isi konfigurasi:

```text
Root Directory: /backend
Start Command: npm start
```

Jika Railway tidak menerima format `/backend`, gunakan:

```text
Root Directory: backend
```

`backend/package.json` sudah memiliki script:

```json
"start": "node src/server.js"
```

Jangan menggunakan `npm run dev` untuk deployment. Mode `dev` memakai Node watch dan bukan mode server production.

## 5. Isi environment variable backend

Pada service backend Railway, buka **Variables**, lalu tambahkan variable berikut.

```env
NODE_ENV=production
API_PREFIX=/api/v1

FRONTEND_URL=https://prototype--1.pages.dev
FRONTEND_URLS=https://prototype--1.pages.dev

REFRESH_COOKIE_NAME=phillyogo_refresh
RETENTION_DAYS=30

DB_HOST=ISI_HOST_MYSQL_RAILWAY
DB_PORT=3306
DB_NAME=ISI_DATABASE_MYSQL_RAILWAY
DB_USER=ISI_USER_MYSQL_RAILWAY
DB_PASSWORD=ISI_PASSWORD_MYSQL_RAILWAY
DB_CONNECTION_LIMIT=10

JWT_ACCESS_SECRET=ISI_SECRET_ACAK_PERTAMA
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_SECRET=ISI_SECRET_ACAK_KEDUA
JWT_REFRESH_EXPIRES_IN=30d

ROOM_SESSION_TTL_HOURS=24

SEED_SUPER_ADMIN_EMAIL=superadmin@gmail.com
SEED_SUPER_ADMIN_PASSWORD=ISI_PASSWORD_SUPERADMIN_BARU
SEED_SCHOOL_NAME=SMA Negeri 4 Bandung
SEED_SCHOOL_DOMAIN=sman4bandung.co.id
SEED_SCHOOL_ADMIN_PASSWORD=ISI_PASSWORD_ADMIN_BARU
```

### Catatan `PORT`

Railway biasanya menyuntikkan variable `PORT` secara otomatis. Jangan menimpa variable tersebut dengan angka tetap `3000`. Aplikasi akan memakai `process.env.PORT` jika Railway menyediakannya, dan memakai default `3000` jika tidak ada.

### Membuat JWT secret

Jalankan command berikut dua kali di komputer lokal:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Gunakan hasil pertama untuk `JWT_ACCESS_SECRET` dan hasil kedua untuk `JWT_REFRESH_SECRET`.

Jangan gunakan:

```text
Bismillah
SMA4@2026
GANTI_PASSWORD_SUPERADMIN
replace-with-a-long-random-secret
```

Simpan password admin di password manager. Jangan memasukkannya ke GitHub atau chat publik.

## 6. Deploy backend pertama kali

Setelah variables disimpan, Railway akan melakukan redeploy otomatis.

Buka tab **Deployments** dan periksa log. Error seperti berikut biasanya berarti variable database belum benar:

```text
ECONNREFUSED
Access denied for user
Unknown database
```

Jika deployment berhasil, buka **Settings > Networking** pada service backend dan klik **Generate Domain**.

Railway akan memberikan URL seperti:

```text
https://phillyogo-backend-production.up.railway.app
```

Simpan URL backend ini. Selanjutnya URL tersebut disebut sebagai `BACKEND_URL`.

## 7. Jalankan migration database production

Migration harus dijalankan terhadap database Railway, bukan MySQL lokal laptop.

Ada dua cara. Gunakan cara pertama jika Railway menyediakan **Run Command** atau shell pada service backend.

### Cara A: Railway shell/run command

Jalankan:

```bash
npm run db:migrate
```

Untuk database baru, isi data awal satu kali:

```bash
npm run db:seed
```

Jangan menjalankan seed berulang kali jika tidak ingin mengubah password akun seed.

### Cara B: Jalankan dari komputer lokal dengan variable Railway

Jika Railway tidak menyediakan shell, isi sementara environment variable database Railway pada PowerShell lokal, lalu jalankan:

```powershell
Set-Location E:\Innovation-hub\prototype-1\backend
npm install
npm run db:migrate
npm run db:seed
```

Pastikan command tersebut benar-benar menggunakan host database Railway. Jangan menjalankan migration ke `localhost` karena itu hanya database lokal.

Setelah migration dan seed selesai, hapus kembali variable database production dari environment lokal atau tutup terminal tersebut.

## 8. Cek backend Railway

Dengan `BACKEND_URL` yang sudah didapat:

```powershell
Invoke-WebRequest -UseBasicParsing https://phillyogo-backend-production.up.railway.app/health
```

Hasil yang benar:

```text
StatusCode : 200
```

Response health kira-kira:

```json
{
  "success": true,
  "data": {
    "service": "phillyogo-backend",
    "status": "ok"
  }
}
```

Jangan lanjut ke frontend jika `/health` belum menghasilkan `200`.

## 9. Buat project frontend Cloudflare Pages

1. Buka <https://dash.cloudflare.com>.
2. Pilih **Workers & Pages**.
3. Klik **Create application**.
4. Pilih **Pages**.
5. Pilih **Connect to Git**.
6. Hubungkan repository GitHub PhillyoGo.
7. Pilih branch `main`.

Isi konfigurasi build berikut:

```text
Framework preset: Vite
Root directory: frontend
Build command: npm run build
Build output directory: dist
```

Perhatikan dua field ini:

```text
Root directory: frontend
Build output directory: dist
```

Jangan mengisi root directory dengan `dist`. Folder `dist` baru dibuat setelah `npm run build` selesai.

## 10. Isi environment variable frontend

Pada konfigurasi Cloudflare Pages, tambahkan untuk environment **Production**:

```env
VITE_API_URL=https://phillyogo-backend-production.up.railway.app/api/v1
VITE_SOCKET_URL=https://phillyogo-backend-production.up.railway.app/game
```

Ganti hostname Railway sesuai URL backend sebenarnya.

`VITE_API_URL` harus berakhir dengan `/api/v1`.

`VITE_SOCKET_URL` harus berakhir dengan `/game`.

Jangan menggunakan URL berikut pada deployment cloud:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000/game
```

Jangan gunakan URL `trycloudflare.com` untuk deployment permanen.

## 11. Deploy frontend

Klik **Save and Deploy**.

Cloudflare akan menjalankan:

```text
npm install
npm run build
```

Setelah berhasil, Cloudflare memberikan URL Pages, misalnya:

```text
https://prototype--1.pages.dev
```

Catat URL tersebut. URL ini harus sama dengan origin yang diizinkan backend.

## 12. Samakan CORS backend dengan domain frontend

Kembali ke service backend Railway, ubah variable:

```env
FRONTEND_URL=https://prototype--1.pages.dev
FRONTEND_URLS=https://prototype--1.pages.dev
```

Jika ada domain Pages lain yang juga perlu digunakan, pisahkan dengan koma:

```env
FRONTEND_URLS=https://prototype--1.pages.dev,https://domain-preview.pages.dev
```

Tidak boleh ada spasi yang tidak perlu, slash terakhir, atau path `/login` pada nilai CORS.

Benar:

```text
https://prototype--1.pages.dev
```

Salah:

```text
https://prototype--1.pages.dev/login
```

Salah:

```text
*
```

Simpan variable tersebut dan tunggu Railway melakukan redeploy backend.

## 13. Redeploy frontend setelah backend siap

Jika environment variable frontend sudah benar, lakukan redeploy dari Cloudflare Pages:

1. Buka project Pages.
2. Buka **Deployments**.
3. Pilih **Retry deployment** atau buat commit kecil pada branch `main`.
4. Pastikan deployment berstatus **Success**.

Environment variable Vite dibaca saat build. Mengubah variable tanpa rebuild tidak mengubah JavaScript yang sudah ter-deploy.

## 14. Test CORS

Jalankan preflight check dari PowerShell. Ganti URL backend jika berbeda:

```powershell
$headers = @{
  Origin = "https://prototype--1.pages.dev"
  "Access-Control-Request-Method" = "POST"
  "Access-Control-Request-Headers" = "content-type, authorization"
}

Invoke-WebRequest -UseBasicParsing `
  -Uri "https://phillyogo-backend-production.up.railway.app/api/v1/auth/login" `
  -Method Options `
  -Headers $headers
```

Hasil yang benar:

```text
StatusCode : 204
```

Response juga harus memiliki:

```text
Access-Control-Allow-Origin: https://prototype--1.pages.dev
Access-Control-Allow-Credentials: true
```

Jika tidak ada header tersebut, cek `FRONTEND_URLS` di Railway dan tunggu backend selesai restart.

## 15. Test login

Buka:

```text
https://prototype--1.pages.dev/login
```

Gunakan:

```text
Email: superadmin@gmail.com
Password: nilai SEED_SUPER_ADMIN_PASSWORD di Railway
```

Akun tersebut baru tersedia setelah `npm run db:seed` berhasil dijalankan pada database Railway.

Di browser tekan `F12`, buka **Network**, lalu pastikan:

```text
OPTIONS /api/v1/auth/login  -> 204
POST /api/v1/auth/login     -> 200 jika credential benar
```

Pastikan request mengarah ke hostname Railway, bukan ke:

```text
localhost:3000
adipex-same-settings-societies.trycloudflare.com
armstrong-bizrate-redeem-arrive.trycloudflare.com
```

## 16. Masalah umum

### `Cannot find cwd: /repo/dist`

Root directory Cloudflare Pages salah.

Gunakan:

```text
Root directory: frontend
Build output directory: dist
```

### CORS tidak memiliki `Access-Control-Allow-Origin`

Origin frontend belum masuk ke `FRONTEND_URLS` backend, atau backend belum redeploy setelah variable diubah.

### Response `530` dari `trycloudflare.com`

Quick Tunnel mati atau laptop yang menjalankannya mati. Deployment cloud seharusnya menggunakan URL Railway, bukan URL Quick Tunnel.

### `ERR_CONNECTION_REFUSED` ke database

`DB_HOST` masih `localhost` atau host/port MySQL Railway salah.

### Login selalu gagal setelah seed

Pastikan seed dijalankan terhadap database Railway dan password yang dipakai sama dengan `SEED_SUPER_ADMIN_PASSWORD` pada service backend Railway.

### Socket.IO tidak tersambung

Pastikan:

```env
VITE_SOCKET_URL=https://hostname-backend-railway/game
```

Pastikan frontend di-build ulang setelah variable tersebut diubah. Pastikan service Railway tidak sedang sleep atau crash.

## 17. Checklist deployment final

Backend dan database:

```text
[ ] MySQL Railway berstatus running
[ ] Backend Railway berstatus running
[ ] Root directory backend benar
[ ] Start command menggunakan npm start
[ ] Migration production berhasil
[ ] Seed production berhasil satu kali
[ ] /health menghasilkan HTTP 200
[ ] JWT secrets bukan nilai default
[ ] Password admin production bukan nilai contoh
```

Frontend:

```text
[ ] Root directory Cloudflare Pages: frontend
[ ] Build command: npm run build
[ ] Output directory: dist
[ ] VITE_API_URL memakai URL Railway
[ ] VITE_SOCKET_URL memakai URL Railway
[ ] Deployment Pages berstatus Success
[ ] FRONTEND_URLS backend sama persis dengan domain Pages
[ ] Login berhasil
[ ] Socket.IO tersambung
```

## 18. Setelah laptop dimatikan

Setelah deployment ini selesai, aplikasi tetap dapat berjalan ketika laptop mati karena:

- frontend berada di Cloudflare Pages;
- backend berada di Railway;
- database berada di Railway;
- Socket.IO berjalan di service backend Railway.

Laptop hanya diperlukan untuk mengubah kode, melakukan push ke GitHub, atau mengelola konfigurasi deployment.

## Catatan biaya dan operasional

Periksa batas gratis dan kebijakan sleep dari provider yang dipilih. Service gratis dapat berhenti sementara atau memiliki batas pemakaian. Untuk aplikasi sekolah yang dipakai rutin, gunakan database backup dan plan yang menyediakan uptime sesuai kebutuhan.

Simpan backup database secara berkala. Jangan menyimpan password, JWT secret, atau credential database di repository.
