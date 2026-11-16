# 🔄 Upstream Tracking & Changelog (IPvFoo Asli vs IPvFooKan)

Repositori ini adalah fork kustom lanjutan dari repositori resmi [pmarks-net/ipvfoo](https://github.com/pmarks-net/ipvfoo). Dokumen ini mencatat riwayat pembaruan dari repositori utama dan panduan cepat untuk menyelaraskan (*sync*) jika di masa depan ada update baru dari upstream.

---

## 📊 Tabel Sinkronisasi Upstream

| Versi Upstream | Commit Upstream | Ringkasan Perubahan Upstream | Status di Fork Ini | Keterangan & Tindakan di Fork |
| :---: | :---: | :--- | :---: | :--- |
| **v2.36** | `64045bb` | Update `homepage_url` ke `pmarks.net/ipvfoo` | ⚪ Diabaikan (Skip) | Fork mempertahankan metadata & repositori sendiri (`mm1rza/ipvfoo`). |
| **v2.35** | `9d48479` | **Urgent Fix:** Chrome modern mendefinisikan objek `browser` secara global | 🟢 **Diadaptasi** | Mengganti `typeof browser == "undefined"` dengan `const IS_CHROMIUM = !!chrome.runtime.getManifest().background.service_worker;` pada `src/background.js` dan `src/popup.js` untuk mencegah bug cache memori & scrollbar hack di Chromium. |
| **v2.34** | `91cb64d` | Single-click untuk seleksi NAT64 IPv4 suffix | 🟢 **Tercakup** | Menjadi commit dasar (*merge-base*) fitur NAT64 di popup. |
| **v2.33** | `11e17fa` | Pembaruan font (Roboto Medium) | 🟢 **Tercakup** | Telah terintegrasi pada base UI popup. |
| **v2.32** | `e903bbc` | Menampilkan label H1/H2/H3 pengganti lock icon di Firefox | 🟢 **Tercakup** | Modifikasi TLS/HTTP protocol indicator. |

---

## 🛠️ Panduan Cepat Menyelaraskan (*Sync*) Update Masa Depan

Jika upstream merilis pembaruan baru di kemudian hari, jalankan langkah-langkah praktis berikut:

### 1. Ambil commit terbaru dari upstream
```bash
git fetch upstream
```

### 2. Cek commit baru apa saja yang ada di upstream tetapi belum ada di fork
```bash
git log --graph --oneline master..upstream/master
```

### 3. Intip isi detail perubahannya
```bash
git show <COMMIT_HASH>
# Contoh: git show 9d48479
```

---

## 📁 Pemetaan File Saat Melakukan Porting

| Kategori | File | Catatan Penanganan |
| :--- | :--- | :--- |
| **Core IPvFoo Engine** | `src/background.js`<br>`src/popup.js` & `popup.html`<br>`src/iputil.js`<br>`src/common.js` | **Porting Selektif**: Bandingkan perubahan dengan teliti jika ada bugfix protokol jaringan, manifest, atau kompatibilitas browser baru. |
| **Modul Khusus Fork Anda** | `src/content.js`<br>`src/bgp_he.js`<br>`src/grabber.html` & `scripts/grabber.js`<br>`src/seo.html` & `scripts/seo*.js`<br>`src/theme.css` & `THEMES*`<br>`src/id_asn_default.js` | **Jangan Ditimpa**: Ini adalah modul kustom fitur In-Page Shadow DOM widget, live speed meter, BGP visualizer, Asset Grabber, dan SEO diagnostics. |
