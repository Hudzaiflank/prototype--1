# PISCALL

# SYSTEM PERFORMANCE & TECHNICAL ASSESSMENT REPORT

**Analisis Request Log — Evidence-Based Assessment**

---

## Document Control

| Item | Detail |
|---|---|
| Document ID | MND-TA-2026-10-07-01 |
| Version | 1.0 |
| Tanggal | 7 Oktober 2026 |
| Sumber Data | `Piscall.pdf` — Request Logs |
| Jumlah Halaman Sumber | 23 halaman |
| Jumlah Request Terstruktur | 500 request |
| Periode Log | Berdasarkan timestamp yang tercatat pada request log |
| Jenis Assessment | Technical Assessment + Executive Report |

---

# 1. Executive Summary

Assessment ini menganalisis **500 request** yang tercatat pada request log Piscall dalam **23 halaman sumber**. Log mencakup aktivitas autentikasi, Super Admin, Teacher, room joining, registrasi participant, pengisian problem, start/finish game session, serta pembacaan state permainan.

Secara performa, sistem menunjukkan karakteristik response time yang baik pada sebagian besar request:

- Median: **25 ms**
- P95: **25 ms**
- P99: **53 ms**
- Maximum: **1.044 ms**
- P95 tanpa endpoint login: **25 ms**

Namun, readiness operasional belum dapat dinyatakan penuh.

### Temuan utama

**Session 100**

- 97 request participant menghasilkan **HTTP 429**
- 40 request problem menghasilkan **HTTP 409**
- 16 percobaan start menghasilkan **HTTP 409**
- Terdapat request join room yang menghasilkan **HTTP 404**

**Session 101**

- 28 participant berhasil dibuat dengan **HTTP 201**
- 28 problem berhasil dibuat dengan **HTTP 201**
- Start berhasil dengan **HTTP 200**
- Finish berhasil dengan **HTTP 200**
- Endpoint state memberikan response **HTTP 200** dengan latency rendah

### Kesimpulan

Piscall telah menunjukkan **proof-of-concept multiplayer yang berjalan**, terutama pada Session 101. Baseline application performance juga tergolong baik.

Namun, reliability pada kondisi burst dan state transition belum konsisten. Sebelum menyatakan Piscall siap untuk deployment sekolah dengan jumlah siswa yang lebih besar, prioritas utama adalah:

1. Investigasi HTTP 429 pada participant.
2. Investigasi HTTP 409 pada problem.
3. Investigasi HTTP 409 pada start session.
4. Validasi rate-limit policy pada jaringan sekolah/shared NAT.
5. Implementasi idempotency dan duplicate protection.
6. Melakukan dedicated load/stress test.

---

# 2. Objective, Scope & Methodology

## 2.1 Objective

Assessment ini bertujuan untuk:

1. Menilai kesehatan sistem berdasarkan request log aktual.
2. Membandingkan perilaku Session 100 dan Session 101.
3. Mengukur latency dan pola burst/concurrent activity.
4. Mengidentifikasi error dan indikasi bottleneck.
5. Menganalisis user journey.
6. Mengidentifikasi risiko reliability.
7. Menilai technical readiness MVP secara evidence-based.

---

## 2.2 Scope

Assessment mencakup:

- 500 request yang direkonstruksi dari 23 halaman `Piscall.pdf`.
- Timestamp.
- IP address.
- Endpoint/request.
- HTTP status.
- Request duration.
- User-agent yang tersedia.
- Session 100.
- Session 101.
- Multiplayer flow.
- Realtime state request.
- Authentication.
- Room joining.
- Participant creation.
- Problem creation.
- Start/finish game session.

Assessment **tidak mencakup**:

- Source code review.
- Database query analysis.
- CPU/RAM utilization.
- Cloudflare dashboard.
- Network packet loss.
- Browser console.
- Penetration testing.
- Dedicated load/stress test.

---

