// IPvFooKan - Modern Standalone Link & Asset Grabber Controller
(function () {
  "use strict";

  let RAW_ASSETS = [];
  let SOURCE_URL = "";
  let SOURCE_HOST = "";
  let activeCategory = "all";
  let currentViewMode = "list";
  let currentFiltered = [];

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
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  function copyToClipboard(text, label = "Teks") {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast("✅ Berhasil menyalin " + label + " ke clipboard!");
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("✅ Berhasil menyalin " + label + " ke clipboard!");
    });
  }

  function downloadFile(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function convertImgToBase64(url) {
    if (url.startsWith("data:")) return url;
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch (err) {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }
  }

  function updateTabCounts() {
    const counts = { all: 0, image: 0, link: 0, media: 0, doc: 0, code: 0 };
    RAW_ASSETS.forEach(item => {
      counts.all++;
      if (counts[item.category] !== undefined) counts[item.category]++;
    });

    for (const key in counts) {
      const el = document.getElementById("count-" + key);
      if (el) el.textContent = counts[key];
      const kpiEl = document.getElementById("kpi-count-" + key);
      if (kpiEl) kpiEl.textContent = counts[key];
    }

    const headerCount = document.getElementById("header-total-count");
    if (headerCount) headerCount.textContent = counts.all + " items";
  }

  function filterAssets() {
    const searchVal = (document.getElementById("search-input").value || "").toLowerCase().trim();
    const dedup = document.getElementById("opt-dedup").checked;
    const diffOrigin = document.getElementById("opt-diff-origin").checked;

    let list = [...RAW_ASSETS];

    if (activeCategory !== "all") {
      list = list.filter(item => item.category === activeCategory);
    }

    if (searchVal) {
      list = list.filter(item =>
        (item.url && item.url.toLowerCase().includes(searchVal)) ||
        (item.title && item.title.toLowerCase().includes(searchVal)) ||
        (item.hostname && item.hostname.toLowerCase().includes(searchVal))
      );
    }

    if (diffOrigin && SOURCE_HOST) {
      list = list.filter(item => item.hostname && !item.hostname.includes(SOURCE_HOST) && !SOURCE_HOST.includes(item.hostname));
    }

    if (dedup) {
      const seen = new Set();
      list = list.filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
    }

    return list;
  }

  function renderListView(items, container) {
    let html = '<ul class="asset-list">';
    items.forEach((item, idx) => {
      const isImg = item.category === "image";
      const isB64 = item.isBase64;
      const typeLabel = isB64 ? "BASE64" : (item.ext || item.category);
      const typeClass = "badge-" + (item.category || "code");

      const thumbHtml = isImg
        ? '<div class="item-thumb"><img src="' + escapeHtml(item.url) + '" loading="lazy" alt="thumb" /></div>'
        : '<div class="item-thumb" style="font-size:18px;">📄</div>';

      const dimHtml = item.width ? '<span class="item-dim">' + item.width + '×' + item.height + '</span>' : '';
      const displayUrl = item.url.length > 90 ? item.url.substring(0, 87) + '...' : item.url;

      html += '<li class="asset-item">' +
        '<span class="item-num">' + (idx + 1) + '.</span>' +
        thumbHtml +
        '<span class="item-badge ' + typeClass + '">' + escapeHtml(typeLabel) + '</span>' +
        dimHtml +
        '<span class="item-host">' + escapeHtml(item.hostname || 'local') + '</span>' +
        (item.title && item.title !== item.url ? '<span class="item-title" title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + '</span>' : '') +
        '<a href="' + escapeHtml(item.url) + '" target="_blank" class="item-url" title="' + escapeHtml(item.url) + '">' + escapeHtml(displayUrl) + '</a>' +
        '<div class="item-actions">' +
          '<button class="btn-action btn-copy-url" data-idx="' + idx + '">📋 URL</button>' +
          (isImg ? '<button class="btn-action btn-action-b64 btn-copy-b64" data-idx="' + idx + '">🧬 Base64</button>' : '') +
          '<button class="btn-action btn-download" data-idx="' + idx + '">⬇️</button>' +
        '</div>' +
      '</li>';
    });
    html += '</ul>';
    container.innerHTML = html;
    bindItemButtons(container, items);
  }

  function renderGridView(items, container) {
    let html = '<div class="asset-grid">';
    items.forEach((item, idx) => {
      const isImg = item.category === "image";
      const isB64 = item.isBase64;
      const typeLabel = isB64 ? "BASE64" : (item.ext || item.category);

      html += '<div class="grid-card">' +
        '<div class="grid-img-wrap">' +
          (isImg ? '<a href="' + escapeHtml(item.url) + '" target="_blank"><img src="' + escapeHtml(item.url) + '" loading="lazy" alt="asset" /></a>' : '<div style="font-size:32px;">📄</div>') +
        '</div>' +
        '<div class="grid-body">' +
          '<div class="grid-meta">' +
            '<span class="item-badge badge-' + item.category + '">' + escapeHtml(typeLabel) + '</span>' +
            (item.width ? '<span>' + item.width + '×' + item.height + '</span>' : '') +
          '</div>' +
          '<div class="grid-title" title="' + escapeHtml(item.title || item.url) + '">' + escapeHtml(item.title || item.hostname || 'Asset') + '</div>' +
          '<div class="grid-actions">' +
            '<button class="btn-action btn-copy-url" data-idx="' + idx + '" title="Copy URL">📋 URL</button>' +
            (isImg ? '<button class="btn-action btn-action-b64 btn-copy-b64" data-idx="' + idx + '" title="Copy Base64">🧬 B64</button>' : '') +
            '<button class="btn-action btn-download" data-idx="' + idx + '" title="Download">⬇️</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
    bindItemButtons(container, items);
  }

  function bindItemButtons(container, items) {
    container.querySelectorAll(".btn-copy-url").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const item = items[parseInt(btn.getAttribute("data-idx"), 10)];
        if (item) copyToClipboard(item.url, "URL");
      };
    });

    container.querySelectorAll(".btn-copy-b64").forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const item = items[parseInt(btn.getAttribute("data-idx"), 10)];
        if (!item) return;
        btn.textContent = "⌛...";
        const b64 = await convertImgToBase64(item.url);
        btn.textContent = "🧬 Base64";
        if (b64) {
          copyToClipboard(b64, "Base64 Image");
        } else {
          showToast("❌ Gagal convert ke Base64 (CORS terblokir)");
        }
      };
    });

    container.querySelectorAll(".btn-download").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const item = items[parseInt(btn.getAttribute("data-idx"), 10)];
        if (!item) return;
        const filename = (item.title || "asset").replace(/[^a-zA-Z0-9_-]/g, "_") + (item.ext ? "." + item.ext : "");
        downloadFile(item.url, filename);
      };
    });
  }

  function renderContent() {
    const container = document.getElementById("content-container");
    if (!container) return;

    currentFiltered = filterAssets();

    if (!currentFiltered.length) {
      container.innerHTML = '<div class="empty-state">Tidak ada item ditemukan yang sesuai dengan filter.</div>';
      return;
    }

    if (currentViewMode === "grid") {
      renderGridView(currentFiltered, container);
    } else {
      renderListView(currentFiltered, container);
    }
  }

  function initData(payload) {
    if (payload) {
      RAW_ASSETS = payload.assets || [];
      SOURCE_URL = payload.sourceUrl || "";
      SOURCE_HOST = payload.sourceHost || "";
    }

    const linkElem = document.getElementById("source-link-elem");
    if (linkElem) {
      linkElem.href = SOURCE_URL || "#";
      linkElem.textContent = "🌐 " + (SOURCE_URL || "Halaman Asli");
    }

    const targetLinkElem = document.getElementById("target-url-link");
    if (targetLinkElem) {
      targetLinkElem.href = SOURCE_URL || "#";
      targetLinkElem.textContent = SOURCE_URL || "Halaman Asli";
    }

    const protoElem = document.getElementById("badge-protocol");
    if (protoElem && SOURCE_URL) {
      try {
        const u = new URL(SOURCE_URL);
        protoElem.textContent = u.protocol.replace(":", "").toUpperCase();
      } catch (e) {
        protoElem.textContent = "URL";
      }
    }

    updateTabCounts();
    renderContent();
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Tabs Navigation
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.onclick = function () {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.getAttribute("data-tab");
        renderContent();
      };
    });

    // View Mode Toggle
    const listBtn = document.getElementById("btn-view-list");
    const gridBtn = document.getElementById("btn-view-grid");

    if (listBtn && gridBtn) {
      listBtn.onclick = function () {
        currentViewMode = "list";
        listBtn.classList.add("active");
        gridBtn.classList.remove("active");
        renderContent();
      };

      gridBtn.onclick = function () {
        currentViewMode = "grid";
        gridBtn.classList.add("active");
        listBtn.classList.remove("active");
        renderContent();
      };
    }

    // Filter controls
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.oninput = renderContent;

    const optDedup = document.getElementById("opt-dedup");
    if (optDedup) optDedup.onchange = renderContent;

    const optDiff = document.getElementById("opt-diff-origin");
    if (optDiff) optDiff.onchange = renderContent;

    const optGroup = document.getElementById("opt-group");
    if (optGroup) optGroup.onchange = renderContent;

    // Copy All URLs button
    const copyAllBtn = document.getElementById("btn-copy-urls");
    if (copyAllBtn) {
      copyAllBtn.onclick = () => {
        if (!currentFiltered.length) return showToast("Tidak ada item untuk disalin");
        const text = currentFiltered.map(i => i.url).join("\r\n");
        copyToClipboard(text, currentFiltered.length + " URLs");
      };
    }

    // Export TXT button
    const exportTxtBtn = document.getElementById("btn-export-txt");
    if (exportTxtBtn) {
      exportTxtBtn.onclick = () => {
        if (!currentFiltered.length) return showToast("Tidak ada aset untuk di-export");
        const text = currentFiltered.map(i => (i.category || "").toUpperCase() + "\t" + (i.hostname || "") + "\t" + i.url).join("\r\n");
        const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        downloadFile(url, "assets_" + (SOURCE_HOST || "export") + "_" + Date.now() + ".txt");
        URL.revokeObjectURL(url);
        showToast("✅ Berhasil ekspor " + currentFiltered.length + " aset ke file TXT!");
      };
    }

    // Theme toggle handling
    const themeBtn = document.getElementById("theme-toggle");
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

    const savedTheme = localStorage.getItem("msi_theme");
    applyTheme(savedTheme === "light");

    if (themeBtn) {
      themeBtn.onclick = () => {
        const nextIsLight = !document.body.classList.contains("light-theme");
        applyTheme(nextIsLight);
        localStorage.setItem("msi_theme", nextIsLight ? "light" : "dark");
        showToast("Tema diubah ke: " + (nextIsLight ? "Terang" : "Gelap"));
      };
    }

    // Copy Hero URL button
    const copyUrlBtn = document.getElementById("btn-copy-url");
    if (copyUrlBtn) {
      copyUrlBtn.onclick = () => {
        if (SOURCE_URL) {
          copyToClipboard(SOURCE_URL, "URL Target");
        } else {
          showToast("Tidak ada URL untuk disalin");
        }
      };
    }

    // Load from storage
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["grabber_data"], (res) => {
        if (res && res.grabber_data) {
          initData(res.grabber_data);
        } else {
          initData({
            sourceUrl: "https://hallonet.id",
            sourceHost: "hallonet.id",
            assets: [
              { category: "image", url: "icons/icon128.png", hostname: "extension", title: "IPvFooKan Logo", ext: "png", width: 128, height: 128 },
              { category: "link", url: "https://github.com/mm1rza/ipvfoo", hostname: "github.com", title: "GitHub Repo", ext: "html" }
            ]
          });
        }
      });
    } else {
      initData(null);
    }
  });

})();
