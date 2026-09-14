# PhillyoGo Frontend

Frontend React + Vite + Tailwind untuk PhillyoGo.

## Menjalankan

```bash
npm install
copy .env.example .env
npm run dev
```

## Struktur

- `pages` berisi komposisi layar berdasarkan role dan lifecycle room.
- `components` berisi UI reusable dan komponen gameplay kartu.
- `layouts` dan `routes` menangani shell role, protected route, dan student route.
- `context`, `store`, dan `hooks` menangani auth, game state, realtime, dan participant session.
- `services/api` dan `services/socket` adalah satu-satunya boundary REST/Socket.IO.
- `utils` berisi storage session, validasi, formatter, dan constants.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
