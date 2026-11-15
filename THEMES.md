# IPvFooKan — Themes & Design System Documentation

Dokumentasi lengkap sistem tema dan panduan desain untuk ekstensi **IPvFooKan** dapat ditemukan pada berkas berikut:

- 📖 **Dokumentasi Lengkap Desain & Komponen**: [themes/SHADCN_THEME.md](themes/SHADCN_THEME.md)
- 🎨 **Live Interactive Showcase & Preview**: [themes/theme-preview.html](themes/theme-preview.html)
- 💅 **Central Design Tokens & CSS Classes**: [src/theme.css](src/theme.css)

---

## Ringkasan Standar Template Halaman Ekstensi (Unified Page Architecture)

Halaman **Link & Asset Grabber (`src/grabber.html`)** dan **Deep Page & SEO Audit (`src/seo.html`)** telah diselaraskan 100% menggunakan arsitektur template yang identik mengikuti showcase `themes/theme-preview.html`:

1. **Sticky Header Navbar (`.header`)**:
   - Brand logo gradient (`.brand-icon`), nama `IPvFooKan`, badge nama modul (`.brand-badge`).
   - Indikator target website real-time (`.source-link`).
   - Quick Action buttons (`.btn-primary`, `.btn-secondary`, `.btn-cyan`).
   - Dark & Light mode toggle (`#theme-toggle`) dengan SVG Sun/Moon yang tersimpan di `localStorage` (`msi_theme`).
2. **Hero Banner Section (`.hero`)**:
   - Subtitle pill (`.hero-pill`), judul dengan gradasi amber (`.text-gradient`), dan deskripsi.
   - Target URL bar (`.url-bar-container`) dengan badge protokol HTTPS/HTTP dan tombol `📋 Copy URL`.
3. **KPI Metrics Grid (6-Card Overview)**:
   - Kolom 6 metrik responsif berlatar Obsidian Elevated (`.grid-metrics`, `.card`) dengan nilai monospace `JetBrains Mono` dan indikator trend status.
4. **Interactive Toolbar & Filter System**:
   - Tab switching shadcn/ui (`.tabs-list`, `.tab-btn`), filter chips (`.chip-btn`), dan search input (`.search-input`).
5. **Content Area**:
   - Kartu modular berbingkai presisi (`.card`, `section.seo-card`, `.table-wrapper`).
6. **Footer & Toast**:
   - Standar footer dan toast notifikasi interaktif.

Silakan baca [themes/SHADCN_THEME.md](themes/SHADCN_THEME.md) untuk rincian token semantic HSL/HEX, konfigurasi Tailwind CSS, serta pola komponen React/HTML.
