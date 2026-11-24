# Migrasi PhillyoGo ke Hostinger KVM 2 - Panduan Pemula

Dokumen ini adalah satu-satunya runbook yang dibutuhkan untuk memindahkan aplikasi dari Aiven dan Back4App ke Hostinger KVM 2.

```text
Pengguna
  -> Cloudflare DNS
  -> Cloudflare Pages (frontend React/Vite)
  -> HTTPS/WSS api.<domain>
  -> Nginx
  -> Docker Compose
       -> Node.js 22 + Express + Socket.IO
       -> MySQL 8.4 LTS
```

Target akhir:

| Komponen | Target |
|---|---|
| Provider VPS | Hostinger KVM 2 |
| OS | Ubuntu Server 24.04 LTS |
| Backend | Docker Compose, Node.js 22 |
| Database | MySQL 8.4 LTS di Docker |
| Reverse proxy | Nginx |
| HTTPS | Certbot/Let’s Encrypt |
| Frontend | Tetap Cloudflare Pages |
| DNS | Cloudflare |
| Monitoring | Hostinger panel, UptimeRobot, log Docker/Nginx, resource server |
| Backup | Mysqldump harian + unduh manual ke komputer terpisah |

> **WAJIB PERHATIAN:** Teks `<WAJIB_ISI...>` atau `<WAJIB_DIGANTI...>` adalah placeholder. Placeholder **bukan nilai production**.
>
> - Jangan copy-paste dan jalankan command yang masih berisi placeholder.
- Jangan isi password dengan nilai contoh.
- Buat secret baru sendiri.
- Simpan semua secret pada password manager.
- Jangan kirim secret ke Git, chat, README, atau environment frontend.
- Environment `VITE_*` menjadi terlihat oleh browser dan bukan tempat password.

## Cara belajar dan membaca panduan

Setiap langkah dirancang agar Anda tidak hanya menyalin perintah, tetapi memahami alasan dan hasilnya.

### Label dalam dokumen

| Label | Artinya |
|---|---|
| `Apa itu` | Penjelasan teknologi atau istilah |
| `Tujuan` | Alasan langkah dilakukan |
| `Lakukan` | Klik, perintah, atau pengisian yang dijalankan |
| `<WAJIB_DIGANTI: ...>` | Placeholder; jangan dijalankan sebelum diganti |
| `Contoh actual` | Bentuk nilai setelah Anda mengisi milik sendiri |
| `Simpan ke password manager` | Nilai rahasia yang harus dicatat |
| `Hasil benar` | Kondisi yang membuktikan langkah berhasil |
| `BERHENTI` | Jangan lanjut jika kondisi ini belum terpenuhi |

### Placeholder dan contoh actual

Contoh format yang belum boleh dijalankan:

```bash
ssh ubuntu@<WAJIB_DIGANTI: IP_IPV4_VPS>
```

Contoh actual hanya ilustrasi. Jangan gunakan IP, password, atau domain orang lain:

```bash
ssh ubuntu@203.0.113.10
```

Nilai `203.0.113.10` di atas berasal dari contoh dokumentasi, bukan VPS Anda. IP actual Anda diambil dari panel **Hostinger -> VPS -> Overview**.

### Daftar lengkap nilai yang wajib diganti beserta contoh

Aturan berikut berlaku untuk **setiap** `<WAJIB_DIGANTI: ...>` atau `<WAJIB_ISI: ...>` dalam dokumen ini.

| Placeholder | Contoh actual non-production | Diambil dari mana |
|---|---|---|
| `IP_IPV4_VPS` | `203.0.113.10` | Panel Hostinger, menu VPS -> Overview -> IPv4 |
| `DOMAIN_FRONTEND` | `app.piscall.com` | Domain/custom domain Cloudflare Pages milik Anda |
| `DOMAIN_BACKEND` | `api.piscall.com` | Subdomain API yang Anda buat di Cloudflare DNS |
| `DOMAIN_ROOT` | `piscall.com` | Nama domain utama dari registrar/Cloudflare |
| `EMAIL_ADMIN` | `admin@piscall.com` | Email administrator yang Anda buat sendiri |
| `SSH_USER` | `phillyogo` | Nama user Linux yang Anda buat pada langkah 2 |
| `AIVEN_HOST` | `mysql-aiven-example.aivencloud.com` | Dashboard Aiven -> Service -> Overview -> Host |
| `AIVEN_PORT` | `3306` | Dashboard Aiven -> Service -> Overview -> Port |
| `AIVEN_DATABASE` | `phillyogo` | Dashboard Aiven -> Service -> Overview -> Database |
| `AIVEN_USER` | `avnadmin-example` | Dashboard Aiven -> Service -> Overview -> User |
| `COMMIT_SHA` | `a1b2c3d4e5f6` | GitHub/Git: SHA commit rilis yang disetujui pemilik proyek |
| `COMMIT_SHA_RELEASE_SEBELUMNYA` | `9f8e7d6c5b4a` | `git log -n 5 --oneline` dari release yang terakhir sehat |
| `MYSQL_ROOT_PASSWORD_DARI_PASSWORD_MANAGER` | `CONTOH_JANGAN_PAKAI_ROOT1122AbCd` | Hasil unik pertama `openssl rand -hex 48` |
| `DB_PASSWORD_DARI_PASSWORD_MANAGER` | `CONTOH_JANGAN_PAKAI_DB9988AbCd` | Hasil unik kedua `openssl rand -hex 48` |
| `DB_PASSWORD_YANG_SAMA_DI_ATAS` | `CONTOH_JANGAN_PAKAI_DB9988AbCd` | Harus sama persis dengan `DB_PASSWORD` pada `.env` Compose |
| `JWT_ACCESS_SECRET_DARI_PASSWORD_MANAGER` | `CONTOH_JANGAN_PAKAI_ACCESS7788EfGh` | Hasil unik ketiga `openssl rand -hex 48` |
| `JWT_REFRESH_SECRET_DARI_PASSWORD_MANAGER` | `CONTOH_JANGAN_PAKAI_REFRESH6677IjKl` | Hasil unik keempat `openssl rand -hex 48` |
| `EMAIL_SUPER_ADMIN_PRODUCTION` | `superadmin@piscall.com` | Email produksi yang Anda tentukan; hanya dipakai saat seed database baru |
| `SEED_SUPER_ADMIN_PASSWORD` | `CONTOH_JANGAN_PAKAI_ADMIN4455MnOp` | Hasil unik `openssl rand -hex 24` |
| `NAMA_SEKOLAH_PRODUCTION` | `SMA Negeri Contoh` | Nama sekolah production; jangan memakai nama sekolah palsu pada data production |
| `DOMAIN_SEKOLAH` | `sekolah.piscall.com` | Domain sekolah yang valid atau nilai yang ditentukan pemilik proyek |
| `SEED_SCHOOL_ADMIN_PASSWORD` | `CONTOH_JANGAN_PAKAI_SCHOOL3344QrSt` | Hasil unik kedua `openssl rand -hex 24` |
| `TIMESTAMP_BACKUP` | `2026-11-23-0230` | Nama file dari `ls /opt/phillyogo/backups` |
| `BACKUP_FILENAME` | `phillyogo-2026-11-23-0230.sql` | Nama backup yang sudah diuji sebelum digunakan rollback |

**Contoh satu set data actual ilustratif:**

```text
IP_IPV4_VPS         = 203.0.113.10
DOMAIN_ROOT         = piscall.com
DOMAIN_FRONTEND     = app.piscall.com
DOMAIN_BACKEND      = api.piscall.com
EMAIL_ADMIN         = admin@piscall.com
SSH_USER            = phillyogo
AIVEN_HOST          = mysql-aiven-example.aivencloud.com
AIVEN_PORT          = 3306
AIVEN_DATABASE      = phillyogo
AIVEN_USER          = avnadmin-example
COMMIT_SHA          = a1b2c3d4e5f6
```

Semua nilai contoh di atas hanya ilustrasi. Jangan copy ke production. Setiap command yang masih memuat salah satu placeholder tersebut harus diganti terlebih dahulu.

### Istilah yang sering dipakai

| Istilah | Penjelasan mudah |
|---|---|
| VPS | Komputer server yang disewa dan selalu terhubung ke internet |
| KVM | Teknologi virtualisasi yang membatasi sumber daya VPS |
| Ubuntu | Sistem operasi Linux yang dijalankan VPS |
| SSH | Cara aman membuka terminal server dari Windows |
| Terminal | Jendela untuk mengetik command text |
| Root | Akun Linux dengan hak penuh; jangan dipakai untuk operasi harian |
| Sudo | Hak administrator sementara untuk satu perintah |
| SSH key | Pasangan kunci publik dan privat untuk login aman |
| Passphrase | Kalimat rahasia yang melindungi private SSH key |
| Private key | Kunci rahasia di komputer; tidak boleh dibagikan |
| Public key | Kunci yang boleh ditempatkan pada server |
| Firewall | Pengatur koneksi jaringan yang boleh masuk atau keluar |
| Port | Nomor pintu jaringan, misalnya 22, 80, dan 443 |
| Docker | Alat menjalankan aplikasi dalam container terisolasi |
| Container | Lingkungan proses yang berisi satu aplikasi |
| Docker Compose | Pengaturan sekaligus untuk beberapa container |
| MySQL | Database tempat data aplikasi disimpan |
| Nginx | Penerima HTTPS yang meneruskan request ke backend |
| Reverse proxy | Pelayan perantara antara internet dan backend lokal |
| DNS | Pemetaan nama domain ke IP VPS |
| TLS/HTTPS | Enkripsi traffic internet |
| Certbot | Alat membuat dan memperbarui sertifikat HTTPS |
| CORS | Aturan backend agar hanya domain frontend yang diizinkan dapat memakai API |
| Environment variable | Nilai konfigurasi yang dibaca aplikasi saat dijalankan |
| Secret | Password atau kunci rahasia |
| Log | Catatan error atau aktivitas |
| Backup | Salinan database untuk pemulihan |
| Restore | Uji/ proses memulihkan backup ke database lain |
| Cutover | Pemindahan traffic produksi ke VPS baru |
| Rollback | Pengembalian source/database/DNS lama bila cutover gagal |

