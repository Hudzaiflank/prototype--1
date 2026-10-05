# Dokumen Panduan Perencanaan Pengembangan MVP

### Kelompok 02 – Tim PhillyoGo

## 1. Tahapan Rencana Pengembangan MVP

1. Meninjau hasil product validation: mengulang kembali insight utama, kebutuhan pengguna, serta keputusan persevere/refine/pivot yang menjadi dasar perencanaan MVP.
2. Menerjemahkan insight menjadi keputusan fitur: memprioritaskan fitur inti yang benar-benar dibutuhkan di awal, serta menunda fitur yang tidak vital untuk iterasi berikutnya.
3. Memperbarui solusi dan UVP versi MVP: menyusun ulang narasi produk agar mencerminkan produk yang benar-benar dapat dibangun dan digunakan oleh guru dan siswa.
4. Menyusun spesifikasi fungsional MVP: menjelaskan alur utama penggunaan dan fitur yang dapat dijalankan dalam satu siklus permainan.
5. Menentukan platform dan tools pengembangan: memilih teknologi yang sesuai dengan kapasitas tim, kebutuhan produk, dan kondisi proyek yang sudah ada.
6. Menyusun rencana kerja dan timeline: menetapkan milestone utama, target penyelesaian, dan penanggung jawab tiap kegiatan.
7. Membagi peran dalam tim pengembangan: membagi tugas pengembangan, pengujian, dan dokumentasi agar proses berjalan efektif.
8. Menentukan kriteria selesai dan rencana uji internal: menetapkan indikator MVP siap diuji oleh pengguna nyata dan cara validasinya.
9. Mengembangkan MVP: membangun solusi sesuai scope, proses, dan timeline yang sudah ditetapkan.
10. Menyiapkan transisi ke Business Model Validation: memastikan MVP siap digunakan untuk menguji unfair advantage, channel, key metrics, revenue streams, dan cost structure di tahap berikutnya.

## 2. Rencana Pengembangan MVP

