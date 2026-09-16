# PhillyoGo Deployment Dari Nol

Panduan ini menjelaskan deployment **frontend dan backend** dari awal.

Ada dua skenario:

1. **Testing cepat sekarang:** backend berjalan di laptop dan dibuka ke internet memakai Cloudflare Quick Tunnel.
2. **Deployment permanen:** frontend dan backend berjalan di cloud sehingga laptop boleh mati.

URL backend yang sedang aktif sekarang:

```text
https://cake-tagged-laptop-stick.trycloudflare.com
```

## Bagian A: Pahami komponen deployment

Project ini memiliki dua aplikasi:

```text
frontend/  -> React + Vite -> Cloudflare Pages
backend/   -> Node.js + Express + Socket.IO
```

Untuk deployment permanen, gunakan:

```text
Cloudflare Pages -> frontend
Railway/Render/Fly.io -> backend
Railway MySQL/PlanetScale/Aiven -> database
```

Untuk testing cepat, gunakan:

```text
Cloudflare Pages -> frontend
Laptop -> backend + MySQL
Cloudflare Quick Tunnel -> akses internet ke backend laptop
```

### Peringatan tentang Quick Tunnel

URL `trycloudflare.com` hanya meneruskan request ke laptop.

Jika salah satu kondisi ini terjadi, backend tidak dapat diakses:

- laptop mati;
- backend berhenti;
- MySQL berhenti;
- terminal `cloudflared` ditutup;
- URL Quick Tunnel berubah.

Jadi URL berikut hanya cocok untuk demo/testing:

```text
https://cake-tagged-laptop-stick.trycloudflare.com
```

## Bagian B: Deployment cepat dengan backend di laptop

Gunakan bagian ini jika ingin aplikasi segera bisa dicoba.

### 1. Jalankan MySQL

Pastikan MySQL berjalan.

Di PowerShell:

```powershell
Get-Service *mysql*
```

Jika service MySQL berhenti, jalankan nama service yang sesuai, contohnya:

```powershell
Start-Service MySQL80
```

### 2. Siapkan backend `.env`

Buka file:

```text
backend/.env
```

Konfigurasi minimal:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

FRONTEND_URL=https://prototype--1.pages.dev
FRONTEND_URLS=https://prototype--1.pages.dev

DB_HOST=localhost
DB_PORT=3306
DB_NAME=phillyogo
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10
```

`FRONTEND_URLS` harus berisi domain frontend Cloudflare Pages yang sedang digunakan.

Jangan menulis `/login` pada `FRONTEND_URLS`.

Benar:

```text
https://prototype--1.pages.dev
```

Salah:

```text
https://prototype--1.pages.dev/login
```

### 3. Install dan siapkan database

```powershell
Set-Location E:\Innovation-hub\prototype-1\backend
npm install
npm run db:migrate
```

Jika database masih kosong, jalankan seed satu kali:

```powershell
npm run db:seed
```

Jangan menjalankan seed berulang kali tanpa sengaja karena seed akan memperbarui password akun seed.

### 4. Jalankan backend

```powershell
Set-Location E:\Innovation-hub\prototype-1\backend
npm start
```

Biarkan terminal ini tetap terbuka.

Cek backend lokal dari PowerShell lain:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/health
```

Harus menghasilkan:

```text
StatusCode : 200
```

### 5. Jalankan Quick Tunnel

Buka PowerShell baru:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Salin URL `trycloudflare.com` yang muncul.

Saat ini URL yang digunakan adalah:

```text
https://cake-tagged-laptop-stick.trycloudflare.com
```

Cek URL publik:

```powershell
Invoke-WebRequest -UseBasicParsing https://cake-tagged-laptop-stick.trycloudflare.com/health
```

Hasil harus `StatusCode : 200`.

Jika `/` menghasilkan `404`, itu normal. Backend tidak memiliki route root. Gunakan `/health` untuk pengecekan.

### 6. Konfigurasi frontend lokal

Buka:

```text
frontend/.env.production.local
```

Isi menggunakan URL tunnel terbaru:

```env
VITE_API_URL=https://cake-tagged-laptop-stick.trycloudflare.com/api/v1
VITE_SOCKET_URL=https://cake-tagged-laptop-stick.trycloudflare.com/game
```

Jangan menggunakan URL tunnel lama.

Jangan menggunakan `localhost` untuk frontend yang diakses dari Cloudflare Pages.

### 7. Build frontend lokal

```powershell
Set-Location E:\Innovation-hub\prototype-1\frontend
npm install
npm run lint
npm run build
```

