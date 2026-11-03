# Deploy PhillyoGo ke Cloudflare Workers dan Pages

Panduan ini menjalankan backend di Cloudflare Workers, menyimpan data di TiDB Cloud yang sudah dibuat, dan menyajikan frontend melalui Cloudflare Pages.

```text
Browser -> Cloudflare Pages -> Cloudflare Worker -> Hyperdrive -> TiDB Cloud
                         \-> WebSocket -> Durable Objects
```

Worker dan Pages berjalan di cloud; laptop tidak perlu tetap menyala setelah setup. Gunakan paket **Free** dan jangan memilih upgrade berbayar. Paket gratis tidak menjanjikan SLA 24/7: Workers, Durable Objects, dan TiDB memiliki batas kuota. Cloudflare biasanya menyediakan Workers Free tanpa kartu, tetapi verifikasi akun dapat berbeda. Jika Cloudflare meminta kartu dan Anda tidak ingin memasukkannya, berhenti dan jangan menambahkan metode pembayaran.

## 1. Siapkan akun Cloudflare dan repository

1. Masuk ke akun Cloudflare dan pastikan akun tetap pada paket Free.
2. Pastikan repository PhillyoGo sudah tersimpan di GitHub dan branch production sudah tersedia.
3. Anda akan menggunakan terminal hanya untuk migrasi database dan deployment awal. Setelah deployment berhasil, backend berjalan di cloud dan laptop boleh dimatikan.
4. Jangan mengirim password TiDB atau secret JWT melalui chat, GitHub, atau commit.

## 2. Pastikan schema TiDB siap

TiDB dan database `phillyogo` yang sudah dibuat tetap dipakai. Hyperdrive hanya menjadi jalur koneksi; database tidak dipindahkan ke Cloudflare.

1. Ambil host, port, nama database, username, dan password dari halaman koneksi TiDB. Gunakan endpoint **public** yang dapat dicapai Cloudflare, bukan endpoint private/VPC.
2. TiDB Cloud biasanya memakai port `4000` dan mewajibkan TLS. Bila password TiDB pernah dibagikan atau terlihat di screenshot, reset password itu lebih dahulu.
3. Dari folder `backend`, instal dependency yang dikunci di repository:

   ```powershell
   npm ci
   ```

4. Buat `backend/.env` dari `.env.example` dan isi hanya di komputer lokal. Contoh variabel penting:

   ```env
   NODE_ENV=production
   DB_HOST=HOST_TIDB
   DB_PORT=4000
   DB_NAME=phillyogo
   DB_USER=USERNAME_TIDB
   DB_PASSWORD=PASSWORD_TIDB
   DB_SSL=true
   DB_CONNECTION_LIMIT=5
   ```

5. Jalankan migrasi schema langsung ke TiDB:

   ```powershell
   npm run db:migrate
   ```

6. Jika database masih baru dan belum memiliki akun awal, isi variabel `SEED_*` di `.env`, lalu jalankan seed satu kali:

   ```powershell
   npm run db:seed
   ```

   Jangan jalankan seed berulang kali tanpa memeriksa dampaknya pada data yang sudah ada. Migrasi menggunakan koneksi database langsung; jangan mengarahkannya ke Hyperdrive.

## 3. Buat Hyperdrive ke TiDB

Hyperdrive menyediakan koneksi database yang dikelola Cloudflare untuk Worker.

> **Known blocker for this TiDB connection:** while creating the Hyperdrive connection for this TiDB Cloud Starter instance, Cloudflare returned `Hyperdrive does not currently support MySQL AuthSwitchRequest messages`. This is a MySQL authentication-protocol compatibility error, not a malformed connection string. Do not proceed to Worker deployment until Cloudflare confirms a supported workaround for this endpoint. Disabling query caching does not resolve this authentication error.

1. Di dashboard Cloudflare, buka **Storage & databases > Hyperdrive** lalu buat konfigurasi baru.
2. Pilih database MySQL-compatible dan masukkan host, port, nama database, username, serta password TiDB.
3. Aktifkan TLS/SSL untuk koneksi ke TiDB jika ditawarkan, lalu gunakan **Test connection** sebelum membuat konfigurasi.
4. Simpan konfigurasi dan salin **Hyperdrive ID**. Jangan salin connection string yang berisi password ke file yang di-commit.

Jika muncul error `AuthSwitchRequest`, hentikan proses pembuatan konfigurasi dan tanyakan ke Cloudflare Support apakah Hyperdrive saat ini mendukung plugin/autentikasi yang dipakai TiDB Cloud Starter. Sertakan pesan error persisnya serta keterangan driver/origin database, tetapi jangan sertakan password, connection string, atau screenshot yang memuat kredensial.

## 4. Buat Cloudflare Pages untuk frontend

1. Buka **Workers & Pages > Create application > Pages > Connect to Git**.
2. Pilih repository PhillyoGo, lalu atur:
   - **Project name**: `phillyogo` (atau nama yang tersedia).
   - **Production branch**: branch rilis, biasanya `main`.
   - **Root directory**: `frontend`.
   - **Build command**: `npm run build`.
   - **Build output directory**: `dist`.
3. Pilih **Save and Deploy**. Tunggu build awal selesai dan catat origin Pages, misalnya `https://phillyogo.pages.dev`.
4. Origin berarti hostname saja—tanpa path dan tanpa slash akhir. Origin ini diperlukan untuk mengizinkan request API dari browser.

## 5. Konfigurasikan dan deploy backend Worker

File konfigurasi Worker ada di `backend/wrangler.jsonc`.

