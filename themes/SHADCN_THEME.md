# Shadcn UI Theme — Cyber Obsidian & Neon Amber
> **Adaptasi Design System COLOR_PALETTE.md ke Kerangka Kerja [ui.shadcn.com](https://ui.shadcn.com)**  
> Kompatibel penuh dengan Tailwind CSS, CSS Variables standard shadcn/ui, dan mendukung tema Dark & Light mode.

---

## 1. Konsep & Filosofi Desain

Tema ini menggabungkan struktur komponen minimalis dan presisi tinggi dari **shadcn/ui** dengan estetika futuristik **Cyber-Obsidian & Neon Amber**:
- **Default Theme (Dark Mode)**: Menggunakan latar belakang *Obsidian Deep* (`#07090D`) yang bertingkat (*layered surfaces*), bukan hitam mati, dipadukan dengan aksen pendar *Cyber Amber* (`#FA9C1B`) dan *Electric Cyan* (`#00EAFF`).
- **Light Mode**: Bersih, sejuk, dan berkontras tinggi (*Clean Slate* `#F5F7FA`) dengan aksen teks dan tombol yang tajam.
- **Micro-interactions & Glow**: Dilengkapi efek ambient glow dan border tipis presisi khas modern dashboard monitoring jaringan.

---

## 2. CSS Variables (`globals.css`)

Berikut adalah token CSS lengkap yang disesuaikan dengan format standar semantic token **shadcn/ui**. Format HSL (`h s% l%`) digunakan agar kompatibel dengan utilitas Tailwind CSS opacity (`bg-primary/20`, `border-border/50`).

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ==========================================================================
     LIGHT MODE (Default :root)
     ========================================================================== */
  :root {
    /* Base Surfaces & Typography */
    --background: 216 33% 97%;          /* #F5F7FA */
    --foreground: 221 39% 11%;          /* #111827 */

    /* Cards & Panels */
    --card: 0 0% 100%;                  /* #FFFFFF */
    --card-foreground: 221 39% 11%;     /* #111827 */

    /* Popover & Modals */
    --popover: 0 0% 100%;               /* #FFFFFF */
    --popover-foreground: 221 39% 11%;  /* #111827 */

    /* Brand Primary (Cyber Amber) */
    --primary: 35 96% 47%;              /* #E0870E (Kontras tajam di light mode) */
    --primary-foreground: 0 0% 100%;    /* #FFFFFF */

    /* Secondary Surfaces */
    --secondary: 213 27% 95%;           /* #EEF2F6 */
    --secondary-foreground: 221 39% 11%;/* #111827 */

    /* Muted Elements & Subtitles */
    --muted: 213 27% 95%;               /* #EEF2F6 */
    --muted-foreground: 220 9% 46%;     /* #6B7280 */

    /* Interactive Hover Accents */
    --accent: 213 27% 92%;              /* #E2E8F0 */
    --accent-foreground: 35 96% 47%;    /* #E0870E */

    /* Status & Feedback */
    --destructive: 0 84% 60%;           /* #EF4444 (Alert Red) */
    --destructive-foreground: 0 0% 100%;

    /* Borders & Inputs */
    --border: 216 12% 84%;              /* rgba(209, 213, 219, 0.8) */
    --input: 220 13% 91%;               /* #E5E7EB */
    --ring: 35 96% 54%;                 /* #FA9C1B */

    /* Radius */
    --radius: 0.5rem;                   /* 8px (shadcn standard) */

    /* Data Visualization / Charts */
    --chart-1: 35 96% 54%;              /* Amber (BGP / Hit) */
    --chart-2: 184 100% 45%;            /* Cyan (Bandwidth / Speed) */
    --chart-3: 150 82% 40%;             /* Green (Online / IPv6) */
    --chart-4: 215 100% 50%;            /* Blue (Latency / TLS) */
    --chart-5: 0 84% 60%;               /* Red (Error / Warnings) */

    /* Custom Cyber Accents */
    --glow-primary: 0 0 25px rgba(250, 156, 27, 0.25);
    --glow-cyan: 0 0 25px rgba(0, 234, 255, 0.2);
  }

  /* ==========================================================================
     DARK MODE (.dark) — Cyber Obsidian & Neon Amber (Default)
     ========================================================================== */
  .dark {
    /* Base Surfaces & Typography (Obsidian Deep) */
    --background: 220 30% 4%;           /* #07090D (Deep Obsidian) */
    --foreground: 0 0% 100%;            /* #FFFFFF */

    /* Cards & Panels (Elevated Obsidian Surfaces) */
    --card: 220 26% 7%;                 /* #0D1016 (Level 1 Surface) */
    --card-foreground: 0 0% 100%;       /* #FFFFFF */

    /* Popovers, Dropdowns, Floating Modals */
    --popover: 220 21% 11%;             /* #161A22 (Level 2 Surface) */
    --popover-foreground: 0 0% 100%;    /* #FFFFFF */

    /* Brand Primary (Cyber Amber) */
    --primary: 35 96% 54%;              /* #FA9C1B */
    --primary-foreground: 220 30% 4%;   /* #07090D (Kontras tinggi gelap di atas amber) */

    /* Secondary Surfaces */
    --secondary: 221 22% 15%;           /* #1D222D (Level 3 Surface) */
    --secondary-foreground: 0 0% 100%;  /* #FFFFFF */

    /* Muted Elements & Subtitles */
    --muted: 220 21% 11%;               /* #161A22 */
    --muted-foreground: 220 16% 65%;    /* #98A1B3 */

    /* Interactive Hover Accents */
    --accent: 221 22% 15%;              /* #1D222D */
    --accent-foreground: 35 96% 54%;    /* #FA9C1B */

    /* Status & Feedback */
    --destructive: 0 86% 59%;           /* #F04242 (Alert Red) */
    --destructive-foreground: 0 0% 100%;

    /* Borders & Inputs */
    --border: 221 20% 18%;              /* rgba(61, 71, 92, 0.35) */
    --input: 221 20% 18%;
    --ring: 35 96% 54%;                 /* #FA9C1B Pendar Amber */

    /* Data Visualization / Charts */
    --chart-1: 35 96% 54%;              /* #FA9C1B Amber */
    --chart-2: 184 100% 50%;            /* #00EAFF Cyan */
    --chart-3: 150 82% 50%;             /* #1AE680 Green */
    --chart-4: 215 100% 55%;            /* #1A79FF Blue */
    --chart-5: 0 86% 59%;               /* #F04242 Red */

    /* Custom Cyber Accents */
    --glow-primary: 0 0 35px rgba(250, 156, 27, 0.35);
    --glow-cyan: 0 0 35px rgba(0, 234, 255, 0.3);
  }
}
```

---

## 3. Konfigurasi `tailwind.config.js`

Konfigurasi ekstensi tema Tailwind CSS untuk menghubungkan CSS variables shadcn di atas:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./components/**/*.{html,js,jsx,ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "#FFB03A",
          dim: "#8F5207",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          cyan: "#00EAFF",
          blue: "#1A79FF",
          green: "#1AE680",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          elevated: "#161A22",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "glow-amber": "var(--glow-primary)",
        "glow-cyan": "var(--glow-cyan)",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 4. Pola Komponen Standar shadcn/ui

Berikut struktur sintaks HTML / React JSX untuk komponen shadcn/ui dengan tema Cyber Obsidian:

### 4.1 Button Variants (`components/ui/button.tsx`)
```html
<!-- Primary (Cyber Amber CTA) -->
<button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow-amber px-4 py-2">
  Mulai Analisis
