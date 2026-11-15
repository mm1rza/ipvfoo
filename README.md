# IPvFooKan (v0.1)

> **All-in-One In-Page Network Analyzer, BGP Traceroute, Link & Asset Grabber, and Deep META SEO Diagnostics.**  
> *Self-modified and unified extension for Google Chrome & Firefox.*  
> **Repository:** [https://github.com/mm1rza/ipvfoo](https://github.com/mm1rza/ipvfoo)

---

## 📌 Sekilas Tentang IPvFooKan

**IPvFooKan** adalah evolusi dan penggabungan mandiri dari beberapa tool analisis web open-source terpopuler yang disatukan ke dalam satu ekstensi browser yang ringan, cepat, dan modular:

1. **IPvFoo Core Engine** — Memantau alamat IP server asli setiap domain di halaman aktif secara *real-time* (IPv4, IPv6, HTTP/1.1, HTTP/2, HTTP/3 QUIC, TLS), statistik hit & bandwidth, serta latency response.
2. **BGP & Live Traceroute Visualizer** — Breadcrumb AS-Path transit ISP, integrasi live traceroute Looking Glass (HalloNet LG), lookup BGP.he.net, dan auto-generator script Address-List MikroTik RouterOS.
3. **Link & Asset Grabber** — Ekstraktor aset lengkap (Link, Gambar, Dokumen, Video/Audio, Scripts/CSS) dengan filter cerdas, konversi Base64 instan, tampilan Galeri Grid / List, serta ekspor teks.
4. **Deep META SEO Diagnostics** — Laporan audit SEO halaman mendalam (Common Meta, Social Open Graph & Twitter Card Previews, hierarki heading H1–H6, Schema.org JSON-LD structured data, status canonical & robots, serta ekspor Markdown / Print PDF).

Semua data jaringan ditangkap secara pasif dan privat menggunakan API `webRequest` browser tanpa membuat trafik DNS/network tambahan yang tidak perlu.

---

## 🚀 Fitur Unggulan

### 1. In-Page Floating Overlay (Shadow DOM)
- Widget melayang transparan di pojok kanan atas halaman yang dapat di-*minimize* atau ditutup.
- Menggunakan **Shadow DOM isolated container** sehingga CSS widget tidak bocor dan tidak merusak tampilan website asli.
- Dilengkapi **Live Bandwidth Speed Meter** (kecepatan per-domain dan total halaman).
- Sorting tabel interaktif berdasarkan Domain, IP, Latency, Status Code, Hits, Size, dan BGP/ASN.

### 2. Live Traceroute & BGP AS-Path
- Klik IP mana saja pada tabel untuk membuka modal live traceroute visual.
- Menampilkan hop router, RTT latency tiap hop, dan diagram alur AS-Path transit ISP (`Client ──► Transit ──► Origin`).
- Tombol 1-klik untuk generate perintah MikroTik:
  ```routeros
  /ip firewall address-list add list="LIST_DOMAIN" address=1.2.3.4 comment="AS13335 CLOUDFLARE"
  ```
- Tautan langsung ke Looking Glass dan BGP Hurricane Electric (`bgp.he.net`).

### 3. Link & Asset Grabber
- Buka tab grabber instan dari tombol **LINK GRABBER**.
- Filter kategori aset: Semua, Gambar, Links, Media, Dokumen, Scripts & CSS.
- Fitur *Copy All URLs*, *Export TXT*, dan konversi gambar ke format data Base64 PNG.
- Mode tampilan **List View** dan **Gallery Grid View**.

### 4. In-Page META SEO Diagnostics
- Buka dashboard SEO berdesain modern (Dark/Light mode) dari tombol **META SEO**.
- Skor KPI audit instan: *Passed Checks*, *Warnings*, *Errors*.
- Pratinjau visual media sosial: Kartu Facebook Open Graph dan Twitter/X Card.
- Struktur Outline Headings Tree (H1 hingga H6) dengan validasi hierarki urutan heading.
- Validasi status canonical self-referencing, meta robots (index/noindex), viewport mobile WCAG, dan Schema.org JSON-LD.
- Tombol cetak langsung (*Print to PDF*) dan salin ringkasan ke format Markdown.

---

## 🏗️ Arsitektur & Alur Codingan (Code Flow)

Berikut adalah bagan alur kerja sistem di balik **IPvFooKan**:

```
+-----------------------------------------------------------------------------------+
|                                  TARGET WEBPAGE                                   |
|   +---------------------------------------------------------------------------+   |
|   | Requests: HTML, CSS, JS, Images, APIs, WebSockets...                      |   |
+---+-------------------------------------+-------------------------------------+---+
                                          |
                                          v  (Passive Intercept)
+-----------------------------------------------------------------------------------+
|                        background.js (Extension Service Worker)                   |
| - chrome.webRequest.onResponseStarted / onCompleted                               |
| - Ekstrak: IP Address, IP Version (4/6), HTTP Protocol (H1/H2/H3), Status, Bytes  |
| - id_asn_default.js: Resolusi ASN & Nama ISP/Organisasi secara lokal             |
| - Broadcast data session via chrome.runtime Port                                  |
+-----------------------------------------+-----------------------------------------+
                                          |
                      +-------------------+-------------------+
                      |                                       |
                      v                                       v
+------------------------------------+ +---------------------------------------------+
|    popup.html / popup.js           | |        content.js (In-Page Content Script)  |
| - UI Popup Toolbar Browser         | | - Injeksi Shadow DOM Host                   |
| - Mini table view per tab          | | - Floating Widget & Mini Status Badge       |
| - Tombol ekspor CSV, TXT, SEO,     | | - Speed Meter & Per-domain Traffic Monitor  |
|   dan LINK GRABBER                 | | - Modal Live Traceroute & MikroTik Gen      |
+------------------------------------+ +----------------------+----------------------+
                                                              |
                                  +---------------------------+-----------------------+
                                  |                                                   |
                                  v                                                   v
+---------------------------------------------------+ +-----------------------------------------------+
|             openGrabberInNewTab()                 | |            openSeoInNewTab()                  |
| - Ekstraksi link & DOM assets (img, a, doc, media)| | - Parsing meta tags, OG, Twitter, Schema      |
| - Render tab mandiri via Blob URL                 | | - Render dashboard via seo.html / print.js    |
| - Galeri Grid & konversi Base64                   | | - Diagnostic Scoring, Social Preview, Outline |
+---------------------------------------------------+ +-----------------------------------------------+
```

### Rincian Modul File Utama
| File | Deskripsi / Peran |
| :--- | :--- |
| `src/manifest.json` | Konfigurasi ekstensi Chrome (Manifest V3), permissions, dan resource mappings. |
| `src/background.js` | Service Worker penangkap trafik jaringan pasif via `chrome.webRequest`. |
| `src/content.js` | Content script utama: merender In-Page Shadow DOM widget, live speed counter, traceroute modal, serta pengendali Link Grabber & SEO. |
| `src/id_asn_default.js` | Basis data pemetaan ASN & provider ISP (offline & lokal). |
| `src/bgp_he.js` | Content script pembantu untuk lookup rute BGP. |
| `src/popup.html` & `src/popup.js` | Antarmuka popup default saat ikon ekstensi di-klik pada toolbar. |
| `src/seo.html` & `src/scripts/print.js` | Antarmuka dan engine visualisasi dashboard SEO audit modern. |
| `src/options.html` & `src/options.js` | Halaman pengaturan ekstensi (disediakan untuk rilis mendatang). |

---

## ⚙️ Extension Options

Pada rilis versi **v0.1**, halaman **Extension Options** (`options.html`) sengaja dibuat seringan mungkin (menggunakan konfigurasi bawaan otomatis) agar ekstensi dapat langsung digunakan tanpa setup manual.

Rencana pembaruan untuk menu Options di rilis berikutnya:
- [ ] Pengaturan Looking Glass endpoint kustom (selain HalloNet LG).
- [ ] Opsi kustomisasi daftar blacklist / whitelist domain di floating widget.
- [ ] Pilihan format nama file ekspor otomatis (CSV/TXT).
- [ ] Konfigurasi filter otomatis tipe file pada Link Grabber.

Segala pembaruan terkait fitur Options akan dicatat langsung pada repository GitHub.

---

## 💻 Cara Install Ekstensi (Developer Mode)

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/mm1rza/ipvfoo.git
   ```
2. Buka browser **Google Chrome** atau browser berbasis Chromium (Brave, Edge, Opera).
3. Masuk ke halaman extensions: `chrome://extensions/`.
4. Aktifkan **Developer mode** di pojok kanan atas.
5. Klik tombol **Load unpacked** (Muat yang belum dibongkar).
6. Pilih folder `src` dari direktori repository ini.
7. Ekstensi **IPvFooKan** siap digunakan di semua tab!

---

## 📜 Lisensi & Atribusi Sumber (Credits)

Proyek ini merupakan hasil kompilasi, penyempurnaan, dan modifikasi mandiri dari karya open-source yang luar biasa:

- **IPvFoo**  
  Hak cipta &copy; Paul Marks ([pmarks-net/ipvfoo](https://github.com/pmarks-net/ipvfoo))  
  Dilisensikan di bawah [Apache License 2.0](LICENSE).
- **Link Grabber**  
  Terinspirasi dari open-source link grabber & asset extraction libraries.
- **META SEO Inspector**  
  Terinspirasi dari metadata extraction logic & SEO inspection guidelines.
- **IPvFooKan Modifications**  
  Modifikasi, penyatuan fitur, perbaikan encoding UTF-8, tema visual neon glassmorphism, dan integrasi BGP Traceroute oleh [mm1rza](https://github.com/mm1rza/ipvfoo).

Distribusi modifikasi ini mematuhi ketentuan Apache License 2.0 (menyertakan lisensi asli, mencatat modifikasi file, dan atribusi pengembang asli).