### Mengapa SSH memakai passphrase

**Apa itu:** passphrase adalah kalimat rahasia tambahan yang mengenkripsi atau melindungi private SSH key.

**Tujuan:** jika laptop karyawan hilang, private key tidak langsung dapat dipakai oleh pencuri. Operator tetap memerlukan passphrase.

**Alur:**

1. Anda membuat pasangan public/private key.
2. Private key tersimpan di komputer.
3. Public key tersimpan di VPS.
4. Saat SSH dijalankan, VPS memeriksa private key.
5. Private key meminta passphrase jika passphrase telah ditetapkan.

Private key default Windows ada di:

```text
$HOME\.ssh\id_ed25519
```

Public key ada di:

```text
$HOME\.ssh\id_ed25519.pub
```

Yang Anda tampilkan dan kirim ke VPS adalah isi file `.pub`. Jangan pernah menampilkan atau mengirim file `id_ed25519` tanpa `.pub`.

## 0. Persiapan

Siapkan sebelum membuka VPS:

- [ ] VPS Hostinger KVM 2 telah dibeli.
- [ ] Ubuntu Server 24.04 dipilih saat membuat VPS.
- [ ] Domain utama sudah aktif.
- [ ] Akun Cloudflare dapat membuka DNS/domain.
- [ ] Akun GitHub dapat membuka repository ini.
- [ ] Kredensial Aiven untuk database lama tersedia.
- [ ] Password manager tersedia.
- [ ] Komputer Windows memiliki PowerShell.
- [ ] Terminal lama tetap terbuka selama konfigurasi SSH.
- [ ] Maintenance window disepakati.
- [ ] Backup terakhir Aiven tersedia.
- [ ] Tanggal dan jam cutover dicatat dalam WIB.
- [ ] Versi MySQL lama Aiven dicatat.
- [ ] Snapshot VPS awal dibuat di panel Hostinger.

Untuk snapshot awal:

1. Buka Hostinger **VPS**.
2. Buka menu **Snapshots**.
3. Buat snapshot sebelum perubahan konfigurasi besar.
4. Catat nama snapshot, tanggal, dan waktu.

Untuk versi MySQL Aiven, jalankan:

```sql
SELECT VERSION();
```

### 0.1 Data yang wajib diisi

Isi tabel ini secara manual. Jangan mengandalkan nilai contoh.

| Item | Contoh ilustrasi | Nilai Anda |
|---|---|---|
| IP IPv4 VPS | `203.0.113.10` | `<WAJIB_ISI: IP_IPV4_VPS>` |
| Domain frontend | `app.example.com` | `<WAJIB_ISI: DOMAIN_FRONTEND>` |
| Domain backend | `api.example.com` | `<WAJIB_ISI: DOMAIN_BACKEND>` |
| Domain root | `example.com` | `<WAJIB_ISI: DOMAIN_ROOT>` |
| Email pemilik VPS | `admin@example.com` | `<WAJIB_ISI: EMAIL_ADMIN>` |
| SSH user | `phillyogo` | `<WAJIB_ISI: SSH_USER>` |
| Host Aiven | `host.aivencloud.com` | `<WAJIB_ISI: AIVEN_HOST>` |
| Port Aiven | `3306` | `<WAJIB_ISI: AIVEN_PORT>` |
| Database Aiven | `phillyogo` | `<WAJIB_ISI: AIVEN_DATABASE>` |
| User Aiven | `avnadmin` | `<WAJIB_ISI: AIVEN_USER>` |
| Release commit | `1234567` | `<WAJIB_ISI: COMMIT_SHA>` |

### 0.2 Password yang harus dibuat sendiri

Berikut password/secret yang harus Anda generate sendiri. Jangan copy password dari dokumen ini.

| Secret | Perintah generate | Simpan di |
|---|---|---|
| Password MySQL root | `openssl rand -hex 48` | Password manager |
| Password user MySQL backend | `openssl rand -hex 48` | Password manager |
| JWT access secret | `openssl rand -hex 48` | Password manager |
| JWT refresh secret | `openssl rand -hex 48` | Password manager |
| Password seed Super Admin | `openssl rand -hex 24` | Password manager |
| Password seed Admin sekolah | `openssl rand -hex 24` | Password manager |

> **INI HARUS DIGANTI OLEH ANDA SENDIRI, JANGAN COPAS.** Setiap hasil `openssl rand` adalah secret yang unik dan tidak boleh ditulis di Git atau di chat.

Jika migration memakai database Aiven yang sudah berisi account production:

- Jangan jalankan seed.
- Password account lama tetap dipertahankan.
- Generate JWT secret baru hanya jika memang ingin semua session lama tidak valid.

## 1. Membuat VPS Hostinger

### 1.1 Pilih paket dan OS

1. Login ke akun Hostinger.
2. Buka **VPS**.
3. Pilih server KVM 2.
4. Pilih **Ubuntu 24.04 64-bit**.
5. Pilih lokasi terdekat dengan pengguna aplikasi.
6. Aktifkan 2FA pada akun Hostinger.
7. Tambahkan SSH public key saat installer meminta.
8. Catat IP IPv4 VPS.
9. Catat username awal.
10. Simpan password awal pada password manager.

Jangan memilih password root lama sebagai password permanen.

### 1.2 Buat SSH key di Windows

**Apa itu:** SSH key adalah pasangan dua file digital, public key dan private key.

**Tujuan:** membuktikan identitas Anda ke VPS tanpa mengirim password Linux setiap kali login.

Buka PowerShell:

```powershell
ssh-keygen -t ed25519 -C "phillyogo-production"
```

Tekan Enter untuk lokasi default jika tidak memiliki key lama. Masukkan passphrase yang kuat.

Contoh layar saat menjalankan:

```text
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase): [anda mengetik, layar tidak menampilkan]
Enter same passphrase again: [anda mengetik ulang]
Your identification has been saved in C:\Users\<nama-pengguna>\.ssh\id_ed25519
Your public key has been saved in C:\Users\<nama-pengguna>\.ssh\id_ed25519.pub
```

> **CONTOH SAJA, BUKAN NILAI ASLI:** `<nama-pengguna>` akan menjadi nama Windows Anda, misalnya `budi`.

Saat tidak memiliki key lama, hasil contoh:

```text
C:\Users\Budi\.ssh\id_ed25519
C:\Users\Budi\.ssh\id_ed25519.pub
```

`id_ed25519` adalah private key. `id_ed25519.pub` adalah public key.

**Apa yang harus disimpan:**

1. Passphrase SSH disimpan sebagai entri password manager.
2. Lokasi private key tidak perlu dipindah.
3. Private key tidak boleh disalin ke chat atau server.
4. Public key boleh disalin ke Hostinger.

Ambil public key:

```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

Salin satu baris `ssh-ed25519 ...` ke Hostinger saat membuat VPS. Jangan salin isi private key `id_ed25519`.

Contoh isi public key (bukan key actual):

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIContohTidakBolehDipakai phillyogo-production
```

### 1.3 Login pertama

**Apa itu:** SSH membuka terminal remote VPS dari Windows.

**Tujuan:** menjalankan perintah administrasi VPS melalui koneksi yang dienkripsi.

Contoh, ganti placeholder:

```powershell
ssh root@<WAJIB_DIGANTI: IP_IPV4_VPS>
```

Contoh setelah Anda mengganti `<WAJIB_DIGANTI: IP_IPV4_VPS>`:

```powershell
ssh root@203.0.113.10
```

Contoh IP di atas bukan milik Anda dan hanya menunjukkan bentuk command. Ambil IP dari panel Hostinger **VPS -> Overview -> IPv4**.

Jika Hostinger menyediakan user lain:

```powershell
ssh ubuntu@<WAJIB_DIGANTI: IP_IPV4_VPS>
```

Contoh setelah diganti:

```powershell
ssh ubuntu@203.0.113.10
```

`ubuntu` adalah user awal yang dibuat oleh image Ubuntu Hostinger. Jika panel memberi nama user lain, ganti `ubuntu` dengan nama tersebut.

Verifikasi OS:

```bash
cat /etc/os-release
uname -m
whoami
```

`VERSION="24.04"` wajib muncul. Arsitektur biasanya `x86_64`.

Jangan lanjut jika OS bukan Ubuntu 24.04 atau Anda tidak dapat menjalankan `sudo`.

## 2. Membuat user administrator

### 2.1 Buat user

**Apa itu:** `adduser` membuat akun Linux biasa dan `usermod -aG sudo` memberi hak sudo.