| Komponen | Isi / Jawaban |
|---|---|
| Nama Produk/Inovasi | PhillyoGo |
| Nama Kelompok & Anggota | Kelompok 02 – Tim Pengembangan PhillyoGo. Anggota tim dikelompokkan berdasarkan peran: product owner/project lead, frontend engineer, backend engineer, QA/testing, dan dokumentasi/ops. |
| Ringkasan Hasil Product Validation | Produk fokus pada kebutuhan guru dan siswa dalam kegiatan diskusi kelas yang aman, terarah, dan menyenangkan. Siswa membutuhkan ruang yang tidak menakutkan untuk menyampaikan masalah, sementara guru membutuhkan kontrol penuh atas jalannya permainan, pengelompokan, topik, dan monitoring peserta. Keputusan yang diambil adalah persevere dengan penguatan pada fitur inti yang mendukung proses pembelajaran sosial-emosional berbasis diskusi kelas. |
| Solusi & UVP Hasil Product Validation | Solusi: PhillyoGo adalah platform permainan edukatif digital yang membantu siswa berbagi dan mendiskusikan permasalahan secara aman, terarah, dan menyenangkan dalam lingkungan kelas yang didampingi guru. UVP: PhillyoGo membuat kegiatan berbagi di kelas lebih interaktif, aman, dan mudah dikendalikan guru, sehingga siswa lebih berani berbicara dan guru lebih mudah memfasilitasi diskusi. |
| Daftar Fitur Kandidat | Manajemen sekolah, kelas, guru, dan topik; pembuatan room dan sesi game; login role-based; join room via code; submit permasalahan siswa; monitoring peserta; mode permainan individu dan kelompok; game flow dengan turn dan grouping; pause/resume; riwayat permainan; reconnect session; analitik dan dashboard. |
| Keputusan Prioritisasi Fitur (Core Feature) | Fokus pada fitur yang paling memengaruhi pengalaman utama: room creation, student join, topic display, problem submission, turn management, grouping logic, pause/resume, monitoring teacher dashboard, dan history. Fitur yang lebih kompleks seperti analitik lanjutan, modul ekspor laporan detail, dan optimasi administratif ditunda ke iterasi berikutnya. |
| Solusi & UVP Versi MVP (Real) | PhillyoGo MVP akan menyediakan flow inti classroom game di mana guru membuat room dan sesi permainan, siswa masuk dengan kode unik, menuliskan masalah yang ingin dibagikan, dan mengikuti permainan sesuai topik, kelompok, dan giliran yang dipimpin oleh guru. UVP MVP: PhillyoGo menjadi ruang diskusi kelas yang aman, terstruktur, dan memudahkan guru memandu proses berbagi serta memantau partisipasi siswa secara real time. |
| Spesifikasi Fungsional MVP | Guru dapat membuat kelas, room, dan game session; siswa dapat bergabung melalui kode room; siswa mengisi nama dan masalah; guru mengontrol topik, mode permainan, kelompok, dan giliran; guru dapat pause/resume dan melihat status peserta; permainan dapat dilanjutkan saat siswa reconnect; hasil dan riwayat dapat ditampilkan setelah sesi selesai. |
| Platform & Tools Pengembangan | Frontend: React + Vite + Tailwind CSS; Backend: Node.js + Express.js; Database: MySQL; Realtime communication: Socket.IO; Autentikasi: JWT + refresh token; Validasi: Zod; Keamanan: bcryptjs; testing: Jest; dokumentasi dan pengujian API: Postman; kontrol versi: Git/GitHub. |
| Rencana Kerja & Timeline Pengembangan | Milestone utama mencakup scope MVP, backend dan frontend integration, realtime flow, pengujian internal, dan release candidate. |
| Pembagian Peran Tim Pengembangan | Project Lead: scope, keputusan prioritas, koordinasi; Backend Engineer: API, auth, roles, game logic, DB; Frontend Engineer: student and teacher interface; QA Tester: validation, bug tracking, regression check; Documentation/Ops: README, test checklist, deployment notes. |
| Kriteria Selesai (Definition of Done) | Fitur inti MVP berjalan sesuai alur utama, tidak ada error kritis, user flow guru dan siswa dapat dijalankan dengan lancar, data tersimpan benar, realtime berjalan, dan hasil pengujian internal masuk kategori layak untuk lanjutan validasi pengguna. |
| Rencana Uji Internal | Uji role-based access, uji flow join room, uji submit masalah, uji grouping and turn, uji pause/resume, uji reconnect, uji history, dan uji socket realtime. Semua hasil dicek pada log berjalan dan test suite yang tersedia. |
| Kesiapan Transisi ke Business Model Validation | MVP sudah siap diuji langsung ke pengguna nyata untuk memvalidasi unfair advantage, channel, key metrics, revenue streams, dan cost structure melalui penggunaan nyata oleh guru dan siswa di lingkungan kelas. |

## 3. Tabel Prioritas Fitur Inti (Core Feature Prioritization)

