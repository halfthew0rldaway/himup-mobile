# HiMup IT Infrastructure Ticketing System

Sistem ticketing berbasis web dan mobile yang dirancang khusus untuk mengelola masalah infrastruktur IT secara efisien menggunakan pendekatan SLA (Service Level Agreement).

Repositori ini secara khusus berisi Aplikasi Mobile (Android) yang diperuntukkan bagi Teknisi dan Staf Operasional IT di lapangan. Aplikasi ini tersinkronisasi langsung secara real time dengan Web Dashboard Utama atau Portal Admin.

## Antarmuka Sistem

Sistem HiMup dibagi menjadi dua antarmuka utama dengan fungsi yang saling melengkapi.

**Web Dashboard**
Digunakan oleh Super Admin dan Manager untuk konfigurasi sistem, pemantauan KPI, melihat metrik SLA, serta digunakan oleh Branch (Reporter) untuk membuat laporan masalah atau tiket awal.

**Aplikasi Mobile (Repositori Ini)**
Merupakan ujung tombak di lapangan yang dirancang secara eksklusif untuk IT Operation Staff. Aplikasi ini mempermudah mobilitas teknisi dengan fungsi utama sebagai berikut:
1. Menerima notifikasi tiket baru secara langsung.
2. Melakukan proses pengambilan alih tiket di lapangan.
3. Memperbarui status tiket (In Progress, Hold, Resolved) secara real time.
4. Mencatat detail perbaikan, memfoto bukti, dan menginput log pemeliharaan (biaya dan suku cadang).
5. Melihat riwayat penanganan (mutations) pada masing-masing aset perangkat keras IT.

Dengan pemisahan ini, teknisi tidak perlu repot membuka laptop atau mengakses web saat sedang bekerja membetulkan perangkat jaringan. Teknisi cukup membuka aplikasi, memulai pekerjaan, dan menutup tiket dari perangkat seluler mereka.

## Teknologi dan Pustaka (Tech Stack)

Aplikasi mobile ini dibangun di atas ekosistem JavaScript modern dengan pengemasan hybrid untuk menargetkan perangkat Android. 

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Inti Framework** | React 19 & Vite | Menyediakan rendering antarmuka pengguna yang sangat cepat dengan proses build yang dioptimalkan. |
| **Mobile Runtime** | Ionic Capacitor 8 | Berfungsi sebagai jembatan antara kode web dan lapisan native Android. |
| **Manajemen State** | Zustand | Digunakan untuk mengelola state global yang ringan, seperti sesi otentikasi pengguna. |
| **Sinkronisasi Data** | TanStack Query v5 | Menangani proses pengambilan data (fetching), caching lokal, sinkronisasi stat, dan invalidasi data pintar. |
| **Routing** | React Router DOM | Mengelola navigasi antar halaman dan perlindungan rute berbasis peran. |
| **Styling** | Tailwind CSS v4 | Membentuk fondasi desain utilitas yang dikombinasikan dengan sistem desain kustom. |
| **Pemindai Barcode** | ZXing & HTML5 QRCode | Digunakan untuk membaca label aset fisik melalui kamera seluler. |
| **Klien API** | Axios | Menangani seluruh komunikasi HTTP REST ke server pusat Laravel. |
| **Plugin Native** | Local Notifications | Membantu memberikan sinyal kepada pengguna ketika tiket baru ditugaskan ke perangkat mereka. |

## Alur Siklus Tiket

Tabel berikut mengilustrasikan siklus hidup sebuah pelaporan dari awal hingga akhir.

| Tahap | Aktor | Proses Bisnis | Status Akhir |
| :--- | :--- | :--- | :--- |
| **Pembuatan** | Pengguna Branch | Mengirimkan laporan via Web. Sistem memberikan ID Tiket dan menghitung batas SLA. | Open |
| **Penugasan** | Staf IT Mobile | Melihat antrian tiket dan mengambil alih kepemilikan tiket. | In Progress |
| **Penanganan** | Staf IT Mobile | Melakukan pemecahan masalah di lokasi fisik. Pengatur waktu SLA mulai berjalan. | In Progress |
| **Penangguhan** | Staf IT Mobile | Menghentikan SLA sementara waktu apabila sedang menunggu vendor atau suku cadang. | Hold |
| **Penyelesaian** | Staf IT Mobile | Menginput detail solusi teknis dan menandai perbaikan telah usai. | Resolved / Closed |

## Mekanisme Service Level Agreement (SLA)

SLA adalah pengukur performa utama di dalam aplikasi. Sistem melacak durasi penyelesaian dan memotong durasi penangguhan untuk mencari nilai penanganan absolut.

| Prioritas | Batas Waktu | Tingkat Urgensi |
| :--- | :--- | :--- |
| **Critical** | 4 Jam | Dampak fatal pada operasional utama |
| **High** | 8 Jam | Dampak signifikan pada alur kerja krusial |
| **Medium** | 24 Jam | Penurunan performa pada layanan standar |
| **Low** | 72 Jam | Permintaan bantuan minor atau non operasional |

Sistem secara otomatis melacak waktu penanganan nyata dan akan memberikan warna visual untuk merepresentasikan status pencapaian batas tenggat waktu.

## Arsitektur dan Keamanan

Keamanan data dipastikan melalui komunikasi enkripsi dan segregasi token. Terhubung dengan REST API backend Laravel via Bearer Token menggunakan Sanctum.

> **Kontrol Akses Berbasis Peran**
> Aplikasi mobile akan secara otomatis menolak dan memblokir sesi otentikasi apabila kredensial pengguna terdeteksi tidak memiliki peran IT Operations Staff, menutup potensi celah akses silang peran.

Selain itu, perhitungan data agregasi analitik stat ditangani secara pintar menggunakan teknik *memory efficient fetching* secara lokal di perangkat klien. Hal ini mengizinkan aplikasi untuk tetap memberikan angka faktual meskipun pengguna sedang menggunakan berbagai macam kriteria pencarian tanpa harus membebani lalu lintas peladen secara masif.