**Tujuan:** mengurangi penggunaan root. Jika satu perintah salah, akun user sehari-hari memberi lapisan keamanan dan jejak operasi yang lebih jelas.

Tetap login sebagai root atau user awal. Buat user `<WAJIB_DIGANTI: SSH_USER>`:

```bash
adduser <WAJIB_DIGANTI: SSH_USER>
usermod -aG sudo <WAJIB_DIGANTI: SSH_USER>
id <WAJIB_DIGANTI: SSH_USER>
```

Contoh actual jika Anda memilih nama user `phillyogo`:

```bash
adduser phillyogo
usermod -aG sudo phillyogo
id phillyogo
```

Nama `phillyogo` di atas berasal dari tabel nilai dan boleh diganti; jangan memakai nama orang lain pada server bersama.

Password user ini harus dibuat Anda sendiri.

Masukkan password Linux yang kuat saat ditanya. Password ini tidak perlu sama dengan root, MySQL, atau JWT.

### 2.2 Pasang SSH key

Jika login awal `root`:

```bash
mkdir -p /home/<WAJIB_DIGANTI: SSH_USER>/.ssh
cp /root/.ssh/authorized_keys /home/<WAJIB_DIGANTI: SSH_USER>/.ssh/authorized_keys
chown -R <WAJIB_DIGANTI: SSH_USER>:<WAJIB_DIGANTI: SSH_USER> /home/<WAJIB_DIGANTI: SSH_USER>/.ssh
chmod 700 /home/<WAJIB_DIGANTI: SSH_USER>/.ssh
chmod 600 /home/<WAJIB_DIGANTI: SSH_USER>/.ssh/authorized_keys
```

Jika login awal `ubuntu`, ganti sumber `/root/.ssh/authorized_keys` menjadi `/home/ubuntu/.ssh/authorized_keys`.

### 2.3 Uji user baru

Jangan menutup terminal lama.

Terminal Windows kedua:

```powershell
ssh <WAJIB_DIGANTI: SSH_USER>@<WAJIB_DIGANTI: IP_IPV4_VPS>
```

Contoh actual:

```powershell
ssh phillyogo@203.0.113.10
```

`phillyogo` berasal dari nama user Linux pada langkah 2, sedangkan `203.0.113.10` berasal dari panel Hostinger dan hanya contoh.

Di VPS:

```bash
sudo whoami
```

Hasil harus `root`.

### GATE: Setelah SSH login berhasil, gunakan laptop untuk seluruh langkah berikutnya

**Mulai dari sini, karyawan tidak perlu selalu membuka terminal browser Hostinger.**

Terminal browser Hostinger adalah terminal cadangan untuk menjaga akses server. Setelah SSH dari laptop berhasil dan `sudo whoami` menghasilkan `root`, tutup terminal lama hanya jika sudah yakin dan lanjutkan semua langkah melalui:

```powershell
ssh <WAJIB_DIGANTI: SSH_USER>@<WAJIB_DIGANTI: IP_IPV4_VPS>
```

Contoh actual:

```powershell
ssh phillyogo@203.0.113.10
```

Gunakan terminal laptop untuk:

- update dan hardening Ubuntu;
- instalasi Docker dan MySQL;
- clone repository;
- edit environment dan secret;
- konfigurasi Nginx serta HTTPS;
- deploy backend;
- migrasi database;
- backup, restore, monitoring, dan rollback.

Tetap simpan terminal browser atau Console Hostinger sebagai cadangan jika SSH laptop putus. Jangan menonaktifkan root SSH atau password SSH sebelum SSH dengan user baru dari laptop sudah diuji.

## 3. Update dan timezone

**Apa itu:** `apt` mengelola package Ubuntu, sedangkan `timedatectl` mengatur jam dan timezone.

**Tujuan:** mendapatkan paket keamanan terbaru dan membuat waktu backup/log konsisten dengan WIB.

**Perintah penting:**

- `apt update` memperbarui daftar package.
- `apt upgrade` memasang versi terbaru.
- `timedatectl set-timezone Asia/Jakarta` membuat jam server WIB.
- `reboot` diperlukan jika kernel atau package inti meminta restart.

```bash
sudo apt update
sudo apt -y upgrade
sudo apt -y install ca-certificates curl gnupg git unzip jq htop
sudo timedatectl set-timezone Asia/Jakarta
sudo timedatectl set-ntp true
sudo hostnamectl set-hostname phillyogo-production
```

Verifikasi:

```bash
timedatectl
hostnamectl
df -h
free -h
```

Reboot jika ada informasi restart:

```bash
sudo reboot
```

Uji kembali SSH setelah reboot.

Aktifkan unattended security update:

```bash
sudo apt -y install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Pilih `Yes`.

## 4. Firewall dan SSH

### 4.1 UFW

**Apa itu:** UFW adalah konfigurasi firewall bawaan Ubuntu.

**Tujuan:** membatasi koneksi publik. Hanya SSH, HTTP, dan HTTPS boleh masuk; MySQL dan backend tidak boleh dipublikasikan langsung.

Penjelasan port:

| Port | Digunakan oleh | Harus dapat diakses internet |
|---|---|---|
| 22 | SSH | Ya, dari perangkat administrator |
| 80 | HTTP/Nginx/Certbot | Ya |
| 443 | HTTPS/WSS/Nginx | Ya |
| 3000 | Backend Node.js | Tidak; hanya boleh dari Nginx lokal |
| 3306 | MySQL | Tidak; jangan dibuka ke internet |

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Pastikan hasil memuat:

```text
22/tcp OPENSSH ALLOW IN
80/tcp ALLOW IN
443/tcp ALLOW IN
3306/tcp tidak muncul
3000/tcp tidak muncul
```

### 4.2 Firewall panel Hostinger

1. Buka Hostinger **VPS**.
2. Buka menu Firewall atau Security.
3. Buat aturan:
   - SSH/TCP/22 dari IP Anda jika IP fix; jika tidak, izinkan 22 untuk sementara.
   - TCP/80 dari semua alamat.
   - TCP/443 dari semua alamat.
4. Hapus aturan publik untuk 3000 dan 3306.
5. Aktifkan firewall.

Jika SSH dari IP berubah, jangan menutup akses 22 sepenuhnya sebelum jaringan stabil.

### 4.3 Backup SSH config

**Apa itu:** `sshd_config` mengatur server SSH.

**Tujuan:** menutup login root/password dan membatasi akun yang boleh login.

`PermitRootLogin no` berarti tidak ada login dengan user root.

`PasswordAuthentication no` berarti password SSH tidak diterima.

`PubkeyAuthentication yes` berarti public/private SSH key diterima.

`AllowUsers` membatasi akun SSH yang dapat masuk.

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup-before-phillyogo
sudo nano /etc/ssh/sshd_config
```

Pastikan baris berikut ada atau ubah nilainya:

```text
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
X11Forwarding no
AllowUsers <WAJIB_DIGANTI: SSH_USER>
MaxAuthTries 3
```

Contoh actual jika SSH user Anda `phillyogo`:

```text
AllowUsers phillyogo
```

Jika login awal menyediakan user `ubuntu`, tambahkan kedua user hanya jika benar-benar diperlukan. Setelah root ditutup, Anda tidak boleh kehilangan SSH key:

```text
AllowUsers <WAJIB_DIGANTI: SSH_USER>
```

Validasi dan restart:

```bash
sudo sshd -t
sudo systemctl restart ssh
sudo systemctl status ssh --no-pager
```

Jangan menutup terminal lama. Uji login baru pada terminal kedua:

```powershell
ssh <WAJIB_DIGANTI: SSH_USER>@<WAJIB_DIGANTI: IP_IPV4_VPS>
```

Baru tutup terminal lama setelah login baru berhasil.

### 4.4 Fail2ban

**Apa itu:** Fail2ban membaca log login dan sementara memblokir IP yang mencoba login berulang salah.

**Tujuan:** mengurangi serangan password/SSH brute-force.

```bash
sudo apt -y install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.d/phillyogo.conf
```

Isi:

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
findtime = 10m
bantime = 1h
```

Aktifkan:

```bash
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

## 5. Docker dan folder aplikasi

### 5.1 Pasang Docker Engine

**Apa itu:** Docker menjalankan MySQL dan backend sebagai container terisolasi.

**Tujuan:** proses aplikasi dapat direstart, diperbarui, dan dihentikan secara konsisten. Docker Compose mengatur container bersama.

Contoh:

```text
docker compose ps
```

`ps` artinya "process/status"; perintah menampilkan container aktif, berhenti, atau unhealthy.

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo apt remove -y "$pkg"
done

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker <WAJIB_DIGANTI: SSH_USER>
```

Keluar dari SSH lalu login kembali:

```bash
exit
```

```powershell
ssh <WAJIB_DIGANTI: SSH_USER>@<WAJIB_DIGANTI: IP_IPV4_VPS>
```

Verifikasi:

```bash
docker version
docker compose version
docker run --rm hello-world
```

### 5.2 Swap

```bash
free -h
test -e /swapfile || sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
swapon --show
```

Swap hanya cadangan. Pertimbangkan upgrade jika swap terus terpakai.

### 5.3 Folder aplikasi

```bash
sudo mkdir -p /opt/phillyogo/app
sudo mkdir -p /opt/phillyogo/backups
sudo mkdir -p /etc/phillyogo
sudo mkdir -p /var/log/phillyogo
sudo chown -R <WAJIB_DIGANTI: SSH_USER>:<WAJIB_DIGANTI: SSH_USER> /opt/phillyogo
sudo chown root:root /etc/phillyogo
sudo chmod 700 /etc/phillyogo
sudo chmod 750 /var/log/phillyogo
```

Untuk bind-mount log, user Node.js menggunakan UID 1000:

```bash
sudo chown -R 1000:1000 /var/log/phillyogo
```

## 6. Clone source repository

Gunakan Deploy Key read-only GitHub.

### 6.1 Buat key

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/phillyogo-deploy -C "phillyogo-production"
cat ~/.ssh/phillyogo-deploy.pub
```