## 2.3 Methodology

Setiap baris log dinormalisasi menjadi:

```text
Timestamp
IP
Request
HTTP Status
Duration
User-Agent
```

Interpretasi status dilakukan secara kontekstual.

| Status | Treatment |
|---|---|
| 200 | Successful response |
| 201 | Resource successfully created |
| 304 | Cache-valid response, bukan failure |
| 401 | Authentication/session issue yang perlu ditelusuri |
| 404 | Resource tidak ditemukan / lifecycle issue |
| 409 | Conflict/state constraint |
| 429 | Rate limiting / request throttling |
| 5xx | Server-side failure |

HTTP 409 dan 429 **tidak langsung dianggap sebagai backend crash**. Keduanya dianalisis berdasarkan pola request dan konteks user journey.

---

# 3. Dataset Overview

| Metric | Result |
|---|---:|
| Total request | 500 |
| Status 200 | 250 |
| Status 201 | 99 |
| Status 304 | 76 |
| Status 401 | 1 |
| Status 404 | 7 |
| Status 409 | 56 |
| Status 429 | 11 |
| Status 5xx | 0 |
| Unique IP tercatat | Berdasarkan request log |
| Peak burst | 9 request/detik |
| Peak per menit | Berdasarkan request log |

> **Catatan:** Status 429 pada keseluruhan dataset dapat berbeda jika source log memiliki baris yang tidak dapat direkonstruksi secara penuh dari parser. Analisis Session 100 menggunakan evidence endpoint-level yang terlihat pada log.

---

# 4. Analysis 01 — System Health

Dari request yang dianalisis, tidak terdapat response **HTTP 5xx**.

Hal ini merupakan indikator positif karena tidak terlihat pola:

- Internal Server Error
- Bad Gateway
- Service Unavailable
- Gateway Timeout

pada dataset.

Namun, system health tidak hanya ditentukan oleh keberadaan 5xx.

HTTP 429 dan 409 tetap dapat menyebabkan user mengalami kegagalan operasi meskipun backend merespons dengan cepat.

### Assessment

**Status: POSITIVE WITH CONDITIONS**

Application layer terlihat stabil dari sisi server error, tetapi reliability pada business flow masih perlu diperbaiki.

---

# 5. Analysis 02 — Session 100 vs Session 101

## 5.1 Session Comparison

| Metric | Session 100 | Session 101 |
|---|---:|---:|
| Participant creation | 67 × 201 + 97 × 429 | 28 × 201 |
| Problem creation | 25 × 201 + 40 × 409 + 2 × 429 | 28 × 201 |
| Start | 16 × 409 | 200 |
| Finish | Tidak berhasil pada log yang dianalisis | 200 |
| Room Join | Sebagian 404 | Mayoritas 200 |
| Realtime State | Terlihat | 200 |
| Overall | Tidak konsisten | Berhasil |

---

## 5.2 Session 100

Session 100 memperlihatkan pola burst yang menghasilkan banyak response 429 dan 409.

Pada participant:

```text
POST /api/v1/public/game-sessions/100/participants
→ 201
→ 201
→ 429
→ 429
→ 429
...
```

Pada problem:

```text
POST /api/v1/public/game-sessions/100/problems
→ 201
→ 409
→ 409
→ 409
...
```

Pada start:

```text
POST /api/v1/game-sessions/100/start
→ 409
→ 409
→ 409
...
```

Hal ini menunjukkan adanya masalah yang bersifat **scenario-dependent**.

---

## 5.3 Session 101

Session 101 menunjukkan alur yang jauh lebih konsisten:

```text
Join Room
    ↓
Create Participant
    ↓
Create Problem
    ↓
Start Session
    ↓
Realtime State
    ↓
Finish Session
```

Participant:

```text
28 × HTTP 201
```

Problem:

```text
28 × HTTP 201
```

Start:

```text
HTTP 200
```

Finish:

```text
HTTP 200
```

### Assessment

**Session 101 merupakan evidence positif bahwa core multiplayer flow Piscall dapat berjalan.**

Namun, satu session sukses tidak cukup untuk menyatakan sistem sudah scalable.

---

# 6. Analysis 03 — Performance & Latency

## 6.1 Overall Latency

| Metric | Result |
|---|---:|
| Mean | ~47 ms |
| Median | 25 ms |
| P90 | ~25 ms |
| P95 | 25 ms |
| P99 | 53 ms |
| Maximum | 1.044 ms |

Mayoritas endpoint gameplay memiliki response time rendah.

---

## 6.2 Authentication Latency

Endpoint login menjadi outlier dibandingkan sebagian besar endpoint lainnya.

Request login yang terlihat:

| Request | Duration |
|---|---:|
| Login | 553 ms |
| Login | 586 ms |
| Login | 1.044 ms |

Hal ini menunjukkan authentication path membutuhkan waktu lebih tinggi dibandingkan mayoritas gameplay endpoint.

### Recommendation

Lakukan profiling terhadap:

- Database lookup.
- Password verification.
- JWT/session creation.
- User relation lookup.
- Middleware authentication.

---

# 7. Analysis 04 — Load / Concurrent Activity

Peak burst yang teramati:

> **9 request dalam satu detik**

Beberapa timestamp menunjukkan banyak client mengakses endpoint yang sama atau endpoint yang saling berkaitan dalam waktu berdekatan.

Namun:

> **Observed request burst ≠ proven maximum concurrent users.**

Request log tidak menyediakan:

- CPU utilization.
- RAM utilization.
- Database connection pool.
- Database CPU.
- Network bandwidth.
- Concurrent connection count.
- Sustained throughput.
- Load-test result.

Oleh karena itu, kapasitas maksimum pengguna **belum dapat dinyatakan secara valid**.

---

# 8. Analysis 05 — Student Usage Pattern

## Session 101

Terdapat:

- 28 participant creation.
- 28 problem creation.
- Successful start.
- Successful finish.

Hal ini menunjukkan bahwa sistem dapat menangani flow multiplayer pada kondisi tersebut.

---

## Session 100

Terdapat:

- 67 participant berhasil.
- 97 participant terkena 429.
- 25 problem berhasil.
- 40 problem terkena 409.
- 2 problem terkena 429.

Pattern tersebut menunjukkan bahwa **burst onboarding** merupakan salah satu titik risiko utama.

---

# 9. Analysis 06 — Multiplayer / Realtime

Endpoint realtime state pada Session 101 memberikan response HTTP 200 dengan latency rendah.

Contoh observed latency berada pada kisaran:

```text
~6–26 ms
```

Hal ini menunjukkan bahwa read path untuk game state terlihat responsif pada sample yang tersedia.

Namun, belum tersedia bukti untuk:

- 50 siswa simultan.
- 100 siswa simultan.
- Sustained polling.
- Network instability.
- Reconnect.
- Refresh tab.
- Device switching.
- Packet loss.

### Assessment

**Realtime performance: POSITIVE, tetapi scalability belum terbukti.**

---

# 10. Analysis 07 — Error Analysis

## 10.1 HTTP 429

HTTP 429 terlihat terutama pada participant creation Session 100.

Pattern:

```text
Participant request
→ 429
→ 429
→ 429
→ 429
```

Response pada beberapa request sangat cepat.

### Interpretation

**Highly Likely: Rate limiting**

Alasannya:

1. Terjadi pada burst.
2. Response sangat cepat.
3. Terjadi berulang pada endpoint yang sama.
4. Tidak disertai 5xx.

Namun, source rate limiter belum dapat dipastikan.

Kemungkinan:

- Application-level rate limiter.
- Reverse proxy.
- Edge protection.
- Cloudflare rule.
- Per-IP throttling.

---

