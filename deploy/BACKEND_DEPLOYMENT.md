# Backend Deployment Guide

Panduan ini menjalankan backend PhillyoGo dari laptop menggunakan MySQL lokal dan Cloudflare Tunnel.

## Arsitektur

```text
User internet
    |
    v
Cloudflare Tunnel
    |
    v
Backend Node.js di laptop
    |
    v
MySQL lokal di laptop
```

Laptop, MySQL, backend, dan Cloudflare Tunnel harus tetap berjalan agar aplikasi dapat diakses.

## 1. Hentikan proses lama

Buka PowerShell:

```powershell
Get-Process node,cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
```

Tidak ada output berarti tidak ada proses lama yang aktif.

## 2. Masuk ke backend

```powershell
Set-Location E:\Innovation-hub\prototype-1\backend
```

## 3. Konfigurasi `.env`

Buka file environment:

```powershell
notepad .env
```

Gunakan konfigurasi berikut dan sesuaikan password MySQL:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173

REFRESH_COOKIE_NAME=phillyogo_refresh
RETENTION_DAYS=30

DB_HOST=localhost
DB_PORT=3306
DB_NAME=phillyogo
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_LIMIT=10

JWT_ACCESS_SECRET=ISI_SECRET_ACAK_1
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_SECRET=ISI_SECRET_ACAK_2
JWT_REFRESH_EXPIRES_IN=30d

ROOM_SESSION_TTL_HOURS=24

SEED_SUPER_ADMIN_EMAIL=superadmin@gmail.com
SEED_SUPER_ADMIN_PASSWORD=PASSWORD_SUPERADMIN_BARU
SEED_SCHOOL_NAME=SMA Negeri 4 Bandung
SEED_SCHOOL_DOMAIN=sman4bandung.co.id
SEED_SCHOOL_ADMIN_PASSWORD=PASSWORD_ADMIN_BARU
```

Jika MySQL memakai password, isi:

```env
DB_PASSWORD=password_mysql_anda
```

Jika MySQL tidak memakai password, biarkan kosong.

### Membuat secret JWT

Jalankan perintah berikut dua kali:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Gunakan hasil pertama untuk `JWT_ACCESS_SECRET` dan hasil kedua untuk `JWT_REFRESH_SECRET`.

Jangan gunakan nilai default berikut:

```text
replace-with-a-long-random-secret
replace-with-another-long-random-secret
Bismillah
SMA4@2026
```

Jangan commit file `.env` ke Git.

## 4. Pastikan MySQL aktif

Pastikan service MySQL berjalan sebelum migration.

## 5. Jalankan migration

```powershell
npm run db:migrate
```

Jika database masih kosong dan membutuhkan data awal:

```powershell
npm run db:seed
```

Jangan menjalankan seed berulang kali pada database yang sudah berisi data.

## 6. Jalankan backend

```powershell
npm start
```

Biarkan terminal ini tetap terbuka.

## 7. Cek backend lokal

Buka PowerShell baru:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/health
```

Hasil yang benar memiliki `StatusCode: 200`.

## 8. Buat URL publik

Buka PowerShell baru:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Tunggu sampai muncul URL seperti:

```text
https://nama-acak.trycloudflare.com
```

Simpan URL tersebut.

## 9. Cek URL publik

Ganti URL sesuai hasil tunnel:

```powershell
Invoke-WebRequest -UseBasicParsing https://nama-acak.trycloudflare.com/health
```

Jika statusnya `200`, backend dapat diakses dari internet.

## 10. Konfigurasi frontend

Setelah URL tunnel tersedia, frontend menggunakan:

```env
VITE_API_URL=https://nama-acak.trycloudflare.com/api/v1
VITE_SOCKET_URL=https://nama-acak.trycloudflare.com/game
```

Untuk frontend production, tambahkan domain frontend ke backend:

```env
FRONTEND_URLS=https://domain-frontend-anda
```

Jika masih perlu akses lokal, pisahkan dengan koma:

```env
FRONTEND_URLS=http://localhost:5173,https://domain-frontend-anda
```

Setelah mengubah `.env`, restart backend.

## Penghentian deployment

Tekan `Ctrl+C` pada terminal backend dan terminal Cloudflare Tunnel.

Atau gunakan:

```powershell
Get-Process node,cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
```

## Catatan penting

- Quick Tunnel gratis dan tidak membutuhkan kartu kredit.
- URL Quick Tunnel berubah setiap kali tunnel dibuat ulang.
- Laptop dan MySQL harus tetap menyala.
- Database tersimpan di MySQL lokal laptop.
- Lakukan backup database secara berkala.
- Quick Tunnel cocok untuk testing/demo, bukan deployment produksi permanen.
- Jangan membagikan `.env`, password MySQL, JWT secret, atau password akun admin.