### 6.2 Tambahkan Deploy Key

Di GitHub:

1. Buka repository.
2. Buka **Settings**.
3. Buka **Deploy keys**.
4. Klik **Add deploy key**.
5. Tempel public key.
6. Beri title `PhillyoGo Hostinger Production`.
7. Jangan aktifkan **Allow write access**.

### 6.3 Konfigurasi SSH

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-phillyogo
    HostName github.com
    User git
    IdentityFile ~/.ssh/phillyogo-deploy
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config
ssh -i ~/.ssh/phillyogo-deploy -T git@github.com
```

Pesan berhasil dapat berupa `You've successfully authenticated`.

### 6.4 Clone dan pilih release

```bash
cd /opt/phillyogo/app
git clone git@github-phillyogo:Hudzaiflank/prototype--1.git .
git fetch --prune origin
git switch -c production origin/main
git rev-parse HEAD
git status --short
```

Jika release harus fixed pada commit tertentu:

```bash
git switch --detach <WAJIB_DIGANTI: COMMIT_SHA>
git rev-parse HEAD
```

Pastikan output `git status --short` kosong.

## 7. Menyimpan secret

> **INI WAJIB DIBUAT OLEH ANDA SENDIRI.** Hasil `openssl rand` berikut harus disimpan pada password manager sebelum dipaste ke file.

**Apa itu:** `openssl rand -hex 48` meminta OpenSSL menghasilkan 48 byte acak lalu menampilkannya dalam format heksadesimal.

**Tujuan:** membuat password dan JWT secret yang tidak praktis ditebak.

Satu byte hasil representasi adalah 2 karakter heksadesimal. `-hex 48` menghasilkan 96 karakter. Ini bukan password yang dapat dibaca manusia; karena itu dimasukkan ke password manager, bukan diketik manual.

Generate satu per satu:

```bash
openssl rand -hex 48
openssl rand -hex 48
openssl rand -hex 48
openssl rand -hex 48
openssl rand -hex 24
openssl rand -hex 24
```

Contoh hasil **tidak boleh dipakai** sebagai secret actual:

```text
CONTOH_MYSQL_ROOT_a1b2c3d4e5f6_0123456789abcdef
CONTOH_JWT_ACCESS_fedcba9876543210_NOT_A_REAL_SECRET
```

Contoh itu sengaja memakai teks dummy. Hasil actual Anda akan terdiri dari kombinasi acak. Jangan copy contoh dummy ke `.env`.

Alur pengambilan nilai:

```text
Perintah openssl
  -> Hasil random tampil di terminal
  -> Anda simpan satu hasil ke password manager
  -> Anda beri nama MySQL root password / JWT access secret
  -> Anda paste hasil itu ke tepat satu variabel env
  -> Anda hapus hasil dari catatan chat dan terminal bila memungkinkan
```

Tulis hasilnya dengan label:

- MySQL root password.
- MySQL backend password.
- JWT access secret.
- JWT refresh secret.
- Seed Super Admin password.
- Seed school admin password.

Hasil generate harus diperlakukan sebagai satu nilai utuh:

```text
MySQL root password:
CONTOH_BUKAN_SECRET_ABI9ab2Cd3ef456...

MySQL backend password:
CONTOH_BUKAN_SECRET_JK7mn8Op9qr123...

JWT access secret:
CONTOH_BUKAN_SECRET_Uv4wx5Yz6AB789...

JWT refresh secret:
CONTOH_BUKAN_SECRET_CD1ef2GH3ij456...
```

`CONTOH_BUKAN_SECRET_...` di atas adalah pseudo contoh. Itu tidak boleh menjadi password production. Hasil actual setiap perintah akan berbeda dan Anda simpan seluruh string sebagai satu baris.

Buat environment Compose:

```bash
sudo nano /opt/phillyogo/.env
```

Isi:

```dotenv
MYSQL_ROOT_PASSWORD=<WAJIB_DIGANTI: MYSQL_ROOT_PASSWORD_DARI_PASSWORD_MANAGER>
DB_PASSWORD=<WAJIB_DIGANTI: DB_PASSWORD_DARI_PASSWORD_MANAGER>
```

Contoh actual jika hasil generate MySQL backend adalah `CONTOH_JANGAN_PAKAI_DB9988AbCd`:

```dotenv
MYSQL_ROOT_PASSWORD=CONTOH_JANGAN_PAKAI_ROOT1122AbCd
DB_PASSWORD=CONTOH_JANGAN_PAKAI_DB9988AbCd
```

Nilai actual di atas berasal dari hasil `openssl rand -hex 48`, bukan dari contoh copas.

Kunci permission:

```bash
sudo chown root:root /opt/phillyogo/.env
sudo chmod 600 /opt/phillyogo/.env
sudo stat -c '%a %U:%G %n' /opt/phillyogo/.env
```

Hasil permission harus `600 root root`.

Buat environment backend:

```bash
sudo nano /etc/phillyogo/backend.env
```

Isi:

```dotenv
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

DB_HOST=mysql
DB_PORT=3306
DB_NAME=phillyogo
DB_USER=phillyogo
DB_PASSWORD=<WAJIB_DIGANTI: DB_PASSWORD_YANG_SAMA_DI_ATAS>
DB_SSL=false
DB_CONNECTION_LIMIT=5
DB_SLOW_QUERY_MS=500

JWT_ACCESS_SECRET=<WAJIB_DIGANTI: JWT_ACCESS_SECRET_DARI_PASSWORD_MANAGER>
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_SECRET=<WAJIB_DIGANTI: JWT_REFRESH_SECRET_DARI_PASSWORD_MANAGER>
JWT_REFRESH_EXPIRES_IN=30d

FRONTEND_URL=https://<WAJIB_DIGANTI: DOMAIN_FRONTEND>
FRONTEND_URLS=https://<WAJIB_DIGANTI: DOMAIN_FRONTEND>,https://<WAJIB_DIGANTI: DOMAIN_ROOT>,https://www.<WAJIB_DIGANTI: DOMAIN_ROOT>
REFRESH_COOKIE_NAME=phillyogo_refresh
RETENTION_DAYS=30

SEED_SUPER_ADMIN_EMAIL=<WAJIB_DIGANTI: EMAIL_SUPER_ADMIN_PRODUCTION>
SEED_SUPER_ADMIN_PASSWORD=<WAJIB_DIGANTI: SEED_SUPER_ADMIN_PASSWORD>
SEED_SCHOOL_NAME=<WAJIB_DIGANTI: NAMA_SEKOLAH_PRODUCTION>
SEED_SCHOOL_DOMAIN=<WAJIB_DIGANTI: DOMAIN_SEKOLAH>
SEED_SCHOOL_ADMIN_PASSWORD=<WAJIB_DIGANTI: SEED_SCHOOL_ADMIN_PASSWORD>
```

Contoh actual untuk menghubungkan nilai antara password manager dan file:

```dotenv
DB_PASSWORD=CONTOH_JANGAN_PAKAI_DB9988AbCd
JWT_ACCESS_SECRET=CONTOH_JANGAN_PAKAI_ACCESS7788EfGh
JWT_REFRESH_SECRET=CONTOH_JANGAN_PAKAI_REFRESH6677IjKl
FRONTEND_URL=https://app.piscall.com
FRONTEND_URLS=https://app.piscall.com,https://piscall.com,https://www.piscall.com
SEED_SUPER_ADMIN_PASSWORD=CONTOH_JANGAN_PAKAI_ADMIN4455MnOp
SEED_SCHOOL_ADMIN_PASSWORD=CONTOH_JANGAN_PAKAI_SCHOOL3344QrSt
```

Pemakaian:

| Nilai actual pada contoh | Berasal dari |
|---|---|
| `CONTOH_JANGAN_PAKAI_DB9988AbCd` | Hasil `openssl rand -hex 48` yang diberi nama MySQL backend password |
| `CONTOH_JANGAN_PAKAI_ACCESS7788EfGh` | Hasil generate JWT access yang disimpan password manager |
| `CONTOH_JANGAN_PAKAI_REFRESH6677IjKl` | Hasil generate JWT refresh yang disimpan password manager |
| `app.piscall.com` | Domain Pages/custom domain milik Anda |
| `CONTOH_JANGAN_PAKAI_ADMIN4455MnOp` | Hasil generate seed Super Admin, hanya jika database baru |
| `CONTOH_JANGAN_PAKAI_SCHOOL3344QrSt` | Hasil generate seed school admin, hanya jika database baru |

Nilai `CONTOH_JANGAN_PAKAI_...` tetap dummy. Jika database diimpor dari Aiven, jangan isi atau jalankan seed password tersebut.

Untuk migration Aiven, seed hanya boleh digunakan setelah Anda memastikan database benar-benar kosong. Jika mengimport data Aiven, skip semua nilai seed dan jangan jalankan seed.