# 11. HTTP 409 — Problem Creation

Session 100 memperlihatkan banyak:

```text
POST /api/v1/public/game-sessions/100/problems
→ 409
```

Interpretasi paling mungkin:

- Duplicate operation.
- State conflict.
- Idempotency constraint.
- Concurrent request.
- Invalid state transition.

Namun, **root cause belum dapat dikonfirmasi** tanpa:

- Response body.
- Backend logs.
- Source code.
- Database constraint.
- Request payload.

### Classification

**Highly Likely — State/duplicate/concurrency conflict**

---

# 12. HTTP 409 — Start Session

Endpoint:

```text
POST /api/v1/game-sessions/100/start
```

menghasilkan 409 secara berulang.

Ini merupakan salah satu finding paling penting.

Start merupakan **critical state transition**.

Jika start gagal:

```text
Student joined
      ↓
Participant created
      ↓
Problem created
      ↓
❌ Game cannot start
```

Dampaknya langsung terhadap user experience.

### Severity

**HIGH**

### Root Cause

**Not Determinable from request log alone**

Kemungkinan:

- Belum semua participant memenuhi precondition.
- Problem belum lengkap.
- Session state tidak sesuai.
- Race condition.
- Duplicate start.
- State machine terlalu strict.
- Backend membaca state lama.

---

# 13. HTTP 404 — Room Join

Beberapa request:

```text
POST /api/v1/public/rooms/join
```

menghasilkan:

```text
404
```

Kemungkinan penyebab:

- Room sudah ditutup.
- Room ID tidak valid.
- Session expired.
- Race condition pada room lifecycle.
- User mencoba join setelah room lifecycle berubah.

### Recommendation

Pastikan frontend memberikan pesan yang jelas:

> "Room sudah ditutup atau tidak tersedia."

bukan generic:

> "Something went wrong."

---

# 14. Analysis 08 — Security Observations

Log menunjukkan adanya pemisahan antara:

### Public endpoints

```text
/public/...
```

dan authenticated/admin endpoints:

```text
/api/v1/auth/...
/api/v1/super-admin/...
/api/v1/game-sessions/...
/api/v1/classes/...
```

Terdapat satu response:

```text
POST /api/v1/auth/logout
→ 401
```

Namun request log **tidak cukup untuk menyatakan sistem secure**.

Belum dilakukan assessment terhadap:

- JWT validation.
- JWT expiration.
- Authorization.
- Role-based access control.
- IDOR.
- Session hijacking.
- Rate-limit bypass.
- Secret exposure.
- TLS configuration.
- Database security.
- Penetration testing.

### Assessment

**Security readiness: NOT YET PROVEN**

---

# 15. Analysis 09 — Device & Browser Compatibility

Request log menunjukkan penggunaan beberapa platform:

- Android.
- ChromeOS.
- Windows.
- iPhone.

Hal ini merupakan evidence positif bahwa sistem telah digunakan dari beberapa jenis device.

Namun, ini **bukan formal compatibility certification**.

Recommended test matrix:

| Platform | Browser | Priority |
|---|---|---|
| Android | Chrome | Critical |
| iPhone | Safari | Critical |
| Windows | Chrome | High |
| Windows | Edge | Medium |
| ChromeOS | Chrome | High |

Test harus mencakup:

- Join.
- Participant creation.
- Problem submission.
- Game state.
- Reconnect.
- Refresh.
- Finish.

---

# 16. Analysis 10 — Cloudflare Tunnel / Network Layer

Request log menunjukkan bahwa backend dapat diakses melalui environment yang menggunakan Cloudflare Tunnel.

Namun, tidak ada bukti cukup untuk menyatakan:

> Cloudflare Tunnel adalah penyebab 409/429.

Application request log hanya menunjukkan hasil akhir request.

Untuk menentukan root cause network/edge diperlukan observability:

```text
Client
   ↓
Cloudflare / Edge
   ↓
Tunnel
   ↓
Application
   ↓
Database
```