| No. | Fitur | Insight/Feedback yang Mendasari | Keputusan | Alasan |
|---|---|---|---|---|
| 1 | Room dan sesi permainan guru | Guru perlu membuat room dan menjalankan game dengan kontrol penuh atas kelas dan topik | Masuk MVP | Fitur ini adalah pintu masuk utama untuk seluruh proses permainan |
| 2 | Join room dan autentikasi siswa | Siswa perlu masuk ke room dengan kode tanpa hambatan teknis | Masuk MVP | Tanpa langkah ini, siswa tidak dapat ikut serta dalam sesi |
| 3 | Input nama dan masalah siswa | Siswa perlu menuliskan masalah atau hal yang ingin dibagikan dengan aman | Masuk MVP | Ini adalah inti dari pengalaman berbagi dan diskusi kelas |
| 4 | Topik dan tampilan panduan kelas | Siswa membutuhkan konteks yang jelas saat mengikuti permainan | Masuk MVP | Membantu menjaga fokus diskusi dan memastikan semua peserta memahami topik |
| 5 | Mode permainan individu dan kelompok | Guru memerlukan opsi pengelompokan sesuai kebutuhan kelas | Masuk MVP | Memberikan fleksibilitas penggunaan product di kelas yang berbeda |
| 6 | Manajemen giliran dan grouping logic | Guru butuh aturan turn-taking agar permainan berjalan terarah | Masuk MVP | Ini adalah komponen inti dari pengalaman game edukatif |
| 7 | Pause, resume, dan reconnect session | Kelas sering berubah, jadi sesi harus bisa diteruskan dan dipulihkan | Masuk MVP | Sangat relevan untuk penggunaan nyata di ruang kelas |
| 8 | Monitoring peserta dan dashboard guru | Guru perlu melihat siapa yang sudah masuk, siap, atau tampil | Masuk MVP | Mendukung validasi dan kontrol guru selama permainan |
| 9 | Riwayat permainan dan laporan hasil | Guru perlu mengevaluasi sesi yang telah dilakukan | Masuk MVP | Memberikan manfaat pasca-sesi dan mendorong penggunaan berulang |
| 10 | Manajemen sekolah, kelas, guru, dan topik | Fungsional administratif penting untuk operasional sekolah | Masuk MVP | Diperlukan agar workflow institusi berjalan secara konsisten |
| 11 | Analitik lanjutan, export laporan detail, dan insight mendalam | Fitur ini menguatkan evaluasi, tetapi bukan kebutuhan primer untuk nilai inti produk | Ditunda | Masuk pada iterasi berikutnya setelah MVP stabil dan berhasil dipakai |
| 12 | Integrasi tambahan, modul ekspansi, atau fitur non-inti | Potensi pengembangan lanjutan untuk skala yang lebih besar | Ditunda | Tidak diperlukan pada fase validasi awal MVP |

## 4. Lean Canvas Versi MVP: Blok Solution dan Unique Value Proposition

| Problem | Solution | Unique Value Proposition | Unfair Advantage | Customer Segments |
|---|---|---|---|---|
| Siswa sering takut atau malu menyampaikan permasalahan di kelas. Guru memerlukan cara yang lebih terstruktur dan aman untuk memfasilitasi diskusi. Kegiatan berbagi di kelas cenderung kurang interaktif dan sulit dipantau. | PhillyoGo MVP menyediakan room classroom game berbasis kode, input masalah siswa, topik pembahasan terarah, mode permainan individu/kelompok, turn management, monitoring guru, dan riwayat sesi. Semua alur dirancang agar guru dapat memimpin dengan kontrol penuh sambil siswa tetap merasa aman dan terlibat. | PhillyoGo membantu guru memfasilitasi diskusi kelas yang aman, interaktif, dan terdokumentasi, sehingga siswa lebih berani berbagi dan guru lebih mudah memandu proses belajar. | Keunggulan utama berupa kombinasi antara game classroom, pengendalian guru, dan keterlibatan siswa dalam format yang aman, terarah, dan terdokumentasi. | Siswa sekolah, guru kelas, admin sekolah, dan pengelola sekolah yang membutuhkan pendekatan diskusi kelas yang lebih interaktif dan terstruktur. |

| Existing Alternatives | Key Metrics | Channels | Early Adopters |
|---|---|---|---|
| Diskusi kelas konvensional, papan tulis, forum sederhana, atau kegiatan lisan tanpa struktur game, yang kurang interaktif dan sulit dipantau. | Jumlah room aktif, jumlah siswa yang bergabung, rata-rata submit masalah per sesi, durasi sesi aktif, tingkat penggunaan mode kelompok, tingkat completion game, dan jumlah guru yang menggunakan kembali. | Website aplikasi, penyebaran oleh sekolah, pendekatan demo guru, workshop kelas, dan program pendampingan di lingkungan sekolah. | Guru kelas, wali kelas, dan sekolah yang sedang mencari metode pembelajaran berbasis diskusi aktif dan penguatan sosial-emosional. |

| Cost Structure | Revenue Stream |
|---|---|
| Biaya pengembangan aplikasi, infrastruktur backend dan database, maintenance realtime, deployment, desain UI, serta biaya uji internal dan dokumentasi. | Potensi model pendapatan pada tahap berikutnya dapat berupa lisensi penggunaan untuk sekolah, paket layanan guru/kelas, dan layanan dukungan administrasi serta pelatihan penggunaan. |