</button>

<!-- Secondary (Subtle Surface) -->
<button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2">
  Detail Log
</button>

<!-- Outline (Glass Border) -->
<button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-border bg-transparent hover:bg-accent hover:text-accent-foreground px-4 py-2">
  Ekspor CSV
</button>

<!-- Destructive (Alert Red) -->
<button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2">
  Reset Cache
</button>

<!-- Cyber Cyan Glow (Aksen Khusus Traceroute / Portal) -->
<button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 bg-[#00EAFF] text-[#07090D] font-semibold hover:shadow-glow-cyan px-4 py-2">
  Live Traceroute
</button>
```

### 4.2 Card Anatomy (`components/ui/card.tsx`)
```html
<div class="rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:border-primary/40 transition-colors duration-200">
  <div class="flex flex-col space-y-1.5 p-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold leading-none tracking-tight">Realtime Speed</h3>
      <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
        Live
      </span>
    </div>
    <p class="text-sm text-muted-foreground">Monitoring throughput pasif halaman aktif.</p>
  </div>
  <div class="p-6 pt-0">
    <div class="text-3xl font-bold tracking-tight text-foreground">42.8 <span class="text-base font-normal text-muted-foreground">MB/s</span></div>
  </div>
</div>
```

### 4.3 Badge Variants (`components/ui/badge.tsx`)
```html
<!-- Primary Amber Badge -->
<span class="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
  IPv4 + IPv6
</span>

<!-- Cyan Network Badge -->
<span class="inline-flex items-center rounded-md border border-[#00EAFF]/30 bg-[#00EAFF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00EAFF]">
  HTTP/3 QUIC
</span>

<!-- Green Online Badge -->
<span class="inline-flex items-center gap-1.5 rounded-md border border-[#1AE680]/30 bg-[#1AE680]/10 px-2.5 py-0.5 text-xs font-semibold text-[#1AE680]">
  <span class="h-1.5 w-1.5 rounded-full bg-[#1AE680] animate-pulse"></span>
  Connected (TLS 1.3)
</span>
```

### 4.4 Table Anatomy (`components/ui/table.tsx`)
```html
<div class="relative w-full overflow-auto rounded-lg border border-border bg-card">
  <table class="w-full caption-bottom text-sm">
    <thead class="[&_tr]:border-b border-border bg-muted/50">
      <tr class="border-b transition-colors hover:bg-muted/50">
        <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Domain</th>
        <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Server IP</th>
        <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Protocol</th>
        <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Latency</th>
        <th class="h-10 px-4 text-right align-middle font-medium text-muted-foreground">BGP / ASN</th>
      </tr>
    </thead>
    <tbody class="[&_tr:last-child]:border-0">
      <tr class="border-b border-border transition-colors hover:bg-muted/50">
        <td class="p-4 align-middle font-medium text-foreground">cloudflare.com</td>
        <td class="p-4 align-middle font-mono text-xs text-primary">104.16.132.229</td>
        <td class="p-4 align-middle"><span class="px-2 py-0.5 text-xs rounded bg-[#00EAFF]/10 text-[#00EAFF]">H3</span></td>
        <td class="p-4 align-middle font-mono text-xs text-[#1AE680]">8 ms</td>
        <td class="p-4 align-middle text-right font-mono text-xs text-muted-foreground">AS13335</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 5. Ringkasan Pemetaan Token (Cheat Sheet)

| Token shadcn/ui | Nilai Dark Mode (Default) | Nilai Light Mode | Peran di Ekstensi IPvFooKan |
| :--- | :--- | :--- | :--- |
| `--background` | `#07090D` (Obsidian Deep) | `#F5F7FA` | Background body & root widget |
| `--card` | `#0D1016` (Level 1) | `#FFFFFF` | Kontainer tabel & modal popup |
| `--popover` | `#161A22` (Level 2) | `#FFFFFF` | Tooltip ASN & modal traceroute |
| `--primary` | `#FA9C1B` (Cyber Amber) | `#E0870E` | Tombol CTA, highlight IP, link aktif |
| `--primary-foreground`| `#07090D` (Deep Dark) | `#FFFFFF` | Teks di atas tombol primary |
| `--secondary` | `#1D222D` (Level 3 Surface)| `#EEF2F6` | Tombol filter, badge netral |
| `--muted-foreground` | `#98A1B3` (Silver Muted) | `#6B7280` | Subtitle, unit KB/MB, timestamp |
| `--accent` | `#1D222D` | `#E2E8F0` | Row table hover, menu hover |
| `--destructive` | `#F04242` (Alert Red) | `#EF4444` | Indikator TLS insecure / error |
| `--border` | `rgba(61, 71, 92, 0.35)` | `#D1D5DB` | Garis pembatas kartu & baris tabel |
| `--ring` | `#FA9C1B` (Cyber Glow) | `#FA9C1B` | Focus ring saat input/tombol aktif |
| `--chart-1` | `#FA9C1B` (Cyber Amber) | `#E0870E` | Indikator BGP & hits |
| `--chart-2` | `#00EAFF` (Electric Cyan) | `#00EAFF` | Indikator throughput bandwidth |
| `--chart-3` | `#1AE680` (Cyber Green) | `#16A34A` | Status online & IPv6 |
| `--chart-4` | `#1A79FF` (Neon Blue) | `#2563EB` | Port link & traceroute transit |

---

## 6. Standar Template Halaman Ekstensi (Unified Page Architecture)

Untuk menjaga konsistensi antarmuka pengguna lintas modul mandiri (standalone tabs), halaman **Link & Asset Grabber (`src/grabber.html`)** dan **Deep Page & SEO Audit (`src/seo.html`)** mengimplementasikan arsitektur template yang identik mengikuti showcase `themes/theme-preview.html`.

### 6.1 Anatomi Struktur Halaman (Wireframe Hierarki)

Kedua halaman menggunakan hierarki elemen berikut secara seragam:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ 1. STICKY NAVBAR (.header)                                                    │
│    [Logo] IPvFooKan [Badge: Modul]  🌐 https://target.domain/path             │
│    [Action 1: Copy/Export] [Action 2: Format] [Action 3: Print] [🌓 Theme]    │
├───────────────────────────────────────────────────────────────────────────────┤
│ 2. HERO BANNER (.hero)                                                        │
│    [Pill: Design System & Version]                                            │
│    The Asset Grabber / SEO Audit Engine (.text-gradient)                       │
│    Deskripsi fungsi modul...                                                  │
│    ┌─────────────────────────────────────────────────────────────────────┐    │
│    │ [HTTPS] https://target.domain/page                      [📋 Copy URL] │    │
│    └─────────────────────────────────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────────────────────────┤
│ 3. KPI METRICS SCORECARDS GRID (.grid-metrics -> 6 Cards)                     │
│    ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───┐ │
│    │ Metric 1  │ │ Metric 2  │ │ Metric 3  │ │ Metric 4  │ │ Metric 5  │ │...│ │
│    │   128     │ │   42      │ │   95      │ │    1      │ │    3      │ │ 0 │ │
│    │  Label    │ │  Label    │ │  Label    │ │  Label    │ │  Label    │ │   │ │
│    └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───┘ │
├───────────────────────────────────────────────────────────────────────────────┤
│ 4. INTERACTIVE TOOLBAR & FILTER                                               │
│    [Tab 1: All] [Tab 2] [Tab 3] ... (atau Category Chips)                    │
│    [ 🔍 Search Input dengan focus ring amber... ]                             │
│    [☑ Dedup] [☑ Pihak Ke-3]               [List View] [Gallery View]         │
├───────────────────────────────────────────────────────────────────────────────┤
│ 5. MAIN CONTENT AREA (.content-container / .app-layout)                       │
│    ┌─────────────────────────────────────────────────┐ ┌────────────────────┐ │
│    │ Card / List / Table Views                       │ │ Sticky Sidebar     │ │
│    │ (Asset List/Grid atau SEO Section Cards)        │ │ Table of Contents  │ │
│    │                                                 │ │ (Khusus SEO Audit) │ │
│    └─────────────────────────────────────────────────┘ └────────────────────┘ │
├───────────────────────────────────────────────────────────────────────────────┤
│ 6. FOOTER & FLOATING TOAST (.footer & #toast)                                 │
│    Built with shadcn/ui & COLOR_PALETTE.md            Dokumentasi Theme ->    │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Komponen Standar Bersama

#### A. Sticky Navbar (`.header`)
Navbar selalu menempel di posisi atas (`position: sticky; top: 0`) dengan efek latar *glassmorphism blur* (`backdrop-filter: blur(12px)`):
- **Brand Identity**: Logo ekstensi dengan pendar oranye (`.brand-icon`), nama `IPvFooKan`, dan badge nama modul (`.brand-badge`).
- **Target URL Indicator**: Menampilkan URL website yang sedang diperiksa secara real-time (`.source-link`).
- **Mode Toggle Button (`#theme-toggle`)**: Tombol ikon dengan SVG Matahari & Bulan yang secara otomatis menyimpan preferensi ke `localStorage.getItem("msi_theme")` dan menyinkronkan kelas `dark` / `light-theme` pada elemen `<html>` dan `<body>`.

#### B. Hero Section & Target URL Bar
- **Pill Status (`.hero-pill`)**: Mengindikasikan engine ekstensi dan design system.
- **Gradasi Tipografi (`.text-gradient`)**: Judul utama menggunakan gradasi linear tajam dari teks kontras ke Cyber Amber (`#FA9C1B`).
- **URL Bar Container (`.url-bar-container`)**:
  Menyajikan protokol target (`HTTPS`/`HTTP` via `.protocol-tag`), tautan aktif target (`.target-url-link`), serta tombol aksi cepat penyalinan URL (`#btn-copy-url`).

#### C. Grid Metrik KPI (6-Card Overview)
Kedua halaman menggunakan `.grid-metrics` berkolom 6 dengan kartu `.card` berlatar belakang elevasi Obsidian (`#0D1016`):
- **Link Grabber**:
  1. `Total Aset`: Jumlah keseluruhan link, image, media, dokumen, dan script.
  2. `Gambar`: Berkas format JPG, PNG, WebP, SVG, ICO, Base64.
  3. `Hyperlinks`: Semua tautan anchor `<a href>`.
  4. `Media`: Berkas audio dan video HTML5.
  5. `Dokumen`: Berkas PDF, DOCX, ZIP, dan unduhan dokumen lainnya.
  6. `Scripts & CSS`: Berkas JavaScript eksternal dan Stylesheet CSS.
- **Deep SEO Audit**:
  1. `Passed Checks`: Diagnostik kesehatan lolos validasi.
  2. `Warnings`: Item audit yang memerlukan perhatian.
  3. `Critical Errors`: Kegagalan teknis SEO mayor (misal tidak ada H1, canonical salah).
  4. `H1 Headings`: Jumlah outline judul H1.
  5. `JSON-LD Schemas`: Jumlah objek structured data terdeteksi.
  6. `Total Links`: Statistik keseluruhan anchor internal dan eksternal.

#### D. Toolbar & Tabs Kontrol
- **Shadcn UI Tabs (`.tabs-list`, `.tab-btn` / `.tab-trigger`)**:
  Tab kategori horizontal dengan indikator angka aset berbentuk kapsul (`.tab-badge`).
- **Search Input (`.search-input`)**:
  Pencarian instan dengan ikon kaca pembesar dan focus ring aksen pendar oranye (`--ring`).
- **View Mode Switcher (`.view-toggle`, `.view-btn`)**:
  Pilihan tampilan daftar tabel rinci (*List View*) atau galeri visual (*Gallery View*).

---

### 6.3 Ringkasan File Implementasi

| File Halaman | Peran | Komponen Kunci |
| :--- | :--- | :--- |
| `src/grabber.html` | Content & Link Asset Grabber | Sticky Navbar, Hero URL Bar, KPI 6-Grid, Shadcn Tabs, List View, Gallery Grid, Toast |
| `src/scripts/grabber.js` | Controller Asset Grabber | Sinkronisasi KPI realtime, filter dedup/diff-origin, Base64 converter, Export TXT, Light/Dark toggle |
| `src/seo.html` | Deep Page & Technical SEO Audit | Sticky Navbar, Hero URL Bar, KPI 6-Grid, Section Filter Chips, Social Cards Preview, Headings Tree, Sticky Sidebar, JSON-LD Code block, Toast |
| `src/scripts/seo.js` | Controller SEO Audit | KPI scorecards calculation, copy markdown summary, export JSON, print layout, real-time query filter, Light/Dark toggle |
| `src/theme.css` | Sentralisasi Master Tokens & Components | Definisi token HSL/HEX `:root` & `.dark`, font import Plus Jakarta Sans & JetBrains Mono, layout utilitas |
| `themes/theme-preview.html` | Showcase & Sandbox Komponen | Preview interaktif lengkap semua ragam komponen shadcn/ui dan visualisasi warna |
