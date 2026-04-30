# HiMup - IT Infrastructure Ticketing System

Sistem ticketing berbasis web dan mobile (PWA/Android) yang dirancang khusus untuk mengelola masalah infrastruktur IT secara efisien menggunakan pendekatan SLA (Service Level Agreement). 

Dibangun dengan **Laravel, MySQL, dan REST API** untuk backend, serta **React + Vite + Capacitor** untuk aplikasi mobile, sistem ini memusatkan pelaporan, pelacakan, dan penyelesaian insiden IT di seluruh cabang organisasi.

---

## 🎯 Tujuan Utama

Sistem ini mendigitalkan alur kerja operasional dukungan IT. Sistem ini mengintegrasikan manajemen tiket dengan pelacakan pemeliharaan aset, dan menyediakan pemantauan kinerja melalui metrik SLA dan pelaporan KPI.

Tujuan utamanya adalah memastikan bahwa setiap masalah yang dilaporkan ditangani dalam batas waktu yang telah ditentukan berdasarkan tingkat prioritasnya, sambil menjaga transparansi dan keterlacakan (traceability).

## 👥 Peran dan Hak Akses (Role)

Sistem ini menerapkan Role-Based Access Control (RBAC) secara ketat untuk alasan keamanan dan integritas operasional:

### 1. Super Admin
* **Tugas:** Memiliki kendali penuh atas konfigurasi sistem dan pemantauan.
* **Hak Akses:** Mengelola Master Data (struktur organisasi, cabang, kategori masalah, peran, dan akun pengguna). Dapat mengakses laporan KPI, melacak performa SLA, dan mengekspor data.
* *Dalam praktiknya, Super Admin bertindak sebagai pengendali sistem dan auditor.*

### 2. Branch (User / Reporter)
* **Tugas:** Mewakili unit operasional atau lokasi yang melaporkan masalah (membuat tiket via Web Portal).
* **Hak Akses:** Membuat tiket dengan memberikan detail (subjek, deskripsi, kategori, prioritas). Dapat memantau status tiket mereka secara real-time.
* *Tidak memiliki akses untuk memanipulasi data sistem atau melihat tiket dari cabang/pengguna lain.*

### 3. IT Operation Staff (Aplikasi Mobile)
* **Tugas:** Bertanggung jawab langsung ke lapangan untuk menyelesaikan tiket.
* **Hak Akses:** Dapat melihat tiket yang masuk, mengambil alih (take ownership) tiket, memperbarui status tiket, dan mencatat Log Maintenance (detail perbaikan & biaya perbaikan).
* *Aplikasi Mobile ini **dirancang khusus** untuk peran ini, sehingga staf lapangan dapat bekerja secara mobile.*

---

## 🔄 Alur Siklus Tiket (Lifecycle Flow)

1. **Pembuatan Tiket (Ticket Creation):** Pengguna Branch (via Web) mengirimkan formulir tiket. Sistem secara otomatis memberikan ID Tiket unik dan menghitung tenggat waktu SLA (Resolution & Response Time) berdasarkan prioritas. Status awal: `Open`.
2. **Penugasan (Ticket Assignment):** Staf Operasional IT (via Mobile) menerima notifikasi, melihat antrian, dan mengambil alih tiket. Status berubah menjadi: `In Progress`.
3. **Penanganan (Ticket Handling):** Staf IT melakukan perbaikan atau pemecahan masalah di lapangan.
4. **Penyelesaian (Resolution):** Staf IT mengubah status menjadi `Resolved`. Di titik ini, staf diwajibkan mencatat detail pemeliharaan/perbaikan.
5. **Penutupan (Closure):** Setelah dikonfirmasi, tiket ditutup (`Closed`) dan diarsipkan untuk evaluasi KPI dan laporan performa SLA.

---

## ⏳ Mekanisme SLA (Service Level Agreement)

SLA adalah mekanisme kontrol utama pada sistem ini. Setiap tiket memiliki batas waktu respon dan penyelesaian berdasarkan prioritas:
- **Critical:** Memerlukan perhatian segera dengan waktu penyelesaian yang sangat singkat.
- **High:** Masalah signifikan yang berdampak langsung pada operasi.
- **Medium:** Dampak moderat.
- **Low:** Permintaan kecil atau masalah minor.

Sistem melacak secara otomatis apakah tiket diselesaikan dalam batas SLA, yang kemudian digunakan sebagai metrik evaluasi kinerja.

---

## 🔒 Keamanan & Best Practices (Security)

Aplikasi ini dibangun dengan mengutamakan standar keamanan:
- **Environment Isolation:** Semua kredensial API dan konfigurasi sensitif dipisahkan dari source code menggunakan `.env` (di-ignore oleh git).
- **Authentication:** Menggunakan otentikasi Bearer Token (Sanctum) yang diamankan dalam _local environment_.
- **Role-Based Access Control:** Aplikasi mobile secara otomatis memblokir _login_ jika pengguna bukan bagian dari `IT Operations Staff`, memastikan tidak ada celah akses lintas peran.
- **Data Serialization:** Ekstraksi data API menggunakan mekanisme pembungkus (_unwrap wrapper_) yang aman sehingga crash akibat struktur JSON tidak valid dapat dihindari.
- **Protected Routes:** Manajemen _state_ reaktif untuk memastikan halaman terlindungi dari pengguna tanpa sesi yang sah.

---

## 🚀 Pengembangan (Development Approach)

Proyek ini dikembangkan dengan metodologi **Scrum** secara iteratif. Kode sumber (source code) untuk Mobile App berada di folder `/mobile` yang dapat dibuild menjadi Web App (PWA) maupun Native Android APK menggunakan Ionic Capacitor.

### Menjalankan secara Lokal
1. Masuk ke folder mobile: `cd mobile`
2. Salin template environment: `cp .env.example .env`
3. Sesuaikan `VITE_API_URL` dengan server Laravel Anda.
4. Install dependensi: `npm install`
5. Jalankan server lokal: `npm run dev`

### Build untuk Android (APK)
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```