Kunci:

```bash
sudo chown root:root /etc/phillyogo/backend.env
sudo chmod 600 /etc/phillyogo/backend.env
sudo stat -c '%a %U:%G %n' /etc/phillyogo/backend.env
```

Gate sebelum lanjut:

- [ ] Tidak ada placeholder.
- [ ] DB password di kedua file identik.
- [ ] JWT secret berbeda satu sama lain.
- [ ] File environment berpermission 600.
- [ ] Secret tidak muncul dalam `git status`.

## 8. Docker Compose

**Apa itu:** Compose adalah cara mendefinisikan dua container: MySQL dan backend.

**Tujuan:** satu file menentukan image, environment, network, volume, port, restart, dan health check.

Komponen penting:

- `services` adalah daftar container.
- `networks` adalah jaringan privat antarcontainer.
- `volumes` menyimpan data MySQL secara permanen, meski container dihapus.
- `ports` hanya dipakai backend pada `127.0.0.1`, bukan `0.0.0.0`.
- `healthcheck` adalah pemeriksaan berkala agar Compose tahu container benar-benar siap.

Buat Compose:

```bash
sudo nano /opt/phillyogo/docker-compose.yml
```

Isi:

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: phillyogo-mysql
    restart: unless-stopped
    command:
      - "--innodb-buffer-pool-size=1536M"
      - "--max-connections=150"
      - "--table-open-cache=400"
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 2300M
        reservations:
          memory: 1536M
    env_file:
      - /opt/phillyogo/.env
    environment:
      MYSQL_DATABASE: phillyogo
      MYSQL_USER: phillyogo
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - phillyogo-network
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "mysqladmin ping -h 127.0.0.1 -uroot -p$${MYSQL_ROOT_PASSWORD} --silent"
        ]
      interval: 10s
      timeout: 5s
      retries: 20
      start_period: 30s

  backend:
    build:
      context: /opt/phillyogo/app/backend
      dockerfile: Dockerfile
    container_name: phillyogo-backend
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1024M
        reservations:
          memory: 256M
    env_file:
      - /etc/phillyogo/backend.env
    depends_on:
      mysql:
        condition: service_healthy
    ports:
      - "127.0.0.1:3000:3000"
    networks:
      - phillyogo-network
    volumes:
      - /var/log/phillyogo:/app/logs
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
        ]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 20s

networks:
  phillyogo-network:
    driver: bridge

volumes:
  mysql-data:
```

Validasi tanpa mencetak secret:

```bash
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env config >/dev/null
echo $?
```

Hasil wajib `0`.

Pastikan Compose tidak memiliki `ports:` pada service `mysql`.

## 9. Dockerfile backend

**Apa itu:** Dockerfile adalah resep untuk membentuk image backend.

**Tujuan:** memastikan setiap build memakai Node.js 22 yang sama dan tidak memuat `.env` rahasia.

Baris penting:

- `FROM node:22-alpine` memilih runtime Node.js.
- `npm ci --omit=dev` memasang dependency production saja.
- `COPY src ./src` membawa source backend.
- `COPY database ./database` membawa migration.
- `USER node` menjalankan aplikasi sebagai user non-root.

Buka file repository:

```bash
nano /opt/phillyogo/app/backend/Dockerfile
```

Isi atau pastikan file sama dengan:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY database ./database

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

Pastikan tidak ada baris `COPY .env`.

## 10. Jalankan MySQL

```bash
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env up -d mysql
docker compose --env-file /opt/phillyogo/.env ps
docker compose --env-file /opt/phillyogo/.env logs --tail=100 mysql
docker inspect --format='{{json .State.Health.Status}}' phillyogo-mysql
```

Hasil health wajib:

```text
"healthy"
```

Jangan lanjut jika MySQL belum healthy.

## 11. Migrasi database Aiven ke VPS

**Apa itu:** dump adalah salinan data MySQL dalam bentuk SQL.

**Tujuan:** memindahkan user, sekolah, kelas, room, peserta, game, dan riwayat ke server VPS.

Urutannya:

```text
Freeze write -> dump Aiven -> hitung checksum -> import VPS -> bandingkan count -> migrate
```

`Freeze write` memastikan tidak ada data baru yang ditulis setelah dump.

`Checksum` adalah sidik jari file; jika file berubah, checksum berubah.

### 11.1 Bekukan aplikasi lama

Sebelum dump final:

1. Aktifkan maintenance/menonaktifkan write pada aplikasi lama.
2. Jangan membuat sekolah, kelas, guru, siswa, room, atau game baru.
3. Catat waktu freeze dalam WIB.
4. Ambil count data dari Aiven.

Contoh count:

```sql
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS schools FROM schools;
SELECT COUNT(*) AS classes FROM classes;
SELECT COUNT(*) AS students FROM students;
SELECT COUNT(*) AS rooms FROM rooms;
SELECT COUNT(*) AS game_sessions FROM game_sessions;
SELECT COUNT(*) AS participants FROM participants;
SELECT COUNT(*) AS problems FROM problems;
SELECT COUNT(*) AS `groups` FROM `groups`;
SELECT COUNT(*) AS group_members FROM group_members;
SELECT COUNT(*) AS game_turns FROM game_turns;
SELECT COUNT(*) AS refresh_tokens FROM refresh_tokens;
```

Simpan hasil dan waktu freeze. Jangan melanjutkan jika aplikasi lama masih menerima write.

### 11.2 Pasang MySQL client

```bash
sudo apt -y install mysql-client
mysql --version
mysqldump --version
```

### 11.3 Test koneksi Aiven

Masukkan password pada prompt, bukan di command:

Contoh format wajib diganti:

```bash
mysql \
  --host=<WAJIB_DIGANTI: AIVEN_HOST> \
  --port=<WAJIB_DIGANTI: AIVEN_PORT> \
  --user=<WAJIB_DIGANTI: AIVEN_USER> \
  --database=<WAJIB_DIGANTI: AIVEN_DATABASE> \
  --ssl-mode=REQUIRED \
  --password \
  --execute="SELECT 1;"
```

Contoh actual ilustratif:

```bash
mysql \
  --host=mysql-aiven-example.aivencloud.com \
  --port=3306 \
  --user=avnadmin-example \
  --database=phillyogo \
  --ssl-mode=REQUIRED \
  --password \
  --execute="SELECT 1;"
```

Nilai host, port, user, dan database di atas adalah contoh tabel. Ambil nilainya dari dashboard Aiven; password diketik pada prompt.

Jika dashboard Aiven menyediakan CA:

```bash
--ssl-ca=/opt/phillyogo/app/backend/aiven-ca.pem
```

Jangan copy password Aiven ke shell history atau file source.

### 11.4 Buat dump final

**Apa itu:** `mysqldump` membuat file SQL berisi struktur dan data.

**Tujuan:** mendapatkan satu snapshot database lama untuk dipindahkan ke VPS.

Contoh hasil nama file:

```text
/opt/phillyogo/backups/aiven-pre-migration.sql
```

Contoh checksum hanya ilustrasi:

```text
CONTOH_CHECKSUM_4f2b6ab98e33_NOT_AN_ACTUAL_SHA256
```

Checksum actual diambil dari output `sha256sum`, lalu disimpan pada password manager/catatan release.

```bash
sudo mkdir -p /opt/phillyogo/backups

mysqldump \
  --host=<WAJIB_DIGANTI: AIVEN_HOST> \
  --port=<WAJIB_DIGANTI: AIVEN_PORT> \
  --user=<WAJIB_DIGANTI: AIVEN_USER> \
  --database=<WAJIB_DIGANTI: AIVEN_DATABASE> \
  --ssl-mode=REQUIRED \
  --password \
  --single-transaction \
  --quick \
  --lock-tables=false \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  > /opt/phillyogo/backups/aiven-pre-migration.sql
```

Contoh actual ilustratif yang memakai nilai tabel:

```bash
mysqldump \
  --host=mysql-aiven-example.aivencloud.com \
  --port=3306 \
  --user=avnadmin-example \
  --database=phillyogo \
  --ssl-mode=REQUIRED \
  --password \
  --single-transaction \
  --quick \
  --lock-tables=false \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  > /opt/phillyogo/backups/aiven-pre-migration.sql
```

Kunci dan hitung checksum:

```bash
sudo chmod 640 /opt/phillyogo/backups/aiven-pre-migration.sql
sudo chown root:root /opt/phillyogo/backups/aiven-pre-migration.sql
sudo test -s /opt/phillyogo/backups/aiven-pre-migration.sql
sudo sha256sum /opt/phillyogo/backups/aiven-pre-migration.sql
sudo grep -m 3 "CREATE TABLE" /opt/phillyogo/backups/aiven-pre-migration.sql
```

Catat checksum dan jangan ubah file dump.

### 11.5 Import ke MySQL VPS

```bash
set -a
source /opt/phillyogo/.env
set +a

docker compose --env-file /opt/phillyogo/.env exec -T mysql \
  mysql \
  -uroot \
  -p"${MYSQL_ROOT_PASSWORD}" \
  phillyogo \
  < /opt/phillyogo/backups/aiven-pre-migration.sql
```

Import dianggap sukses jika tidak ada error SQL.

### 11.6 Verifikasi schema dan count

```bash
docker compose --env-file /opt/phillyogo/.env exec mysql \
  mysql -uroot -p