Jika berhasil, hasil build berada di:

```text
frontend/dist
```

### 8. Deploy frontend ke Cloudflare Pages

1. Buka <https://dash.cloudflare.com>.
2. Pilih **Workers & Pages**.
3. Buat project Pages baru, atau buka project yang sudah ada.
4. Hubungkan repository GitHub.
5. Pilih branch `main`.
6. Isi konfigurasi berikut:

```text
Framework preset: Vite
Root directory: frontend
Build command: npm run build
Build output directory: dist
```

Penting:

```text
Root directory = frontend
Build output directory = dist
```

Jangan mengisi root directory dengan `dist`.

### 9. Isi environment variable Cloudflare Pages

Di Cloudflare Pages, buka **Settings > Environment variables**.

Tambahkan pada environment **Production**:

```env
VITE_API_URL=https://cake-tagged-laptop-stick.trycloudflare.com/api/v1
VITE_SOCKET_URL=https://cake-tagged-laptop-stick.trycloudflare.com/game
```

Setelah menyimpan variable, lakukan **Retry deployment** atau deploy ulang.

Environment variable Vite dibaca saat build. Mengubah variable tanpa rebuild tidak mengubah frontend yang sudah ter-deploy.

### 10. Samakan CORS backend

Misalnya URL frontend Cloudflare Pages adalah:

```text
https://prototype--1.pages.dev
```

Maka `.env` backend harus memiliki:

```env
FRONTEND_URLS=https://prototype--1.pages.dev
```

Setelah mengubah `.env`, restart backend:

```powershell
Ctrl+C
npm start
```

### 11. Test login

Buka:

```text
https://prototype--1.pages.dev/login
```

Gunakan akun seed:

```text
Email: superadmin@gmail.com
Password: nilai SEED_SUPER_ADMIN_PASSWORD pada backend
```

Buka Developer Tools dengan `F12`, lalu tab **Network**.

Request yang benar:

```text
OPTIONS /api/v1/auth/login -> 204
POST /api/v1/auth/login    -> 200 jika password benar
```

Request harus menuju:

```text
https://cake-tagged-laptop-stick.trycloudflare.com/api/v1/auth/login
```

### 12. Jika URL tunnel berubah

Setiap kali Quick Tunnel dibuat ulang, URL dapat berubah.

Ulangi semua langkah berikut:

1. Salin URL tunnel baru.
2. Update `VITE_API_URL` di Cloudflare Pages.
3. Update `VITE_SOCKET_URL` di Cloudflare Pages.
4. Update `FRONTEND_URLS` jika domain frontend berubah.
5. Restart backend jika `.env` berubah.
6. Redeploy frontend.

## Bagian C: Deployment permanen, laptop boleh mati

Jika laptop benar-benar boleh mati, jangan memakai Quick Tunnel. Pindahkan backend dan database ke cloud.

Arsitektur:

```text
Browser
  |
  v
Cloudflare Pages
  |
  v
Railway backend Node.js + Socket.IO
  |
  v
Railway MySQL
```

### 1. Push repository ke GitHub

Dari folder repository:

```powershell
Set-Location E:\Innovation-hub\prototype-1
git status
git add backend frontend deploy
git commit -m "Add deployment documentation"
git push origin main
```

Jangan menjalankan `git add .` jika ada file pribadi yang tidak ingin dikirim.

### 2. Buat project backend di Railway

1. Buka <https://railway.app>.
2. Login dengan GitHub.
3. Klik **New Project**.
4. Pilih **Deploy from GitHub repo**.
5. Pilih repository PhillyoGo.
6. Pilih service hasil import repository.
7. Atur **Root Directory** menjadi:

```text
backend
```

8. Atur start command:

```text
npm start
```

Jangan gunakan `npm run dev` di server production.

### 3. Buat database MySQL cloud

Di project Railway:

1. Klik **New**.
2. Pilih **Database**.
3. Pilih **MySQL**.
4. Tunggu sampai database running.
5. Buka tab **Variables** atau **Connect**.
6. Salin host, port, database, username, dan password.

### 4. Isi variable backend cloud

Pada service backend Railway, tambahkan:

```env
NODE_ENV=production
API_PREFIX=/api/v1

FRONTEND_URL=https://prototype--1.pages.dev
FRONTEND_URLS=https://prototype--1.pages.dev

REFRESH_COOKIE_NAME=phillyogo_refresh
RETENTION_DAYS=30

DB_HOST=HOST_MYSQL_CLOUD
DB_PORT=3306
DB_NAME=NAMA_DATABASE_CLOUD
DB_USER=USER_DATABASE_CLOUD
DB_PASSWORD=PASSWORD_DATABASE_CLOUD
DB_CONNECTION_LIMIT=10

JWT_ACCESS_SECRET=SECRET_ACAK_PERTAMA
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_SECRET=SECRET_ACAK_KEDUA
JWT_REFRESH_EXPIRES_IN=30d

ROOM_SESSION_TTL_HOURS=24

SEED_SUPER_ADMIN_EMAIL=superadmin@gmail.com
SEED_SUPER_ADMIN_PASSWORD=PASSWORD_SUPERADMIN_BARU
SEED_SCHOOL_NAME=SMA Negeri 4 Bandung
SEED_SCHOOL_DOMAIN=sman4bandung.co.id
SEED_SCHOOL_ADMIN_PASSWORD=PASSWORD_ADMIN_BARU
```

Railway biasanya menyediakan `PORT` otomatis. Jangan memaksa `PORT=3000` jika Railway sudah membuat variable `PORT` sendiri.

Buat secret JWT dengan command berikut dua kali:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Jangan gunakan password atau secret contoh di atas untuk production.

### 5. Deploy dan beri domain backend

Tunggu deployment Railway selesai.

Buka **Settings > Networking > Generate Domain**.

Contoh hasil:

```text
https://phillyogo-backend-production.up.railway.app
```

Cek:

```powershell
Invoke-WebRequest -UseBasicParsing https://phillyogo-backend-production.up.railway.app/health
```

Harus menghasilkan status `200`.

### 6. Jalankan migration dan seed cloud

Migration harus dijalankan ke database cloud, bukan MySQL lokal:

```bash
npm run db:migrate
npm run db:seed
```

Gunakan Railway shell/run command jika tersedia. Jika menggunakan terminal lokal, pastikan `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, dan `DB_PASSWORD` menunjuk database cloud.

### 7. Konfigurasi frontend ke backend cloud

Pada Cloudflare Pages, gunakan environment variables Production:

```env
VITE_API_URL=https://phillyogo-backend-production.up.railway.app/api/v1
VITE_SOCKET_URL=https://phillyogo-backend-production.up.railway.app/game
```

Ganti hostname sesuai domain backend yang dibuat Railway.

Pastikan konfigurasi build tetap:

```text
Root directory: frontend
Build command: npm run build
Build output directory: dist
```

Lakukan redeploy frontend setelah mengubah variable.

### 8. Verifikasi CORS cloud

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

Header harus memuat:

```text
Access-Control-Allow-Origin: https://prototype--1.pages.dev
Access-Control-Allow-Credentials: true
```

### 9. Test setelah laptop mati

Setelah semua test berhasil:

1. Pastikan frontend memakai URL Railway, bukan URL `trycloudflare.com`.
2. Pastikan backend Railway berstatus running.
3. Pastikan database cloud berstatus running.
4. Matikan backend lokal.
5. Matikan laptop atau tutup Quick Tunnel.
6. Buka kembali `https://prototype--1.pages.dev/login`.
7. Coba login dan buka fitur game.

Jika aplikasi tetap berjalan, deployment sudah tidak bergantung pada laptop.

## Bagian D: Checklist akhir

### Testing cepat

```text
[ ] MySQL lokal running
[ ] Backend lokal running
[ ] /health lokal status 200
[ ] cloudflared running
[ ] /health tunnel status 200
[ ] FRONTEND_URLS berisi domain Pages
[ ] VITE_API_URL memakai URL tunnel terbaru
[ ] VITE_SOCKET_URL memakai URL tunnel terbaru
[ ] Cloudflare Pages build berhasil
[ ] Login berhasil
```

### Deployment permanen

```text
[ ] Backend cloud running
[ ] MySQL cloud running
[ ] Migration cloud berhasil
[ ] Seed cloud berhasil satu kali
[ ] Backend cloud /health status 200
[ ] Frontend Pages memakai URL backend cloud
[ ] CORS backend mengizinkan domain Pages
[ ] Socket.IO memakai URL backend cloud
[ ] Login berhasil
[ ] Aplikasi tetap berjalan setelah laptop mati
```

## Keamanan

Jangan commit atau membagikan:

- `backend/.env`;
- password database;
- `JWT_ACCESS_SECRET`;
- `JWT_REFRESH_SECRET`;
- password superadmin;
- password admin sekolah.

Secret JWT yang pernah tertulis di file atau percakapan publik sebaiknya diganti sebelum deployment production.