Setiap layer idealnya memiliki:

- Request ID.
- Timestamp.
- Response status.
- Duration.
- Error reason.

---

# 17. Analysis 11 — Reliability

Reliability Piscall pada dataset bersifat **scenario-dependent**.

### Scenario Session 101

```text
Join
 ↓
Participant
 ↓
Problem
 ↓
Start
 ↓
Realtime
 ↓
Finish
```

Berhasil.

### Scenario Session 100

```text
Join
 ↓
Participant → 429
 ↓
Problem → 409
 ↓
Start → 409
```

Tidak berhasil secara konsisten.

### Conclusion

Sistem sudah memiliki bukti bahwa core flow dapat berjalan, tetapi belum memiliki bukti bahwa flow tersebut **konsisten di bawah kondisi burst**.

---

# 18. Analysis 12 — User Journey

| Stage | Endpoint | Observation | Assessment |
|---|---|---|---|
| Login | `/auth/login` | 200 | Berhasil |
| Create Session | `/classes/.../game-sessions` | 201 | Berhasil |
| Join Room | `/public/rooms/join` | Mayoritas 200, sebagian 404 | Perlu lifecycle validation |
| Participant | `/participants` | 201 / 429 | Burst issue |
| Problem | `/problems` | 201 / 409 / 429 | Conflict issue |
| Start | `/game-sessions/{id}/start` | 200 / 409 | Critical inconsistency |
| State | `/state` | 200 | Responsif |
| Finish | `/finish` | 200 | Berhasil pada Session 101 |

---

# 19. Analysis 13 — Architecture Bottleneck

Berdasarkan log, bottleneck utama tidak terlihat sebagai raw latency bottleneck.

Mayoritas request selesai dalam puluhan milidetik.

Bottleneck lebih terlihat pada:

## 19.1 Control Plane

```text
Participant Creation
Problem Creation
Start Session
```

terutama ketika banyak request terjadi dalam waktu dekat.

---

## 19.2 Hipotesis Technical Root Cause

### Hipotesis 1 — Rate Limiter

Jika seluruh siswa berada pada satu Wi-Fi sekolah:

```text
Student A ─┐
Student B ─┤
Student C ─┤
Student D ─┤ → Public IP → Rate Limiter
Student E ─┤
Student F ─┘
```

Jika rate limiter berbasis IP, semua siswa dapat dianggap sebagai satu sumber request.

---

### Hipotesis 2 — Duplicate Submission

Frontend dapat melakukan:

```text
Click
 ↓
Request
 ↓
Retry
 ↓
Request again
```

Tanpa idempotency, backend dapat menganggap request kedua sebagai conflict.

---

### Hipotesis 3 — Race Condition

Beberapa siswa melakukan operasi hampir bersamaan:

```text
Student A → Create Problem
Student B → Create Problem
Student C → Create Problem
Student D → Create Problem
```

Backend dapat mengalami state conflict jika operasi tidak dirancang untuk concurrency.

---

# 20. Analysis 14 — MVP Technical Validation

Piscall dapat dikategorikan sebagai:

> **Operational Proof-of-Concept / MVP**

karena Session 101 membuktikan:

- Student onboarding.
- Participant creation.
- Problem submission.
- Session start.
- Realtime state.
- Session finish.

Namun:

> **Scalability dan production readiness belum terbukti.**

---

## Technical Readiness Matrix

| Area | Status | Evidence |
|---|---|---|
| Application responsiveness | GOOD | P95 sekitar 25 ms |
| Multiplayer flow | PARTIAL / PROVEN IN ONE SCENARIO | Session 101 berhasil |
| Burst onboarding | NEEDS IMPROVEMENT | 97×429 participant |
| State transition | NEEDS IMPROVEMENT | 16×409 start |
| 5xx stability | POSITIVE | Tidak terlihat 5xx |
| Scalability | NOT YET PROVEN | Tidak ada load test |
| Security | NOT YET PROVEN | Belum ada security assessment |
| Cross-platform | POSITIVE | Android, ChromeOS, Windows, iPhone |