```

Masukkan MySQL root password saat prompt.

```sql
USE phillyogo;
SHOW TABLES;
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS schools FROM schools;
SELECT COUNT(*) AS classes FROM classes;
SELECT COUNT(*) AS students FROM students;
SELECT COUNT(*) AS rooms FROM rooms;
SELECT COUNT(*) AS game_sessions FROM game_sessions;
SELECT COUNT(*) AS participants FROM participants;
SELECT COUNT(*) AS problems FROM problems;
SELECT COUNT(*) AS `groups` FROM `groups`;
SELECT COUNT(*) AS group_members FROM group_members;
SELECT COUNT(*) AS game_turns FROM game_turns;
EXIT;
```

Bandingkan dengan count Aiven. Jangan lanjut jika count berbeda tanpa analisis.

### 11.7 Buat user backend

Masuk MySQL:

```bash
docker compose --env-file /opt/phillyogo/.env exec mysql mysql -uroot -p
```

> **INI WAJIB DIGANTI OLEH ANDA SENDIRI.** Ganti password SQL dengan nilai `DB_PASSWORD` yang sudah Anda buat.

```sql
CREATE USER IF NOT EXISTS 'phillyogo'@'%' IDENTIFIED BY '<WAJIB_DIGANTI: DB_PASSWORD_DARI_PASSWORD_MANAGER>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, EXECUTE
ON phillyogo.* TO 'phillyogo'@'%';
FLUSH PRIVILEGES;
SELECT User, Host FROM mysql.user;
EXIT;
```

Contoh actual:

```sql
CREATE USER IF NOT EXISTS 'phillyogo'@'%' IDENTIFIED BY 'CONTOH_JANGAN_PAKAI_DB9988AbCd';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, EXECUTE
ON phillyogo.* TO 'phillyogo'@'%';
FLUSH PRIVILEGES;
EXIT;
```

Password di atas dummy. Gunakan nilai `DB_PASSWORD` yang sama persis dengan password manager dan kedua file `.env`.

Uji koneksi internal:

```bash
docker compose --env-file /opt/phillyogo/.env exec mysql mysql -uphillyogo -p phillyogo
```

Masukkan DB password saat prompt.

## 12. Migration repository

Build image:

```bash
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env build backend
```

Jalankan migration secara terpisah:

```bash
docker compose --env-file /opt/phillyogo/.env run --rm backend npm run db:migrate
```

Hentikan jika migration gagal.

Verifikasi migration:

```bash
docker compose --env-file /opt/phillyogo/.env exec mysql mysql -uroot -p
```

```sql
USE phillyogo;
SELECT * FROM schema_migrations ORDER BY filename;
SHOW TABLES;
EXIT;
```

Untuk migration Aiven, tidak menjalankan `npm run db:seed`.

Seed hanya untuk database kosong/baru:

```bash
docker compose --env-file /opt/phillyogo/.env run --rm backend npm run db:seed
```

## 13. Jalankan backend

```bash
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env up -d backend
docker compose --env-file /opt/phillyogo/.env ps
docker compose --env-file /opt/phillyogo/.env logs --tail=200 backend
docker inspect --format='{{json .State.Health.Status}}' phillyogo-backend
```

Health wajib `healthy`.

Uji lokal:

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/health/live
curl -i http://127.0.0.1:3000/health/ready
```

Ketiganya harus HTTP 200. `/health/ready` memeriksa MySQL.

## 14. Pasang Nginx

**Apa itu:** Nginx menerima HTTPS dari internet dan meneruskan request ke backend Node.js.

**Tujuan:** menyembunyikan backend port 3000 dan mengelola domain, TLS, Header, body upload, serta WebSocket Upgrade.

`proxy_pass http://127.0.0.1:3000` artinya Nginx memanggil backend yang hanya ada di VPS.

`Upgrade` dan `Connection "upgrade"` diperlukan agar Socket.IO dapat membuka WebSocket.

```bash
sudo apt -y install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
curl -I http://127.0.0.1
sudo nano /etc/nginx/sites-available/phillyogo
```

Isi:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name <WAJIB_DIGANTI: DOMAIN_BACKEND>;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

Contoh actual:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.piscall.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

`api.piscall.com` adalah contoh domain backend. Ganti dengan domain actual Anda.

Aktifkan:

```bash
sudo ln -sf /etc/nginx/sites-available/phillyogo /etc/nginx/sites-enabled/phillyogo
sudo nginx -t
sudo systemctl reload nginx
```

Jangan hapus konfigurasi default kecuali sudah diverifikasi tidak diperlukan.

## 15. DNS dan HTTPS backend

### 15.1 Buat DNS A record

Di Cloudflare:

1. Buka zona domain.
2. Klik **DNS**.
3. Klik **Add record**.
4. Type: `A`.
5. Name: `api` atau subdomain yang dipilih.
6. IPv4 address: `<WAJIB_DIGANTI: IP_IPV4_VPS>`.
7. Proxy status: **DNS only**/abu-abu untuk proses Certbot.
8. TTL: Auto.

### 15.2 Verifikasi DNS

Di Windows:

```powershell
Resolve-DnsName <WAJIB_DIGANTI: DOMAIN_BACKEND>
```

Contoh actual:

```powershell
Resolve-DnsName api.piscall.com
```

Hasil IP harus sama dengan IP VPS.

Di VPS:

```bash
getent hosts <WAJIB_DIGANTI: DOMAIN_BACKEND>
```

Contoh actual:

```bash
getent hosts api.piscall.com
```

Jangan lanjut jika DNS belum menuju VPS.

### 15.3 Pasang Certbot

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d <WAJIB_DIGANTI: DOMAIN_BACKEND>
```

Contoh actual:

```bash
sudo certbot --nginx -d api.piscall.com
```

Pilih:

- Email: `<WAJIB_DIGANTI: EMAIL_ADMIN>`.
- Setujui Terms of Service.
- Pilih redirect HTTP ke HTTPS.

Verifikasi:

```bash
sudo nginx -t
sudo certbot certificates
sudo certbot renew --dry-run
curl -I http://<WAJIB_DIGANTI: DOMAIN_BACKEND>
curl -I https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/health
```

### 15.4 Aktifkan Cloudflare proxy backend

Setelah DNS/HTTPS berhasil:

1. Kembali ke Cloudflare DNS.
2. Aktifkan proxy/oranye pada record backend.
3. Buka **SSL/TLS**.
4. Pilih mode **Full (Strict)**.
5. Aktifkan Always Use HTTPS.
6. Minimum TLS: 1.2.

Jangan menggunakan SSL mode Flexible.

## 16. Sinkronkan CORS backend

Buka environment:

```bash
sudo nano /etc/phillyogo/backend.env
```

Pastikan URL frontend aktual:

```dotenv
FRONTEND_URL=https://<WAJIB_DIGANTI: DOMAIN_FRONTEND>
FRONTEND_URLS=https://<WAJIB_DIGANTI: DOMAIN_FRONTEND>,https://<WAJIB_DIGANTI: DOMAIN_ROOT>,https://www.<WAJIB_DIGANTI: DOMAIN_ROOT>
```

Restart backend:

```bash
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env up -d backend
docker compose --env-file /opt/phillyogo/.env logs --tail=200 backend
```

## 17. Konfigurasi Cloudflare Pages

Untuk custom domain:

1. Buka Cloudflare **Workers & Pages**.
2. Pilih project frontend.
3. Buka **Custom domains**.
4. Tambahkan `<WAJIB_DIGANTI: DOMAIN_FRONTEND>`.
5. Ikuti instruksi DNS yang ditampilkan.
6. Tunggu status certificate Active.

Untuk environment variable Production:

1. Buka project Pages.
2. Buka **Settings** -> **Environment variables**.
3. Pilih Production.
4. Tambahkan:

```text
VITE_API_URL=https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/api/v1
VITE_SOCKET_URL=https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/game
```

Contoh actual:

```text
VITE_API_URL=https://api.piscall.com/api/v1
VITE_SOCKET_URL=https://api.piscall.com/game
```

Ambil domain backend dari data actual DNS/Cloudflare, bukan dari contoh.

> **INI WAJIB DIGANTI OLEH ANDA SENDIRI.** Gunakan domain backend aktual, bukan placeholder atau trycloudflare URL lama.

5. Simpan.
6. Buka **Deployments**.
7. Buat deployment baru atau **Retry deployment** pada build terbaru.
8. Tunggu status Successful.

Jangan menaruh JWT secret atau DB password pada Pages environment.

## 18. Pengujian go-live

### 18.1 API

```bash
curl -I https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/health
curl -i https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/health/ready
curl -I https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/api/v1
```

Contoh actual:

```bash
curl -I https://api.piscall.com/health
curl -i https://api.piscall.com/health/ready
curl -I https://api.piscall.com/api/v1
```

### 18.2 Port publik

```bash
sudo ss -ltnp
sudo ufw status
```

Tidak boleh ada listening publik pada 3306 atau 3000. Hanya 22, 80, dan 443 yang terbuka untuk layanan publik.

### 18.3 Database

```bash
docker compose --env-file /opt/phillyogo/.env exec mysql mysql -uroot -p
```

```sql
USE phillyogo;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM schools;
SELECT COUNT(*) FROM game_sessions;
EXIT;
```

### 18.4 Socket.IO

Uji paling sedikit:

- [ ] `/game` dapat connect.
- [ ] `/monitor` hanya dapat connect sebagai Super Admin.
- [ ] State snapshot diterima.
- [ ] Participant reconnect dipulihkan.
- [ ] Guru dapat start/pause/resume/finish.
- [ ] Tidak ada CORS error.
- [ ] Tidak ada 403 WebSocket pada Cloudflare.

### 18.5 Frontend

- [ ] Custom domain frontend terbuka.
- [ ] Tidak ada mixed content.
- [ ] Login Super Admin berhasil.
- [ ] Login Admin berhasil.
- [ ] Login Guru berhasil.
- [ ] Join room siswa berhasil.
- [ ] Refresh token berhasil.
- [ ] Logout berhasil.
- [ ] Start dan finish game berhasil.

## 19. Backup database

**Apa itu:** `mysqldump` membuat salinan logis data MySQL ke file `.sql`.

**Tujuan:** pemulihan bila aplikasi, migration, atau server bermasalah.

Backup tidak berguna jika belum pernah diuji restore. Karena itu bagian restore dilakukan sebelum cutover.

### 19.1 Backup pertama

```bash
set -a
source /opt/phillyogo/.env
set +a

