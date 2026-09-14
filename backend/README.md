# PhillyoGo Backend

Backend Node.js + Express untuk PhillyoGo dengan MySQL, JWT refresh token, dan Socket.IO.

## Menjalankan

```bash
npm install
copy .env.example .env
npm run dev
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