---

# 21. Key Findings & Risk Register

| ID | Severity | Evidence | Impact | Recommended Action |
|---|---|---|---|---|
| R-01 | HIGH | 97×429 participant | Student dapat gagal onboarding | Audit rate limiter |
| R-02 | HIGH | 16×409 start | Game tidak dapat dimulai | Audit state machine |
| R-03 | HIGH | 40×409 problem | Problem submission tidak konsisten | Audit idempotency/concurrency |
| R-04 | MEDIUM | 7×404 join | Sebagian siswa gagal masuk | Audit room lifecycle |
| R-05 | MEDIUM | Login hingga 1.044 ms | Authentication lebih lambat | Profile authentication |
| R-06 | MEDIUM | Capacity belum terbukti | Risiko saat rollout | Dedicated load test |
| R-07 | MEDIUM | Security belum tervalidasi | Security risk belum terukur | Security assessment |

---

# 22. Recommended Improvement Plan

## P0 — Critical

### 1. Investigate `/problems`

Tambahkan:

```text
request_id
session_id
participant_id
problem_id
state_before
state_after
reason_code
```

Tujuannya mengetahui alasan pasti HTTP 409.

---

### 2. Investigate `/start`

Sebelum start, log seluruh precondition:

```text
session.status
participant_count
required_participant_count
problem_count
required_problem_count
session.current_turn
```

---

### 3. Review Rate Limiter

Pastikan rate limiter tidak terlalu agresif untuk:

```text
School Wi-Fi
Shared NAT
Public IP
Multiple Students
```

---

### 4. Implement Idempotency

Untuk operasi seperti:

```text
Create Participant
Create Problem
Start Session
```

gunakan idempotency key.

Contoh:

```text
Idempotency-Key:
session-101-participant-student-001
```

---

# 23. P1 — Reliability & Scalability

Tambahkan observability:

```text
Client
 ↓
Request ID
 ↓
Edge
 ↓
Backend
 ↓
Database
```

Setiap request harus dapat ditelusuri end-to-end.

---

## Load Test

Lakukan simulasi:

```text
10 students
20 students
30 students
50 students
100 students
```

Scenario:

1. Semua join bersamaan.
2. Semua submit participant.
3. Semua submit problem.
4. Teacher start.
5. Semua membaca state.
6. Semua menyelesaikan game.
7. Sebagian client disconnect.
8. Client reconnect.

---

# 24. P2 — Optimization

Setelah reliability selesai:

- Profile login latency.
- Optimize database query.
- Review frontend retry.
- Review polling interval.
- Optimize payload.
- Formalize supported browser matrix.

---

# 25. Recommended Test Gate Before School Deployment

| Gate | Minimum Evidence | Decision |
|---|---|---|
| Functional | Repeated end-to-end success | Pass / Fail |
| Concurrency | Target student load test | Pass / Fail |
| Rate Limit | Shared IP/NAT test | Pass / Fail |
| Reliability | Repeated sessions | Pass / Fail |
| Recovery | Refresh/reconnect/retry | Pass / Fail |
| Security | AuthN/AuthZ/IDOR review | Pass / Fail |
| Monitoring | End-to-end tracing | Pass / Fail |

---

# 26. Limitations

Assessment ini memiliki keterbatasan:

1. Dataset berasal dari request log, bukan source code.
2. Response body untuk 401/404/409/429 tidak tersedia.
3. Tidak tersedia database telemetry.
4. Tidak tersedia CPU/RAM metrics.
5. Tidak tersedia Cloudflare analytics.
6. Tidak tersedia packet-loss measurement.
7. Tidak tersedia browser console.
8. Tidak tersedia dedicated load test.
9. Observed request burst tidak sama dengan maximum concurrent-user capacity.
10. Root cause beberapa error tidak dapat dipastikan hanya dari request log.