1. Ganti nilai berikut di konfigurasi:
   - `hyperdrive[0].id`: isi dengan Hyperdrive ID dari langkah 3.
   - `vars.FRONTEND_URLS`: isi dengan origin Pages yang sebenarnya, misalnya `https://phillyogo.pages.dev`.
2. Jika Anda memakai custom domain atau preview Pages, tambahkan origin-origin yang diperlukan ke `FRONTEND_URLS`, dipisahkan koma. Setelah mengubahnya, deploy Worker kembali.
3. Dari terminal, masuk ke `backend` dan autentikasi Wrangler:

   ```powershell
   npx wrangler login
   ```

4. Buat dua secret JWT secara terpisah. Wrangler meminta nilai secret secara interaktif; gunakan nilai acak yang panjang dan jangan memasukkannya ke `wrangler.jsonc`:

   ```powershell
   npx wrangler secret put JWT_ACCESS_SECRET
   npx wrangler secret put JWT_REFRESH_SECRET
   ```

   Secret ini harus stabil setelah deployment, karena token yang ditandatangani backend bergantung padanya.

5. Deploy Worker:

   ```powershell
   npm run deploy:worker
   ```

6. Catat URL yang ditampilkan Wrangler, misalnya `https://phillyogo-api.<subdomain>.workers.dev`. URL itu menjadi base URL backend.
7. Periksa endpoint kesehatan dengan browser atau PowerShell:

   ```powershell
   Invoke-WebRequest -UseBasicParsing https://URL-WORKER/health
   ```

   Response yang diharapkan berstatus `200`. Bila gagal, lihat **Workers & Pages > phillyogo-api > Logs** dan pastikan Hyperdrive serta kedua secret sudah terpasang.

## 6. Hubungkan Pages ke Worker

1. Di Cloudflare, buka project Pages `phillyogo` > **Settings > Environment variables**.
2. Tambahkan variable **Production** berikut:

   | Variable | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://URL-WORKER/api/v1` |
   | `VITE_REALTIME_URL` | `https://URL-WORKER` |

   Ganti `URL-WORKER` dengan hostname Worker dari langkah 5, tanpa `/` di akhir. `VITE_REALTIME_URL` membuat frontend memakai WebSocket native untuk Durable Objects. `VITE_SOCKET_URL` hanya diperlukan untuk backend Socket.IO lokal atau legacy.

3. Simpan variable dan buat deployment frontend baru dari **Deployments > Retry deployment** (atau push commit ke production branch).
4. Tunggu status **Success**, klik **Visit**, lalu hard refresh browser (`Ctrl+F5`).
5. Tes alur login, membuat room, join siswa, dan koneksi realtime guru/siswa.

## 7. Cara update atau refresh

### Memperbarui frontend

Dengan Git integration, perubahan di branch production otomatis membuat deployment Pages baru:

1. Ubah file di `frontend/`.
2. Commit perubahan yang relevan saja, lalu push ke branch production.
3. Buka **Workers & Pages > phillyogo > Deployments** dan tunggu status **Success**.
4. Klik **Visit**. Jika browser masih memuat asset lama, lakukan hard refresh (`Ctrl+F5`).

Perubahan variable `VITE_*` tidak mengubah build yang sudah ada. Setelah mengubahnya di **Settings > Environment variables**, jalankan deployment baru atau pilih **Retry deployment**.

### Memperbarui backend

1. Push perubahan backend ke GitHub sesuai alur kerja repository.
2. Dari folder `backend`, jalankan:

   ```powershell
   npm run deploy:worker
   ```

3. Periksa **Workers & Pages > phillyogo-api > Deployments** dan log Worker, lalu uji `/health` serta fitur yang berubah.

Deploy ulang Worker jika mengubah `wrangler.jsonc`, binding Hyperdrive, binding Durable Objects, `FRONTEND_URLS`, atau kode backend.

## Troubleshooting singkat

- **CORS ditolak**: samakan `FRONTEND_URLS` di `backend/wrangler.jsonc` dengan origin Pages persis, deploy ulang Worker, lalu reload Pages.
- **Database gagal tersambung**: uji Hyperdrive connection, periksa host/port `4000`, username/password, TLS, dan pastikan IP/database menerima koneksi dari luar.
- **Login gagal setelah deployment**: pastikan `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` tersimpan sebagai Worker secrets dan tidak berubah setelah token diterbitkan.
- **WebSocket gagal tersambung**: pastikan Pages memiliki `VITE_REALTIME_URL` yang menunjuk ke Worker, deploy ulang Pages setelah mengubah variable, dan periksa log Worker.
- **Worker build gagal**: dari `backend`, jalankan `npx wrangler deploy --dry-run` untuk melihat error bundling sebelum deploy.

## Batasan dan keamanan

- Worker tidak menjalankan proses server yang harus terus hidup, tetapi layanan gratis tetap tunduk pada kuota dan kebijakan Cloudflare/TiDB. Jangan anggap ini sebagai SLA produksi.
- WebSocket realtime memakai Durable Objects. Pastikan penggunaan tetap dalam kuota akun Free.
- Hyperdrive menyimpan detail koneksi database di sisi Cloudflare; jangan menaruh password database dalam variable frontend atau file konfigurasi yang di-commit.
- Migrasi dan seed dijalankan dari terminal lokal ke TiDB. Setelahnya, aplikasi yang digunakan pengunjung berjalan di Cloudflare, bukan di laptop.
- Pada Worker ini, token autentikasi WebSocket dikirim sebagai frame autentikasi pertama, bukan sebagai query parameter URL.
