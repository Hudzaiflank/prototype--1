# PhillyoGo Backend

Backend Node.js + Express untuk PhillyoGo dengan MySQL, JWT refresh token, dan Socket.IO.

## Menjalankan

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Retention game data dijalankan secara ringan melalui command terjadwal:

```powershell
npm run db:cleanup
```

Import guru menggunakan field multipart `file` berformat `.xlsx` atau `.xls`.
Kolom yang dibaca adalah `Nama Lengkap` dan `Email` (opsional). Guru hasil import
menggunakan password awal `Guru@123` dan credential hanya dikembalikan pada
workflow pembuatan/import.

Socket integration test membutuhkan server yang sedang berjalan dan token teacher:

```powershell
$env:RUN_SOCKET_TEST="1"
$env:PHILLYOGO_ACCESS_TOKEN="<access-token>"
$env:GAME_SESSION_ID="<session-id-owned-by-teacher>"
npm run test:socket
```

Health check tersedia di `GET /health` dan API menggunakan prefix `/api/v1`.

## Struktur

- `src/controllers`: request/response HTTP saja.
- `src/services`: business logic, state transition, matching, session, dan transaction orchestration.
- `src/repositories`: query MySQL, transaction, dan row lock.
- `src/sockets`: authorization dan event Socket.IO namespace `/game`.
- `src/middleware` dan `src/validators`: security, role/school isolation, dan input validation.
- `database/migrations`: schema dan index database.
- `tests`: unit/integration test untuk matching dan state machine.

## Local development credentials

Nilai seed default mengikuti PRD dan dapat diubah melalui `.env`:

- Super Admin: `superadmin@gmail.com` / `Bismillah`
- Sample school: `SMA Negeri 4 Bandung`
- Sample school admin: `admin.sma-negeri-4-bandung@phillyogo.id` / `SMA4@2026`

Untuk local development, konfigurasi MySQL default adalah `localhost:3306`, user
`root`, database `phillyogo`. Jangan gunakan credential development tersebut saat
deploy ke VPS.