## 5. Rencana Kerja & Timeline Pengembangan MVP

| No. | Milestone/Aktivitas | PIC | Target Tanggal | Status |
|---|---|---|---|---|
| 1 | Finalisasi scope MVP, user flow, dan prioritas fitur | Project Lead | 29 September 2026 | Draft Final |
| 2 | Finalisasi arsitektur backend dan skema data utama | Backend Engineer | 06 Oktober 2026 | Planned |
| 3 | Implementasi auth, roles, room, dan sesi game | Backend Engineer | 13 Oktober 2026 | Planned |
| 4 | Implementasi frontend guru: dashboard, room, dan monitoring | Frontend Engineer | 20 Oktober 2026 | Planned |
| 5 | Implementasi frontend siswa: join room, input nama, dan submit masalah | Frontend Engineer | 27 Oktober 2026 | Planned |
| 6 | Integrasi realtime Socket.IO dan game flow | Backend + Frontend Engineer | 03 November 2026 | Planned |
| 7 | Uji internal, bug fixing, dan validasi end-to-end | QA Tester + Tim Pengembang | 10 November 2026 | Planned |
| 8 | Release candidate MVP, dokumentasi, dan persiapan business model validation | Project Lead + Tim | 17 November 2026 | Planned |

## 6. Wireframe / Desain Awal MVP yang Akan Dikembangkan

Berikut adalah gambaran struktur halaman utama yang akan dikembangkan pada MVP:

1. Halaman Login dan Role Access
   - Guru, admin sekolah, dan siswa masuk menggunakan akun dengan role masing-masing.
   - Setelah login, user diarahkan ke dashboard sesuai peran.

2. Dashboard Guru
   - Menampilkan daftar kelas, room aktif, dan sesi permainan yang sedang berjalan.
   - Guru dapat membuka room baru, memilih topik, dan mengonfigurasi mode permainan.

3. Halaman Pembuatan Room dan Sesi Game
   - Guru membuat room dengan kode unik.
   - Guru memilih topik pembahasan, mode permainan, serta konfigurasinya.

4. Halaman Join Room Siswa
   - Siswa memasukkan kode room dan nama diri.
   - Setelah masuk, siswa menunggu sesi dimulai.

5. Halaman Input Masalah Siswa
   - Siswa menuliskan satu permasalahan atau hal yang ingin disampaikan.
   - Data ini dikirim ke sistem dan ditampilkan sesuai logika game.

6. Halaman Tunggu / Waiting Room
   - Guru melihat daftar peserta yang sudah masuk.
   - Siswa melihat informasi topik dan status permainan.

7. Halaman Permainan (Mode Individu / Kelompok)
   - Siswa mengikuti permainan sesuai giliran dan aturan yang ditentukan.
   - Guru memantau jalannya sesi dan dapat melakukan pause/resume.

8. Halaman Monitoring Guru
   - Guru melihat status peserta, kelompok, dan perkembangan permainan secara real time.
   - Guru memiliki kontrol untuk mengatur jalannya game.

9. Halaman Hasil/Akhir Sesi
   - Menampilkan aktivitas yang telah berlangsung.
   - Guru dapat melihat riwayat dan ringkasan permainan untuk evaluasi.

10. Halaman Riwayat dan Rekap
   - Menyimpan data sesi lama agar dapat ditinjau kembali di iterasi selanjutnya.

Dengan demikian, MVP PhillyoGo berfokus pada fungsi inti yang paling penting: room creation, student participation, shared problem submission, guided classroom game flow, dan monitoring guru. Fitur tambahan dapat dikembangkan setelah MVP terbukti berdampak dan diterima oleh pengguna nyata.

## 7. Kesimpulan

MVP PhillyoGo harus difokuskan pada kebutuhan utama pengguna: membantu guru mengelola diskusi kelas secara aman dan terstruktur, serta membuat siswa lebih nyaman berbagi dan berpartisipasi. Dengan pendekatan ini, produk akan memiliki fitur inti yang jelas, timeline yang terukur, dan kesiapan untuk tahap validasi business model berikutnya.