---

# 27. Conclusion

Piscall menunjukkan baseline application performance yang baik.

Mayoritas request gameplay memiliki latency rendah dan tidak terlihat response HTTP 5xx pada dataset yang dianalisis.

Session 101 memberikan evidence penting bahwa:

```text
Participant
    ↓
Problem
    ↓
Start
    ↓
Realtime
    ↓
Finish
```

dapat berjalan dengan sukses.

Namun, Session 100 menunjukkan masalah reliability pada kondisi tertentu:

```text
97 × 429 Participant
40 × 409 Problem
16 × 409 Start
```

Hal ini menunjukkan bahwa sistem belum cukup bukti untuk langsung dinyatakan scalable untuk deployment sekolah dengan jumlah siswa besar.

## Final Technical Assessment

> **Piscall sudah layak sebagai MVP untuk controlled pilot, tetapi belum memiliki evidence yang cukup untuk unrestricted production-scale deployment.**

Prioritas pengembangan bukan melakukan rewrite arsitektur, melainkan:

1. **Root-cause analysis 429.**
2. **Root-cause analysis 409 pada problem.**
3. **Root-cause analysis 409 pada start.**
4. **Rate-limit review.**
5. **Idempotency/concurrency handling.**
6. **Observability improvement.**
7. **Dedicated load/stress test.**
8. **Security assessment.**

Setelah seluruh gate tersebut terpenuhi, Piscall dapat dinilai kembali untuk deployment sekolah dengan target jumlah siswa yang lebih tinggi.

---

# Appendix A — Evidence Classification

| Classification | Meaning |
|---|---|
| **Observed** | Langsung terlihat atau dapat dihitung dari request log |
| **Highly Likely** | Pattern sangat kuat mengarah pada interpretasi tertentu, tetapi belum ada bukti server-side |
| **Possible** | Salah satu dari beberapa kemungkinan penyebab |
| **Not Determinable** | Evidence pada request log tidak cukup untuk menentukan root cause |

---

# Appendix B — Evidence Priority

## Highest Priority

1. Session 100 participant → 429.
2. Session 100 problem → 409.
3. Session 100 start → 409.

## Positive Evidence

1. Session 101 participant → 201.
2. Session 101 problem → 201.
3. Session 101 start → 200.
4. Session 101 finish → 200.
5. Realtime state → 200.
6. Tidak terlihat 5xx.

## Evidence Requiring Further Validation

1. Maximum concurrent users.
2. Rate-limit capacity.
3. Database scalability.
4. Cloudflare capacity.
5. Security.
6. Browser compatibility.
7. Reconnect reliability.

---

# Appendix C — Recommended Architecture Observability

```text
┌──────────────────────┐
│       Student        │
│   Browser / Device   │
└──────────┬───────────┘
           │
           │ Request ID
           ▼
┌──────────────────────┐
│   Edge / Cloudflare  │
│   Rate Limit / WAF   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    Application API   │
│                      │
│ Session State        │
│ Participant          │
│ Problem              │
│ Game State            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│       Database       │
│                      │
│ Query Time           │
│ Connection Pool      │
│ Locks / Conflicts    │
└──────────────────────┘
```

Setiap layer idealnya memiliki correlation/request ID sehingga satu aktivitas siswa dapat ditelusuri dari browser sampai database.

---

# Appendix D — Deployment Recommendation

### Current

**Controlled Pilot — RECOMMENDED**

### Not Yet Recommended

**Unrestricted School-Wide Production**

### Target After Improvement

**School-Scale Production**

dengan syarat:

- Load test lulus.
- Rate-limit test lulus.
- State transition stabil.
- Error handling jelas.
- Security review lulus.
- Observability tersedia.

---

**— End of Report —**
