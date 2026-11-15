# IPvFooKan (v0.1)

> **All-in-One In-Page Network Analyzer, BGP AS-Path Lookup & Prefix Extractor, Link & Asset Grabber, and Deep META SEO Diagnostics.**  
> *Self-modified and unified extension for Google Chrome & Chromium browsers.*  
> **Repository:** [https://github.com/mm1rza/ipvfoo](https://github.com/mm1rza/ipvfoo)

---

## 📌 Sekilas Tentang IPvFooKan

**IPvFooKan** adalah evolusi dan penggabungan mandiri dari serangkaian utilitas analisis web, inspeksi jaringan, dan audit SEO yang disatukan ke dalam satu ekstensi browser yang ringan, responsif, dan modular:

1. **IPvFoo Core Engine** — Memantau alamat IP server asli setiap domain di halaman aktif secara *real-time* (IPv4, IPv6, HTTP/1.1, HTTP/2, HTTP/3 QUIC, WebSocket, TLS), indikator latency response, status code, hit count, dan akumulasi size data.
2. **BGP AS-Path Visualizer & Prefix Extractor** — Modal visualisasi rute transit BGP global, announced route prefix, origin ASN, serta integrasi otomatis script generator di `bgp.he.net` untuk MikroTik RouterOS v7 dan Juniper Junos.
3. **Link & Asset Grabber** — Ekstraktor aset lengkap (Link, Gambar, Dokumen, Media, Scripts & CSS) dengan master tema **shadcn/ui (Cyber Obsidian)**, filter chips instan, search bar, mode List & Gallery Grid View, konversi Base64, serta ekspor teks.
4. **Deep META SEO Diagnostics** — Laporan audit SEO halaman mendalam (Common Meta, Social Open Graph & Twitter/X Cards Preview, hierarki heading tree H1–H6, Schema.org JSON-LD structured data, status canonical & robots, diagnostic KPI scoring, serta salin ringkasan Markdown).

Semua data jaringan ditangkap secara pasif dan privat menggunakan API `webRequest` browser tanpa membuat trafik DNS/network tambahan yang tidak perlu.

---

## 🚀 Fitur Unggulan

### 1. In-Page Floating Overlay (Shadow DOM)
- Widget melayang semi-transparan di pojok kanan atas halaman yang dapat di-*minimize* atau ditutup.
- Menggunakan **Shadow DOM isolated container** sehingga CSS widget tidak bocor dan tidak merusak tata letak maupun tampilan website asli.
- Dilengkapi **Live Bandwidth Speed Meter** untuk memantau kecepatan transfer data (per-domain dan total halaman).
- Sorting tabel interaktif berdasarkan Domain, IP, Latency, Status Code, Hits, Size, dan BGP/ASN.
- Tombol akses cepat ke tab **META SEO** dan **LINK GRABBER**.

### 2. BGP AS-Path Visualizer & Helper Script (bgp.he.net)
- **In-Page AS-Path Route Lookup**: Klik IP mana saja pada tabel widget untuk membuka modal diagram visual alur rute BGP transit (`Global Ingress ──► Transit AS ──► Origin AS`).
- Menampilkan Target Host & IP, BGP Announced Prefix, Origin ASN, nama organisasi/ISP, dan jalur AS global.
- Tombol 1-klik untuk generate perintah MikroTik Address-List langsung dari modal:
  ```routeros
  /ip firewall address-list add list="LIST_DOMAIN" address=1.2.3.4/24 comment="AS13335 CLOUDFLARE"
  ```
- **Integrasi Otomatis BGP Hurricane Electric (`bgp_he.js`)**:  
  Saat membuka halaman AS di `https://bgp.he.net/*`, helper box otomatis menyediakan tombol generator:
  - `📋 Copy CIDR` — Salin seluruh daftar IPv4 prefix (CIDR).
  - `📋 Copy Address List` — Salin script konfigurasi `/ip firewall address-list` MikroTik.
  - `📋 Copy Ip Route` — Salin script penambahan routing `/ip route` MikroTik.
  - `📋 Copy BGP LP MikroTik (v7)` — Salin routing filter rule RouterOS v7 untuk Local-Preference / BGP Weight.
  - `📋 Copy BGP LP Juniper` — Salin policy-options AS-Path dan Local-Preference Junos.
  - `📋 Copy BGP Block IP Juniper` — Salin policy-statement route-filter exact Junos untuk reject IP prefix ASN target.
  - Standarisasi otomatis header `# AS Info: ...` dan footer `# Total IPv4 Prefix: ...` pada seluruh format output.
  - Certs/Search Auto-Rewriter yang otomatis mengarahkan link sertifikat/query langsung ke website target di tab baru.

### 3. Link & Asset Grabber
- Buka tab grabber instan dari tombol **LINK GRABBER** pada floating widget.
- Dibangun dengan master tema **shadcn/ui (Cyber Obsidian)** berbasis CSS Variables `:root`.
- Filter cepat berbasis Chips: Semua, Gambar, Links, Media, Dokumen, Scripts & CSS (lengkap dengan badge counter per kategori).
- Search input instan untuk memfilter URL, ekstensi file, atau nama berkas secara real-time.
- Opsi cerdas: *Hapus Duplikat*, *Hanya Domain Pihak Ke-3*, dan *Kelompokkan per Tipe*.
- Dual Mode Tampilan:
  - **List View**: Tampilan tabel rinci dengan resolusi dimensi gambar dan tombol konversi Base64.
  - **Gallery Grid View**: Tampilan galeri kartu visual thumbnail gambar.
- Aksi praktis: `📋 Copy URLs` (salin semua URL terfilter ke clipboard) dan `📥 Export TXT`.

### 4. Deep META SEO Diagnostics
- Buka dashboard audit SEO komprehensif dari tombol **META SEO** pada widget.
- Antarmuka modern dan responsif dengan dukungan tema Dark Mode dan Light Mode.
- Indikator skor KPI audit instan: *Passed Checks*, *Warnings*, dan *Errors*.
- **Social Media Previews**: Pratinjau visual kartu postingan Facebook Open Graph dan Twitter/X Card.
- **Headings Outline Tree**: Visualisasi pohon hierarki H1 hingga H6 dengan validasi otomatis terhadap level heading yang terlewat atau tidak teratur.
- **Inspeksi Lengkap**:
  - *Common Meta*: Title, meta description, charset, viewport, author, keywords.
  - *Social Tags*: Open Graph (og:title, og:image, og:description) dan Twitter Cards.
  - *Structured Data*: Parsing dan validasi sintaks Schema.org JSON-LD.
  - *Headings & Links*: Statistik tautan internal vs eksternal, nofollow, dan canonical self-referencing.
  - *Security & Directives*: Status meta robots (index/noindex, follow/nofollow), X-Frame-Options, dan HTTPS/TLS.
- Tombol `📋 Copy Summary` untuk mengekspor ringkasan audit langsung ke format Markdown.

---

## 📁 Struktur Direktori & Modul File

```text
ipvfoo/
├── LICENSE                    # Apache License 2.0
├── Makefile                   # Multi-browser build script (Chrome / Firefox)
├── README.md                  # Dokumentasi & panduan teknis terpadu
├── THEMES.md                  # Master Design System (shadcn/ui Cyber Obsidian)
├── THEMES-PREVIEW.html        # Interactive UI Showcase & Component Sandbox
└── src/
    ├── _locales/              # Lokalisasi bahasa (en)
    │   └── en/messages.json
    ├── icons/                 # Direktori ikon & status badge ekstensi
    │   ├── badges/            # Badge dinamis IPv4/IPv6 untuk status bar
    │   ├── icon16.png
    │   ├── icon16_transparent.png
    │   ├── icon128.png
    │   └── *.png              # UI assets & icon set
    ├── manifest/              # Manifest alternatif spesifik browser
    │   ├── chrome-manifest.json
    │   └── firefox-manifest.json
    ├── scripts/               # Engine ekstraktor metadata & audit SEO
    │   ├── defines.js         # Dictionary data & konstanta SEO
    │   ├── extractors.js      # Parser metadata & DOM tags
    │   ├── extractors3.js     # Parser visual & outline headings
    │   ├── grabber.js         # Controller visual Link Grabber (grabber.html)
    │   ├── seo-extractor.js   # Content script parser DOM halaman aktif
    │   ├── seo.js             # Controller visual dashboard SEO (seo.html)
    │   ├── service.js         # Service helper & download generator
    │   └── url2service.js     # URL categorization service
    ├── background.js          # Service Worker: pemantau pasif webRequest
    ├── bgp_he.js              # Content script helper di https://bgp.he.net/*
    ├── common.js              # Utilitas bersama & badge resolver
    ├── content.js             # In-Page Shadow DOM widget, live speed counter, & AS-Path modal
    ├── detectdarkmode.html    # Offscreen Dark Mode detector
    ├── detectdarkmode.js
    ├── grabber.html           # Halaman Link & Asset Grabber mandiri
    ├── id_asn_default.js      # Basis data offline pemetaan ASN & nama ISP
    ├── iputil.js              # Utilitas parsing & validasi IPv4/IPv6
    ├── manifest.json          # Master Manifest V3
    ├── options.html           # Pengaturan ekstensi
    ├── options.js
    ├── popup.html             # Antarmuka popup toolbar browser
    ├── popup.js
    ├── seo.html               # Halaman dashboard audit META SEO modern
    └── theme.css              # Master Design Tokens :root (shadcn/ui Cyber Obsidian)
```

| File / Folder | Deskripsi / Peran |
| :--- | :--- |
| `src/manifest.json` | Konfigurasi utama ekstensi (Manifest V3), permissions, dan resource declaration. |
| `src/content.js` | Content script utama: merender In-Page Shadow DOM widget, live speed meter, BGP AS-Path lookup modal, serta trigger Link Grabber & SEO. |
| `src/bgp_he.js` | Helper otomatis di `bgp.he.net` untuk ekstraksi CIDR, script MikroTik (v7), dan Juniper BGP policies. |
| `src/grabber.html` & `src/scripts/grabber.js` | Halaman tab mandiri Link & Asset Grabber berbasis UI shadcn Cyber Obsidian. |
| `src/seo.html` & `src/scripts/seo.js` | Antarmuka dan visualisasi dashboard audit META SEO modern. |
| `src/theme.css` | Sentralisasi variabel skema warna `:root` & `.dark` berbasis shadcn/ui. |
| `src/background.js` | Service Worker penangkap trafik jaringan pasif via `chrome.webRequest`. |
| `src/id_asn_default.js` | Basis data pemetaan ASN & provider ISP secara lokal dan offline. |
| `src/popup.html` & `src/popup.js` | Antarmuka popup default saat ikon ekstensi diklik pada toolbar browser. |
| `THEMES.md` & `THEMES-PREVIEW.html` | Dokumentasi Master Design System shadcn/ui Cyber Obsidian dan halaman showcase interaktif. |
| `src/scripts/seo-extractor.js` | Script injeksi untuk ekstraksi metadata DOM, JSON-LD, headings, dan link. |
| `src/icons/` & `src/icons/badges/` | Aset ikon resolusi tinggi dan badge status bar dinamis IPv4/IPv6. |
| `src/options.html` & `src/options.js` | Halaman opsi dan preferensi ekstensi. |

---

## ⚙️ Extension Options

Pada rilis versi **v0.1**, halaman **Extension Options** (`options.html`) menggunakan konfigurasi standar bawaan otomatis agar ekstensi dapat langsung digunakan secara instan tanpa konfigurasi manual yang rumit.

Rencana fitur untuk pembaruan berikutnya:
- [ ] Pengaturan endpoint kustom untuk Looking Glass / BGP lookup.
- [ ] Opsi kustomisasi daftar domain yang diabaikan (*ignored domains*) pada floating widget.
- [ ] Opsi penyesuaian template skrip ekspor MikroTik & Juniper.
- [ ] Konfigurasi default filter tipe berkas pada Link Grabber.

---

## 💻 Cara Install Ekstensi (Developer Mode)

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/mm1rza/ipvfoo.git
   ```
2. Buka browser **Google Chrome** atau browser berbasis Chromium lainnya (Edge, Brave, Opera, Vivaldi).
3. Buka halaman ekstensi: `chrome://extensions/`.
4. Aktifkan tombol **Developer mode** di pojok kanan atas.
5. Klik tombol **Load unpacked** (Muat yang belum dibongkar).
6. Pilih direktori folder `src` dari repositori ini.
7. Ekstensi **IPvFooKan** langsung aktif dan siap digunakan di seluruh tab website!

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
  Modifikasi, penyatuan fitur, standarisasi tema visual shadcn/ui Cyber Obsidian, BGP AS-Path visualizer, dan script generator MikroTik/Juniper oleh [mm1rza](https://github.com/mm1rza/ipvfoo).

Distribusi modifikasi ini sepenuhnya mematuhi ketentuan Apache License 2.0 (menyertakan lisensi asli, mencatat modifikasi file, dan atribusi pengembang asli).
