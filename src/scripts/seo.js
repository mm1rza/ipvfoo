// IPvFooKan - Modern Interactive SEO Report Renderer
(function () {
  "use strict";

  let CURRENT_PAGE = {};
  let CURRENT_SEO = null;

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(msg) {
    const t = document.getElementById("toast-notification");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  function copyText(text, label = "Teks") {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast("✅ " + label + " disalin ke clipboard!");
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("✅ " + label + " disalin ke clipboard!");
    });
  }

  // Sample fallback data if opened directly without prior audit
  const SAMPLE_DATA = {
    url: window.location.href || "https://example.com/demo",
    hostname: window.location.hostname || "example.com",
    protocol: window.location.protocol || "https:",
    generatedAt: new Date().toLocaleString(),
    doctype: "<!DOCTYPE html>",
    lang: "id",
    charset: "UTF-8",
    title: "Demo Website — Internet & Digital Solutions",
    titleLength: 43,
    description: "Layanan konektivitas internet fiber optik dan solusi transformasi digital berkecepatan tinggi untuk bisnis, UMKM, dan perumahan.",
    descriptionLength: 130,
    canonical: "https://example.com/demo",
    robots: "index, follow",
    keywords: "internet, broadband, fiber optik, wifi, isp",
    author: "Webmaster",
    themeColor: "#0284c7",
    viewport: "width=device-width, initial-scale=1.0",
    og: [
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://example.com/demo" },
      { property: "og:title", content: "Demo Website — Internet & Digital Solutions" },
      { property: "og:description", content: "Layanan konektivitas internet fiber optik dan solusi transformasi digital berkecepatan tinggi." },
      { property: "og:site_name", content: "DemoISP" },
      { property: "og:image", content: "icons/icon128.png" }
    ],
    twitter: [
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Demo Website — Internet & Digital Solutions" },
      { name: "twitter:description", content: "Layanan konektivitas internet fiber optik dan solusi transformasi digital berkecepatan tinggi." },
      { name: "twitter:image", content: "icons/icon128.png" }
    ],
    jsonLd: [
      {
        index: 1,
        types: "Organization, InternetServiceProvider",
        raw: "{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Organization\",\n  \"name\": \"DemoISP\",\n  \"url\": \"https://example.com/demo\"\n}",
        parsed: {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "DemoISP",
          "url": "https://example.com/demo"
        }
      }
    ],
    headings: [
      { tag: "H1", level: 1, text: "Konektivitas Cepat & Andal untuk Indonesia", length: 42, isSkip: false, isHidden: false },
      { tag: "H2", level: 2, text: "Paket Internet Fiber Rumah", length: 26, isSkip: false, isHidden: false },
      { tag: "H3", level: 3, text: "Kecepatan Simetris 1:1 Download & Upload", length: 40, isSkip: false, isHidden: false },
      { tag: "H2", level: 2, text: "Solusi Korporasi & Dedicated Bandwidth", length: 38, isSkip: false, isHidden: false },
      { tag: "H2", level: 2, text: "Hubungi Layanan Pelanggan 24/7", length: 30, isSkip: false, isHidden: false }
    ],
    headingCounts: { h1: 1, h2: 3, h3: 1, h4: 0, h5: 0, h6: 0 },
    forms: [
      { index: 1, action: "https://example.com/contact", method: "POST", fields: 4 }
    ],
    html5: { isHtml5: true, hasHtml5Tags: true },
    linksStats: { total: 38, internal: 29, external: 9, nofollow: 0, blankNoOpener: 0, empty: 0 },
    resourceHints: [
      { rel: "preconnect", as: "-", href: "https://fonts.googleapis.com", crossorigin: "" },
      { rel: "preconnect", as: "-", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
      { rel: "preload", as: "style", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap", crossorigin: "" }
    ],
    externalDomains: [
      { hostname: "fonts.googleapis.com", category: "Web Fonts", count: 2, types: "link" },
      { hostname: "fonts.gstatic.com", category: "Web Fonts", count: 1, types: "link" },
      { hostname: "www.googletagmanager.com", category: "Analytics", count: 1, types: "script" }
    ],
    security: { isHttps: true, csp: null, referrerPolicy: "strict-origin-when-cross-origin" },
    diagnostics: [
      { level: "good", category: "Title", message: "Panjang title optimal (43 karakter)." },
      { level: "good", category: "Description", message: "Panjang meta description optimal (130 karakter)." },
      { level: "good", category: "Canonical", message: "Canonical tag terpasang self-referential." },
      { level: "good", category: "Headings", message: "Struktur H1 tepat (terdapat 1 tag H1 utama)." },
      { level: "good", category: "Mobile", message: "Viewport terkonfigurasi dengan baik (responsive)." },
      { level: "good", category: "Social", message: "Meta Open Graph terpasang (og:title dan og:image tersedia)." },
      { level: "good", category: "Structured Data", message: "Ditemukan 1 skema JSON-LD Schema.org." },
      { level: "warning", category: "Keywords", message: "Meta keywords terdeteksi (sudah diabaikan oleh algoritma Google)." }
    ]
  };

  function renderReport(page, sections, lastSeoData) {
    const data = lastSeoData || SAMPLE_DATA;
    CURRENT_PAGE = page || { url: data.url, hostname: data.hostname };
    CURRENT_SEO = data;

    const sourceUrl = (page && page.url) || data.url || window.location.href;
    const sourceHost = (page && (page.hostname || (new URL(sourceUrl)).hostname)) || data.hostname || "Page";

    document.title = "IPvFooKan SEO Audit — " + sourceHost;

    // Header URL Box
    const targetLink = document.getElementById("target-url-link");
    if (targetLink) {
      targetLink.href = sourceUrl;
      targetLink.textContent = sourceUrl;
    }


    const badgeProto = document.getElementById("badge-protocol");
    if (badgeProto) {
      badgeProto.textContent = sourceUrl.startsWith("https") ? "HTTPS" : "HTTP";
      if (!sourceUrl.startsWith("https")) {
        badgeProto.style.background = "rgba(239, 68, 68, 0.15)";
        badgeProto.style.color = "var(--accent-rose)";
      }
    }

    // KPI Scorecards
    const diagnostics = data.diagnostics || [];
    const goodCount = diagnostics.filter(d => d.level === "good").length;
    const warnCount = diagnostics.filter(d => d.level === "warning").length;
    const errCount = diagnostics.filter(d => d.level === "error").length;
    const headingCounts = data.headingCounts || { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    const schemas = data.jsonLd || [];
    const lStats = data.linksStats || { total: 0, internal: 0, external: 0, nofollow: 0, blankNoOpener: 0, empty: 0 };

    const setKpi = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setKpi("kpi-good", goodCount);
    setKpi("kpi-warn", warnCount);
    setKpi("kpi-err", errCount);
    setKpi("kpi-h1", headingCounts.h1 || 0);
    setKpi("kpi-schema", schemas.length);
    setKpi("kpi-links", lStats.total);

    // 1. Diagnostics Section
    const diagContainer = document.getElementById("diagnostics-container");
    if (diagContainer) {
      document.getElementById("badge-diag-count").textContent = diagnostics.length + " checks";
      const navBadge = document.getElementById("nav-badge-diag");
      if (navBadge) navBadge.textContent = diagnostics.length;

      let dHtml = '<div style="display:flex; flex-direction:column; gap:8px;">';
      diagnostics.forEach(diag => {
        let pillClass = "alert-good";
        let icon = "✅ PASS";
        if (diag.level === "warning") { pillClass = "alert-warn"; icon = "⚠️ WARNING"; }
        if (diag.level === "error")   { pillClass = "alert-err";  icon = "⛔ ERROR"; }
        if (diag.level === "info")    { pillClass = "alert-info"; icon = "ℹ️ INFO"; }

        dHtml += `
          <div class="ad_seo_item" style="padding:6px 0;">
            <div class="attr_name" style="width:130px; min-width:130px;">
              <span class="alert-pill ${pillClass}">${icon}</span>
            </div>
            <div class="content">
              <strong style="color:var(--text-main); font-size:12px; margin-right:6px;">[${escapeHtml(diag.category)}]</strong>
              <span>${escapeHtml(diag.message)}</span>
            </div>
          </div>
        `;
      });
      dHtml += '</div>';
      diagContainer.innerHTML = dHtml;
    }

    // 2. Common & Core Meta
    const commonContainer = document.getElementById("common-container");
    if (commonContainer) {
      const commonRows = [
        { key: "doctype", val: data.doctype ? escapeHtml(data.doctype) : "<em>None</em>", count: null },
        { key: "html lang", val: data.lang ? escapeHtml(data.lang) : "<em>Not specified</em>", count: null },
        { key: "charset", val: escapeHtml(data.charset || "UTF-8"), count: null },
        { key: "head title", val: data.title ? escapeHtml(data.title) : "<em>(Missing Title)</em>", count: (data.titleLength || 0) + " characters" },
        { key: "meta description", val: data.description ? escapeHtml(data.description) : "<em>(Missing Description)</em>", count: (data.descriptionLength || 0) + " characters" },
        { key: "canonical link", val: data.canonical ? (`<a href="${escapeHtml(data.canonical)}" target="_blank" class="attr_link">${escapeHtml(data.canonical)}</a>`) : "<em>Not defined</em>", count: null },
        { key: "meta keywords", val: data.keywords ? (`${escapeHtml(data.keywords)} <span class="alert-pill alert-info">INFO: Obsolete for Google</span>`) : "<em>None</em>", count: null },
        { key: "meta robots", val: data.robots ? escapeHtml(data.robots) : "<em>None (index, follow assumed)</em>", count: null },
        { key: "author", val: data.author ? escapeHtml(data.author) : "<em>None</em>", count: null },
        { key: "generator", val: data.generator ? escapeHtml(data.generator) : "<em>None</em>", count: null },
        { key: "theme-color", val: data.themeColor ? (`<span style="display:inline-block; width:12px; height:12px; background:${escapeHtml(data.themeColor)}; border-radius:3px; vertical-align:middle; margin-right:4px;"></span> ${escapeHtml(data.themeColor)}`) : "<em>None</em>", count: null }
      ];

      let cHtml = "";
      commonRows.forEach(r => {
        cHtml += `
          <div class="ad_seo_item">
            <div class="attr_name">${escapeHtml(r.key)}</div>
            <div class="content">
              <span>${r.val}</span>
              ${r.count ? `<span class="item_count">(${escapeHtml(r.count)})</span>` : ""}
              <button class="copy-btn" data-copy="${escapeHtml(String(r.val).replace(/<[^>]*>/g, ''))}" data-label="${escapeHtml(r.key)}">Copy</button>
            </div>
          </div>
        `;
      });
      commonContainer.innerHTML = cHtml;
    }

    // 3. Mobile & Viewport
    const mobileContainer = document.getElementById("mobile-container");
    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <div class="ad_seo_item">
          <div class="attr_name">viewport</div>
          <div class="content">
            <code>${escapeHtml(data.viewport || "Missing meta viewport")}</code>
            <button class="copy-btn" data-copy="${escapeHtml(data.viewport || '')}" data-label="Viewport">Copy</button>
          </div>
        </div>
      `;
    }

    // 4. Social (Open Graph & Twitter)
    const ogList = data.og || [];
    const twList = data.twitter || [];
    const findOg = (prop) => (ogList.find(o => o.property && o.property.toLowerCase() === prop.toLowerCase()) || {}).content || "";
    const findTw = (name) => (twList.find(t => t.name && t.name.toLowerCase() === name.toLowerCase()) || {}).content || "";

    const ogTitle = findOg("og:title") || data.title || "";
    const ogDesc  = findOg("og:description") || data.description || "";
    const ogImage = findOg("og:image");
    const ogSite  = findOg("og:site_name") || sourceHost;

    const twTitle = findTw("twitter:title") || ogTitle;
    const twDesc  = findTw("twitter:description") || ogDesc;
    const twImage = findTw("twitter:image") || ogImage;

    const previewsContainer = document.getElementById("social-previews-container");
    if (previewsContainer) {
      previewsContainer.innerHTML = `
        <div class="preview-card-box">
          <div class="preview-card-top">
            <span>🌐</span> Facebook / Open Graph Preview
          </div>
          <div class="preview-img-frame">
            ${ogImage ? `<img src="${escapeHtml(ogImage)}" alt="OG Image" onerror="this.onerror=null; this.parentNode.innerHTML='<span class=preview-no-img-text>Gambar Gagal Dimuat</span>';">` : `<span class="preview-no-img-text">Tidak ada og:image</span>`}
          </div>
          <div class="preview-content-body">
            <div class="preview-domain-name">${escapeHtml(ogSite)}</div>
            <div class="preview-post-title">${escapeHtml(ogTitle || "Judul Halaman")}</div>
            <div class="preview-post-desc">${escapeHtml(ogDesc || "Deskripsi halaman")}</div>
          </div>
        </div>

        <div class="preview-card-box">
          <div class="preview-card-top">
            <span>🐦</span> Twitter / X Card Preview
          </div>
          <div class="preview-img-frame">
            ${twImage ? `<img src="${escapeHtml(twImage)}" alt="Twitter Image" onerror="this.onerror=null; this.parentNode.innerHTML='<span class=preview-no-img-text>Gambar Gagal Dimuat</span>';">` : `<span class="preview-no-img-text">Tidak ada twitter:image</span>`}
          </div>
          <div class="preview-content-body">
            <div class="preview-domain-name">${escapeHtml(sourceHost)}</div>
            <div class="preview-post-title">${escapeHtml(twTitle || "Judul Halaman")}</div>
            <div class="preview-post-desc">${escapeHtml(twDesc || "Deskripsi halaman")}</div>
          </div>
        </div>
      `;
    }

    const socTagsContainer = document.getElementById("social-tags-container");
    if (socTagsContainer) {
      document.getElementById("badge-social-count").textContent = (ogList.length + twList.length) + " tags";
      const navBadge = document.getElementById("nav-badge-social");
      if (navBadge) navBadge.textContent = ogList.length + twList.length;

      let sHtml = '<div style="display:flex; flex-direction:column; gap:4px;">';
      ogList.forEach(item => {
        sHtml += `
          <div class="ad_seo_item" style="padding:6px 0;">
            <div class="attr_name" style="color:var(--accent-blue);">${escapeHtml(item.property)}</div>
            <div class="content">
              <span>${escapeHtml(item.content)}</span>
              <button class="copy-btn" data-copy="${escapeHtml(item.content)}" data-label="${escapeHtml(item.property)}">Copy</button>
            </div>
          </div>
        `;
      });
      twList.forEach(item => {
        sHtml += `
          <div class="ad_seo_item" style="padding:6px 0;">
            <div class="attr_name" style="color:var(--accent-cyan);">${escapeHtml(item.name)}</div>
            <div class="content">
              <span>${escapeHtml(item.content)}</span>
              <button class="copy-btn" data-copy="${escapeHtml(item.content)}" data-label="${escapeHtml(item.name)}">Copy</button>
            </div>
          </div>
        `;
      });
      sHtml += '</div>';
      socTagsContainer.innerHTML = sHtml;
    }

    // 5. Structured Data (JSON-LD)
    const schemaContainer = document.getElementById("schema-container");
    if (schemaContainer) {
      document.getElementById("badge-schema-count").textContent = schemas.length + " schemas";
      const navBadge = document.getElementById("nav-badge-schema");
      if (navBadge) navBadge.textContent = schemas.length;

      if (schemas.length === 0) {
        schemaContainer.innerHTML = '<div style="color:var(--text-dim); font-style:italic;">Tidak ditemukan Structured Data JSON-LD pada halaman ini.</div>';
      } else {
        let scHtml = "";
        schemas.forEach(s => {
          let codeStr = s.raw;
          try { codeStr = JSON.stringify(s.parsed, null, 2); } catch(e) {}
          scHtml += `
            <div class="code-block-wrap">
              <div class="code-block-header">
                <span class="title">JSON-LD #${s.index} &mdash; ${escapeHtml(s.types)}</span>
                <button class="copy-btn btn-copy-schema" data-idx="${s.index}">Copy JSON</button>
              </div>
              <pre class="json-code">${escapeHtml(codeStr)}</pre>
            </div>
          `;
        });
        schemaContainer.innerHTML = scHtml;
      }
    }

    // 6. Headings (H1 - H6)
    const headings = data.headings || [];
    const sumContainer = document.getElementById("headings-summary-badges");
    if (sumContainer) {
      let bHtml = "";
      ["h1", "h2", "h3", "h4", "h5", "h6"].forEach(h => {
        bHtml += `<span class="htag-badge htag-${h}">${h.toUpperCase()}: ${headingCounts[h] || 0}</span>`;
      });
      sumContainer.innerHTML = bHtml;
    }

    const treeContainer = document.getElementById("headings-tree-container");
    if (treeContainer) {
      document.getElementById("badge-headings-count").textContent = headings.length + " headings";
      const navBadge = document.getElementById("nav-badge-headings");
      if (navBadge) navBadge.textContent = headings.length;

      if (headings.length === 0) {
        treeContainer.innerHTML = '<div style="color:var(--text-dim); font-style:italic;">Tidak ada heading tag (H1 - H6) terdeteksi.</div>';
      } else {
        let tHtml = "";
        headings.forEach(item => {
          const skipWarning = item.isSkip ? (`<span class="alert-pill alert-warn">Expected ${item.expectedTag.toUpperCase()}</span>`) : "";
          const hiddenWarning = item.isHidden ? (`<span class="alert-pill alert-info">Hidden Element</span>`) : "";
          tHtml += `
            <div class="heading-node hlevel-${item.level}">
              <span class="htag-badge htag-${item.tag.toLowerCase()}">${item.tag}</span>
              <span style="flex:1; color:var(--text-main); font-weight:500;">${escapeHtml(item.text)}</span>
              <span class="char-count">(${item.length} chars)</span>
              ${skipWarning}
              ${hiddenWarning}
              <button class="copy-btn" data-copy="${escapeHtml(item.text)}" data-label="${item.tag}">Copy</button>
            </div>
          `;
        });
        treeContainer.innerHTML = tHtml;
      }
    }

    // Forms Table
    const formsContainer = document.getElementById("forms-container");
    if (formsContainer) {
      const forms = data.forms || [];
      if (forms.length > 0) {
        let fHtml = `
          <strong style="font-size:12px; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:0.5px;">Detected Forms (${forms.length})</strong>
          <table class="data-table" style="margin-top:8px;">
            <thead><tr><th>Action</th><th>Method</th><th>Fields Count</th></tr></thead>
            <tbody>
        `;
        forms.forEach(f => {
          fHtml += `<tr><td><code>${escapeHtml(f.action)}</code></td><td><span class="alert-pill alert-info">${escapeHtml(f.method)}</span></td><td>${f.fields} fields</td></tr>`;
        });
        fHtml += '</tbody></table>';
        formsContainer.innerHTML = fHtml;
      } else {
        formsContainer.innerHTML = "";
      }
    }

    // HTML5 Doctype Check
    const html5Container = document.getElementById("html5-container");
    if (html5Container) {
      const html5 = data.html5 || {};
      html5Container.innerHTML = `
        <div style="padding:10px 14px; background:var(--bg-surface-alt); border:1px solid var(--border-color); border-radius:8px; font-size:12.5px;">
          <span>Doctype is ${html5.isHtml5 ? '<span class="alert-pill alert-good">HTML5</span>' : '<span class="alert-pill alert-warn">Legacy / None</span>'} &mdash; HTML5 Semantic Elements ${html5.hasHtml5Tags ? '<span class="alert-pill alert-good">Detected</span>' : '<span class="alert-pill alert-info">None</span>'}</span>
        </div>
      `;
    }

    // 7. Links Analysis
    const linksContainer = document.getElementById("links-container");
    if (linksContainer) {
      document.getElementById("badge-links-count").textContent = lStats.total + " links";
      const navBadge = document.getElementById("nav-badge-links");
      if (navBadge) navBadge.textContent = lStats.total;

      linksContainer.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Tipe Link / Anchor</th><th>Jumlah</th><th>Status Rekomendasi SEO</th></tr></thead>
          <tbody>
            <tr><td><strong>Total Link &lt;a href&gt;</strong></td><td><span class="alert-pill alert-info">${lStats.total}</span></td><td>Semua tautan yang terdeteksi di dokumen</td></tr>
            <tr><td><strong>Internal Links</strong></td><td><span class="alert-pill alert-good">${lStats.internal}</span></td><td>Tautan menuju halaman internal domain yang sama</td></tr>
            <tr><td><strong>External Links</strong></td><td><span class="alert-pill alert-info">${lStats.external}</span></td><td>Tautan menuju domain lain (Outbound links)</td></tr>
            <tr><td><strong>Nofollow Links</strong></td><td><span class="alert-pill alert-warn">${lStats.nofollow}</span></td><td>Tautan dengan instruksi <code>rel="nofollow"</code></td></tr>
            <tr><td><strong>Target _blank tanpa noopener</strong></td><td><span class="alert-pill ${lStats.blankNoOpener > 0 ? 'alert-err' : 'alert-good'}">${lStats.blankNoOpener}</span></td><td>${lStats.blankNoOpener > 0 ? '⚠️ Risiko keamanan tab-nabbing, tambahkan rel="noopener"' : '✅ Aman'}</td></tr>
            <tr><td><strong>Link Kosong / Javascript (#)</strong></td><td><span class="alert-pill alert-warn">${lStats.empty}</span></td><td>Tautan yang mengarah ke '#' atau 'javascript:void(0)'</td></tr>
          </tbody>
        </table>
      `;
    }

    // 8. Resource Hints
    const hintsContainer = document.getElementById("hints-container");
    if (hintsContainer) {
      const hints = data.resourceHints || [];
      document.getElementById("badge-hints-count").textContent = hints.length + " hints";
      const navBadge = document.getElementById("nav-badge-hints");
      if (navBadge) navBadge.textContent = hints.length;

      if (hints.length === 0) {
        hintsContainer.innerHTML = '<div style="color:var(--text-dim); font-style:italic;">Tidak ada resource hints (preload / preconnect) ditemukan.</div>';
      } else {
        let hHtml = `
          <table class="data-table">
            <thead><tr><th>Rel</th><th>As Type</th><th>Target URL</th><th>Crossorigin</th></tr></thead>
            <tbody>
        `;
        hints.forEach(h => {
          hHtml += `<tr><td><span class="alert-pill alert-info">${escapeHtml(h.rel)}</span></td><td><code>${escapeHtml(h.as)}</code></td><td><a href="${escapeHtml(h.href)}" target="_blank" class="attr_link">${escapeHtml(h.href)}</a></td><td>${h.crossorigin ? escapeHtml(h.crossorigin) : '-'}</td></tr>`;
        });
        hHtml += '</tbody></table>';
        hintsContainer.innerHTML = hHtml;
      }
    }

    // 9. External Resources
    const extContainer = document.getElementById("external-container");
    if (extContainer) {
      const extDomains = data.externalDomains || [];
      document.getElementById("badge-ext-count").textContent = extDomains.length + " domains";
      const navBadge = document.getElementById("nav-badge-ext");
      if (navBadge) navBadge.textContent = extDomains.length;

      if (extDomains.length === 0) {
        extContainer.innerHTML = '<div style="color:var(--text-dim); font-style:italic;">Tidak ada domain pihak ketiga eksternal yang dipanggil.</div>';
      } else {
        let eHtml = `
          <table class="data-table">
            <thead><tr><th>Domain Eksternal</th><th>Kategori</th><th>Hits / Panggilan</th><th>Tipe Resource</th></tr></thead>
            <tbody>
        `;
        extDomains.forEach(ed => {
          eHtml += `<tr><td><strong>${escapeHtml(ed.hostname)}</strong></td><td><span class="alert-pill alert-info">${escapeHtml(ed.category)}</span></td><td>${ed.count}</td><td><code>${escapeHtml(ed.types)}</code></td></tr>`;
        });
        eHtml += '</tbody></table>';
        extContainer.innerHTML = eHtml;
      }
    }

    // 10. Security
    const secContainer = document.getElementById("security-container");
    if (secContainer) {
      const sec = data.security || {};
      secContainer.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Konfigurasi Keamanan</th><th>Nilai</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td><strong>Protokol HTTPS</strong></td><td>${escapeHtml(data.protocol || 'https:')}</td><td><span class="alert-pill ${sec.isHttps ? 'alert-good' : 'alert-err'}">${sec.isHttps ? '✅ SECURE (HTTPS)' : '⛔ INSECURE (HTTP)'}</span></td></tr>
            <tr><td><strong>Content-Security-Policy (CSP)</strong></td><td>${sec.csp ? escapeHtml(sec.csp) : '<em>Not specified in meta</em>'}</td><td><span class="alert-pill ${sec.csp ? 'alert-good' : 'alert-info'}">${sec.csp ? 'Configured' : 'Optional / Server Header'}</span></td></tr>
            <tr><td><strong>Referrer-Policy</strong></td><td>${sec.referrerPolicy ? escapeHtml(sec.referrerPolicy) : '<em>Default browser policy</em>'}</td><td><span class="alert-pill alert-info">${escapeHtml(sec.referrerPolicy || 'Default')}</span></td></tr>
          </tbody>
        </table>
      `;
    }
  }

  // Event Listeners
  document.addEventListener("DOMContentLoaded", () => {
    // Theme toggle
    const themeBtn = document.getElementById("theme-toggle") || document.getElementById("btn-theme-toggle");
    const sunIcon = document.getElementById("sun-icon");
    const moonIcon = document.getElementById("moon-icon");

    function applyTheme(isLight) {
      if (isLight) {
        document.documentElement.classList.remove("dark");
        document.body.classList.add("light-theme");
        document.body.setAttribute("data-theme", "light");
        if (sunIcon) sunIcon.style.display = "block";
        if (moonIcon) moonIcon.style.display = "none";
      } else {
        document.documentElement.classList.add("dark");
        document.body.classList.remove("light-theme");
        document.body.setAttribute("data-theme", "dark");
        if (sunIcon) sunIcon.style.display = "none";
        if (moonIcon) moonIcon.style.display = "block";
      }
    }

    const savedTheme = localStorage.getItem("msi_theme") || "dark";
    applyTheme(savedTheme === "light");

    if (themeBtn) {
      themeBtn.onclick = () => {
        const nextIsLight = !document.body.classList.contains("light-theme");
        applyTheme(nextIsLight);
        localStorage.setItem("msi_theme", nextIsLight ? "light" : "dark");
        showToast("Tema diubah ke: " + (nextIsLight ? "Terang" : "Gelap"));
      };
    }

    // Global click delegation for Copy buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      if (btn.id === "btn-copy-url") {
        const url = (CURRENT_SEO && CURRENT_SEO.url) || document.getElementById("target-url-link").href;
        copyText(url, "URL");
        return;
      }
      if (btn.classList.contains("btn-copy-schema")) {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        const s = ((CURRENT_SEO && CURRENT_SEO.jsonLd) || []).find(item => item.index === idx);
        if (s) {
          let code = s.raw;
          try { code = JSON.stringify(s.parsed, null, 2); } catch(err) {}
          copyText(code, "JSON-LD #" + idx);
        }
        return;
      }
      const text = btn.getAttribute("data-copy");
      const label = btn.getAttribute("data-label") || "Teks";
      if (text !== null) {
        copyText(text, label);
      }
    });

    // Copy Summary (Markdown)
    const btnSum = document.getElementById("btn-copy-summary");
    if (btnSum) {
      btnSum.onclick = () => {
        const d = CURRENT_SEO || {};
        const diag = d.diagnostics || [];
        const hCounts = d.headingCounts || {};
        let md = "URL: " + (d.url || location.href) + "\r\n";
        md += "Generated: " + (d.generatedAt || new Date().toLocaleString()) + "\r\n\r\n";
        md += "## Ringkasan KPI\r\n";
        md += "- Passed: " + diag.filter(x => x.level === 'good').length + "\r\n";
        md += "- Warnings: " + diag.filter(x => x.level === 'warning').length + "\r\n";
        md += "- Errors: " + diag.filter(x => x.level === 'error').length + "\r\n";
        md += "- Total Checks: " + diag.length + "\r\n\r\n";
        md += "## Metadata Utama\r\n";
        md += "- Title (" + (d.titleLength || 0) + " chars): " + (d.title || "") + "\r\n";
        md += "- Description (" + (d.descriptionLength || 0) + " chars): " + (d.description || "") + "\r\n";
        md += "- Canonical: " + (d.canonical || 'None') + "\r\n";
        md += "- H1 Headings: " + (hCounts.h1 || 0) + "\r\n";
        md += "- Structured Data: " + ((d.jsonLd && d.jsonLd.length) || 0) + " schemas\r\n\r\n";
        md += "## Diagnostik Lengkap\r\n";
        diag.forEach(x => {
          md += "- [" + x.level.toUpperCase() + "] " + x.category + ": " + x.message + "\r\n";
        });
        copyText(md, "Ringkasan Markdown");
      };
    }

    // Export JSON
    const btnExport = document.getElementById("btn-export-json");
    if (btnExport) {
      btnExport.onclick = () => {
        const payload = {
          ...(CURRENT_SEO || {}),
          exportedAt: new Date().toISOString()
        };
        const jsonStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "seo_audit_" + ((CURRENT_SEO && CURRENT_SEO.hostname) || "report") + "_" + Date.now() + ".json";
        a.click();
        URL.revokeObjectURL(url);
        showToast("✅ Berhasil mengekspor JSON!");
      };
    }

    // Real-time Global Search Input
    const searchInput = document.getElementById("global-search-input");
    if (searchInput) {
      searchInput.oninput = (e) => {
        const q = e.target.value.toLowerCase().trim();
        const targets = document.querySelectorAll(".ad_seo_item, .heading-node, .code-block-wrap, table.data-table tr");
        targets.forEach(el => {
          if (!q) {
            el.style.display = "";
            return;
          }
          const txt = el.textContent.toLowerCase();
          el.style.display = txt.includes(q) ? "" : "none";
        });
      };
    }

    // Category Filter Chips
    const chips = document.querySelectorAll(".chip-btn");
    chips.forEach(chip => {
      chip.onclick = () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const tab = chip.getAttribute("data-tab");
        const sections = document.querySelectorAll("section.seo-card");
        if (tab === "all") {
          sections.forEach(s => s.style.display = "");
        } else {
          sections.forEach(s => {
            if (s.id === tab) {
              s.style.display = "";
              s.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              s.style.display = "none";
            }
          });
        }
      };
    });

    // KPI Cards Click Filter
    document.querySelectorAll(".kpi-card").forEach(kpi => {
      kpi.onclick = () => {
        const filter = kpi.getAttribute("data-filter");
        if (filter === "headings") {
          document.getElementById("headings").scrollIntoView({ behavior: "smooth" });
        } else if (filter === "schemas") {
          document.getElementById("structureddata").scrollIntoView({ behavior: "smooth" });
        } else if (filter === "links") {
          document.getElementById("links").scrollIntoView({ behavior: "smooth" });
        } else {
          document.getElementById("diagnostics-section").scrollIntoView({ behavior: "smooth" });
        }
      };
    });

    // ScrollSpy for Sidebar Nav
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll(".section-nav-link").forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href") === "#" + id) {
              link.classList.add("active");
            }
          });
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });

    document.querySelectorAll("section.seo-card").forEach(sec => observer.observe(sec));

    // Load data from extension storage
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["page", "sections", "last_seo_data"], (res) => {
        if (res && (res.page || res.last_seo_data)) {
          renderReport(res.page, res.sections, res.last_seo_data);
        } else {
          renderReport(null, null, SAMPLE_DATA);
        }
      });
    } else {
      renderReport(null, null, SAMPLE_DATA);
    }
  });

})();