BACKUP_FILE="/opt/phillyogo/backups/phillyogo-$(date +%F-%H%M%S).sql"

docker compose --env-file /opt/phillyogo/.env exec -T mysql \
  mysqldump \
  -uroot \
  -p"${MYSQL_ROOT_PASSWORD}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  phillyogo \
  > "${BACKUP_FILE}"

chmod 640 "${BACKUP_FILE}"
sha256sum "${BACKUP_FILE}"
ls -lh "${BACKUP_FILE}"
```

### 19.2 Script backup harian

```bash
sudo nano /opt/phillyogo/backup-mysql.sh
```

Isi:

```bash
#!/bin/bash
set -euo pipefail

set -a
source /opt/phillyogo/.env
set +a

BACKUP_DIR="/opt/phillyogo/backups"
TIMESTAMP="$(date +%F-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/phillyogo-${TIMESTAMP}.sql"

docker compose --env-file /opt/phillyogo/.env exec -T mysql \
  mysqldump \
  -uroot \
  -p"${MYSQL_ROOT_PASSWORD}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  phillyogo \
  > "${BACKUP_FILE}"

chmod 640 "${BACKUP_FILE}"
test -s "${BACKUP_FILE}"
find "${BACKUP_DIR}" -type f -name "phillyogo-*.sql" -mtime +30 -delete
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
```

Aktifkan:

```bash
sudo chown root:root /opt/phillyogo/backup-mysql.sh
sudo chmod 750 /opt/phillyogo/backup-mysql.sh
sudo /opt/phillyogo/backup-mysql.sh
ls -lh /opt/phillyogo/backups
```

### 19.3 Jadwalkan backup

**Apa itu:** cron adalah penjadwal tugas Linux.

**Tujuan:** menjalankan backup harian tanpa operator membuka terminal.

`30 2 * * *` artinya setiap hari pukul 02.30.

`CRON_TZ=Asia/Jakarta` memastikan waktu dihitung dalam WIB, bukan timezone server default.

Contoh file log:

```text
/var/log/phillyogo/backup.log
```

Contoh nama backup actual untuk dokumentasi:

```text
phillyogo-2026-11-23-0230.sql
phillyogo-2026-11-23-0230.sql.sha256
```

Nama actual Anda akan memakai tanggal saat backup dijalankan.

```bash
sudo crontab -e
```

Tambahkan, jalankan tiap 02.30 WIB:

```cron
CRON_TZ=Asia/Jakarta
30 2 * * * /opt/phillyogo/backup-mysql.sh >> /var/log/phillyogo/backup.log 2>&1
```

Verifikasi:

```bash
sudo crontab -l
sudo systemctl status cron --no-pager
sudo tail -n 100 /var/log/phillyogo/backup.log
```

### 19.4 Unduh backup ke komputer terpisah

Menggunakan SCP dari Windows PowerShell:

**Apa itu:** `scp` menyalin file dari VPS ke komputer Windows melalui SSH.

**Tujuan:** memastikan backup tidak hilang jika VPS rusak atau akun VPS bermasalah.

```powershell
scp <WAJIB_DIGANTI: SSH_USER>@<WAJIB_DIGANTI: IP_IPV4_VPS>:/opt/phillyogo/backups/phillyogo-<WAJIB_DIGANTI: TIMESTAMP_BACKUP>.sql C:\Backup\PhillyoGo\
```

Contoh actual hanya ilustrasi:

```powershell
scp budi@203.0.113.10:/opt/phillyogo/backups/phillyogo-2026-11-23-0230.sql C:\Backup\PhillyoGo\
```

Nilai `budi` berasal dari `<WAJIB_DIGANTI: SSH_USER>`, IP berasal dari panel Hostinger, dan timestamp berasal dari nama file yang ada pada `/opt/phillyogo/backups`.

Di Windows buat folder `C:\Backup\PhillyoGo` terlebih dahulu.

Minimum aman:

- [ ] Backup harian tetap di VPS.
- [ ] Backup terbaru diunduh ke komputer berbeda dari VPS.
- [ ] File checksum didownload atau dicatat.
- [ ] Backup tidak dibuka dari email atau chat.
- [ ] Password backup, jika dienkripsi, disimpan password manager.

## 20. Uji restore

### 20.1 Buat database staging

```bash
docker compose --env-file /opt/phillyogo/.env exec mysql mysql -uroot -p
```

```sql
CREATE DATABASE phillyogo_restore
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 20.2 Import backup

```bash
docker compose --env-file /opt/phillyogo/.env exec -T mysql \
  mysql \
  -uroot \
  -p"${MYSQL_ROOT_PASSWORD}" \
  phillyogo_restore \
  < /opt/phillyogo/backups/phillyogo-<WAJIB_DIGANTI: TIMESTAMP_BACKUP>.sql
```

Contoh actual jika nama file hasil backup adalah `phillyogo-2026-11-23-0230.sql`:

```bash
docker compose --env-file /opt/phillyogo/.env exec -T mysql \
  mysql \
  -uroot \
  -p"${MYSQL_ROOT_PASSWORD}" \
  phillyogo_restore \
  < /opt/phillyogo/backups/phillyogo-2026-11-23-0230.sql
```

Nama tanggal di atas adalah contoh. Gunakan nama file actual dari `ls /opt/phillyogo/backups`.

### 20.3 Verifikasi

```sql
USE phillyogo_restore;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM schools;
SELECT COUNT(*) FROM game_sessions;
EXIT;
```

Bandingkan count dengan produksi. Setelah berhasil:

```sql
DROP DATABASE phillyogo_restore;
EXIT;
```

Jangan memakai database restore sebagai database production.

## 21. Monitoring VPS

### 21.1 Monitoring Hostinger

Di panel Hostinger:

1. Buka VPS.
2. Buka **Overview/Monitoring**.
3. Aktifkan/konfirmasi data CPU, RAM, disk, network, dan uptime.
4. Aktifkan email notification untuk VPS.
5. Atur recovery email dan 2FA.
6. Buat snapshot bulanan/manual sebelum update besar.

Aturan peringatan:

| Metrik | Peringatan | Tindakan |
|---|---:|---|
| Disk | >=80% | Hentikan backup/log baru, bersihkan log lama |
| RAM | >=85% | Periksa `docker stats` |
| CPU | >=85% selama 10 menit | Periksa Nginx/backend/MySQL |
| MySQL | restart | Ambil log dan memory |
| Container | unhealthy | Restart atau rollback |
| Backup | gagal 1 hari | Jalankan backup manual |
| TLS | <=14 hari lagi | Jalankan cert renew |

### 21.2 Uptime external

Gunakan UptimeRobot atau layanan gratis serupa.

UptimeRobot:

1. Buat account.
2. Aktifkan 2FA.
3. Klik **Add New Monitor**.
4. Monitor Type: `HTTPS`.
5. Friendly Name: `PhillyoGo Frontend`.
6. URL: `https://<WAJIB_DIGANTI: DOMAIN_FRONTEND>`.
7. Interval: 5 menit.
8. Klik Save.
9. Tambah monitor kedua:
   - Friendly Name: `PhillyoGo Backend Health`.
   - URL: `https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/health`.
10. Tambah monitor third:
   - Friendly Name: `PhillyoGo Database Ready`.
   - URL: `https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/health/ready`.
11. Aktifkan email alert.

Contoh actual ilustratif:

```text
Frontend URL  = https://app.piscall.com
Backend health = https://api.piscall.com/health
Ready check    = https://api.piscall.com/health/ready
```

Ganti ketiganya dengan domain actual Anda. Nilai ini berasal dari domain frontend/backend pada tabel isian.

Uptime eksternal tetap akan memberi sinyal jika VPS mati, sedangkan monitoring di dalam VPS tidak dapat memberi alert saat VPS mati.

### 21.3 Periksa resource manual

**Apa itu:** command berikut menampilkan pemakaian disk, RAM, container, dan firewall.

**Tujuan:** mendeteksi VPS penuh, container mati, atau koneksi yang tidak sesuai sebelum pengguna melapor.

Jalankan setiap pagi:

```bash
df -h
df -i
free -h
sudo systemctl status nginx --no-pager
docker stats --no-stream
docker compose --env-file /opt/phillyogo/.env ps
sudo ufw status
```

Bacaan penting:

- `df -h`: penggunaan disk dalam satuan mudah dibaca.
- `df -i`: penggunaan inode; disk dapat terlihat kosong tetapi inode habis.
- `free -h`: RAM dan swap.
- `docker stats --no-stream`: CPU dan memory setiap container.
- `docker compose ps`: status setiap container.
- `sudo ufw status`: daftar port firewall yang mengizinkan masuk.

Target awal:

- Disk <80%.
- RAM <85%.
- Swap tidak terus terpakai.
- Kedua container `Up`.
- Backend dan MySQL `healthy`.

### 21.4 Docker logs

```bash
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env logs --tail=200 backend
docker compose --env-file /opt/phillyogo/.env logs --tail=200 mysql
sudo tail -n 100 /var/log/nginx/error.log
sudo tail -n 100 /var/log/nginx/access.log
sudo journalctl -u docker --since "24 hours ago" --no-pager
```

Konfigurasi Docker log rotation:

```bash
sudo nano /etc/docker/daemon.json
```

Isi:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
```

Validasi dan restart:

```bash
sudo python3 -m json.tool /etc/docker/daemon.json
sudo systemctl restart docker
docker info --format '{{.LoggingDriver}}'
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env up -d
```

### 21.5 MySQL slow query

Aktivasi slow query via Compose:

```yaml
command:
  - "--slow-query-log=1"
  - "--long-query-time=1"
  - "--log-queries-not-using-indexes"
```

Setelah Compose diperbarui:

```bash
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env up -d mysql
docker compose --env-file /opt/phillyogo/.env logs --tail=200 mysql
```

Periksa slow query dari MySQL:

```sql
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
SHOW GLOBAL STATUS LIKE 'Slow_queries';
```

## 22. Cutover dari Aiven dan Back4App

**Apa itu:** cutover adalah saat frontend production benar-benar mulai memakai backend VPS.

**Tujuan:** memindahkan traffic tanpa menghentikan provider lama sampai semua verifikasi selesai.

Urutan aman:

```text
Freeze lama -> backup final -> update frontend -> ujicoba -> monitoring -> stabilisasi -> tutup provider lama
```

### 22.1 Go/no-go

Jangan cutover jika:

- [ ] Count database tidak sama.
- [ ] Migration belum selesai.
- [ ] Health belum sehat.
- [ ] Socket.IO belum berhasil.
- [ ] Frontend belum berhasil login.
- [ ] Backup dan restore belum diuji.
- [ ] Rollback URL lama masih bekerja.
- [ ] DNS, TLS, dan monitoring aktif.

### 22.2 Freeze final

1. Aktifkan maintenance mode aplikasi lama.
2. Hentikan semua write Aiven.
3. Ambil backup final Aiven.
4. Import ulang hanya jika data berubah sejak dump terakhir.
5. Ambil count final Aiven dan VPS.
6. Ambil backup final VPS.

### 22.3 Deploy cutover

1. Deploy frontend Production ke URL baru.
2. Verifikasi `VITE_API_URL`.
3. Verifikasi `VITE_SOCKET_URL`.
4. Uji login.
5. Uji refresh.
6. Uji join room.
7. Uji start/pause/resume/finish.
8. Pantau backend/MySQL/Nginx.

### 22.4 Stabilisasi

Pantau selama minimum:

- 24 jam.
- 7 hari.

Jangan mematikan provider lama selama periode stabilisasi.

### 22.5 Tutup Aiven

Setelah stabil:

- [ ] Buat backup terakhir dan checksum.
- [ ] Unduh backup ke komputer terpisah.
- [ ] Simpan kredensial lama pada password manager selama masa retensi.
- [ ] Putar credential lama.
- [ ] Hentikan layanan/billing Aiven.

### 22.6 Tutup Back4App

Setelah stabil:

- [ ] Ekspor environment dan konfigurasi lama.
- [ ] Simpan backup konfigurasi.
- [ ] Putar semua secret Back4App.
- [ ] Hentikan deployment.
- [ ] Hentikan billing.

## 23. Deployment update

Pembaruan frontend dilakukan melalui commit/deployment Cloudflare Pages.

Pembaruan backend:

```bash
cd /opt/phillyogo/app
git fetch --prune origin
git switch production
git pull --ff-only origin production
git status --short
git rev-parse HEAD
```

Backup terlebih dahulu:

```bash
sudo /opt/phillyogo/backup-mysql.sh
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env build backend
docker compose --env-file /opt/phillyogo/.env run --rm backend npm run db:migrate
docker compose --env-file /opt/phillyogo/.env up -d --no-deps backend
docker compose --env-file /opt/phillyogo/.env ps
docker compose --env-file /opt/phillyogo/.env logs --tail=200 backend
curl -i https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/health/ready
```

Gunakan branch production yang benar. Jangan melakukan update saat ada sesi kelas aktif.

## 24. Rollback

**Apa itu:** rollback mengembalikan konfigurasi atau database lama.

**Tujuan:** membatasi durasi gangguan apabila release atau migration baru gagal.

Rollback hanya dilakukan setelah Anda tahu tiga hal:

1. Commit source lama yang sehat.
2. Backup database yang dibuat sebelum perubahan.
3. Cara mengembalikan backend/frontend/DNS lama.

### 24.1 Rollback source

Catat commit sekarang:

```bash
cd /opt/phillyogo/app
git rev-parse HEAD
git log -n 5 --oneline
```

Pindah ke commit lama yang pernah sehat:

```bash
git switch --detach <WAJIB_DIGANTI: COMMIT_SHA_RELEASE_SEBELUMNYA>
cd /opt/phillyogo
docker compose --env-file /opt/phillyogo/.env build backend
docker compose --env-file /opt/phillyogo/.env up -d backend
curl -i https://<WAJIB_DIGANTI: DOMAIN_BACKEND>/health/ready
```

Contoh actual ilustratif:

```bash
git switch --detach 9f8e7d6c5b4a
curl -i https://api.piscall.com/health/ready
```

`9f8e7d6c5b4a` dan `api.piscall.com` adalah contoh. Ambil commit dan domain yang benar dari release terakhir.

Jangan menjalankan migration rollback kecuali migration lama benar-benar memiliki script dan telah diuji.

### 24.2 Rollback database

Gunakan restore staging terlebih dahulu:

```sql
CREATE DATABASE phillyogo_rollback
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Import backup lama:

```bash
docker compose --env-file /opt/phillyogo/.env exec -T mysql \
  mysql \
  -uroot \
  -p"${MYSQL_ROOT_PASSWORD}" \
  phillyogo_rollback \
  < /opt/phillyogo/backups/<WAJIB_DIGANTI: BACKUP_FILENAME>
```

Contoh actual:

```bash
docker compose --env-file /opt/phillyogo/.env exec -T mysql \
  mysql \
  -uroot \
  -p"${MYSQL_ROOT_PASSWORD}" \
  phillyogo_rollback \
  < /opt/phillyogo/backups/phillyogo-2026-11-23-0230.sql
```

Ganti nama file dengan backup yang benar dari `ls /opt/phillyogo/backups`.

Hanya tukar database produksi setelah verifikasi selesai.

## 25. Operasional harian

Harian:

- [ ] Periksa uptime frontend.
- [ ] Periksa uptime backend.
- [ ] Periksa health ready.
- [ ] Periksa container status.
- [ ] Periksa backup terakhir.
- [ ] Periksa disk dan RAM.
- [ ] Periksa HTTP 5xx.

Mingguan:

- [ ] Periksa Docker log.
- [ ] Periksa slow query.
- [ ] Periksa failed SSH login.
- [ ] Periksa Fail2ban.
- [ ] Periksa free disk.
- [ ] Periksa snapshot Hostinger.
- [ ] Periksa backup luar VPS.
- [ ] Jalankan update OS.

Bulanan:

- [ ] Uji satu restore.
- [ ] Periksa certificate expiry.
- [ ] Periksa domain expiry.
- [ ] Periksa billing dan renewal.
- [ ] Periksa SSH key dan 2FA.
- [ ] Periksa dependency package.
- [ ] Periksa password/JWT rotation.
- [ ] Periksa alert monitoring.

## 26. Checklist selesai

- [ ] Ubuntu 24.04 aktif.
- [ ] SSH key bekerja dan password SSH tidak digunakan.
- [ ] Root SSH login tidak aktif.
- [ ] UFW dan firewall Hostinger aktif.
- [ ] Docker dan Compose aktif.
- [ ] MySQL aktif dan tidak dipublikasikan.
- [ ] Backend aktif.
- [ ] Nginx aktif.
- [ ] HTTPS dan redirect aktif.
- [ ] Cloudflare Pages frontend aktif.
- [ ] API dan Socket.IO production aktif.
- [ ] Count Aiven sesuai VPS.
- [ ] Migration schema selesai.
- [ ] Seed tidak dijalankan pada database migration Aiven.
- [ ] Backup harian aktif.
- [ ] Backup manual terbaru sudah keluar dari VPS.
- [ ] Restore pernah diuji.
- [ ] Uptime monitor aktif.
- [ ] Hostinger resource monitoring aktif.
- [ ] Log dan slow query dapat diperiksa.
- [ ] Aiven dan Back4App masih dapat digunakan sebagai fallback selama stabilisasi.
- [ ] Rollback plan ditinjau.

**Stop point:** Jika item checklist go-live belum lengkap atau domain/secret/backup belum terisi, jangan menutup Aiven atau Back4App.
