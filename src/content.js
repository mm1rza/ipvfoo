/*
 * IPvFoo In-Page Floating Overlay Widget
 * Injected into webpages directly at top-right with z-index: 2147483647
 */
"use strict";

(function () {
  // Only inject in top window (not inside iframes)
  if (window !== window.top) return;
  if (document.getElementById("ipvfoo-overlay-host")) return;

  const HIDDEN_DOMAINS = [
    "googleads.g.doubleclick.net",
    "ssl.google-analytics.com",
    "www.googletagmanager.com",
    "static.xx.fbcdn.net",
    "crashlogs.whatsapp.net",
    "graph.whatsapp.net",
    "static.whatsapp.net",
    "wa-web-plus.web.app",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "www.google-analytics.com",
    "ajax.googleapis.com",
    "assets.trakteer.id",
    "connect.facebook.net",
    "i.ytimg.com",
    "jnn-pa.googleapis.com",
    "maxcdn.bootstrapcdn.com",
    "secure.gravatar.com",
    "ad.doubleclick.net",
    "9212252.fls.doubleclick.net",
    "acs.whatsapp.com",
    "www.googleadservices.com",
    "avatars.githubusercontent.com",
    "ssl.gstatic.com",
    "www.gstatic.com",
    "pagead2.googlesyndication.com",
    "www.fbsbx.com",
    "www.google.co.id",
    "www.google.com",
    "static.doubleclick.net",
    "yt3.ggpht.com",
    "accounts.youtube.com",
    "fe-static.deepseek.com",
    "dit.whatsapp.net",
    "lh3.googleusercontent.com",
    "api.github.com",
    "apis.google.com",
    "static.deepseek.com",
    "analytics.google.com",
    "maps.googleapis.com",
    "youtube.googleapis.com",
    "storage.googleapis.com",
    "cdn.jsdelivr.net",
    "code.jquery.com",
    "cdnjs.cloudflare.com",
    "csp.withgoogle.com",
    "csi.gstatic.com",
    "cdn.amcharts.com",
    "cdn.datatables.net",
    "play.google.com",
    "use.fontawesome.com",
    "analytics.tiktok.com",
    "analytics.twitter.com",
    "stats.g.doubleclick.net",
    "static.ads-twitter.com",
    "accounts.google.com",
    "ogs.google.com",
    "graph.instagram.com",
    "fundingchoicesmessages.google.com",
    "feedback-pa.clients6.google.com",
    "scontent.xx.fbcdn.net",
    "static.cdninstagram.com"
  ];

  const DFLAG_SSL = 0x100;
  const DFLAG_NOSSL = 0x200;
  const DFLAG_CONNECTED = 0x400;
  const DFLAG_WEBSOCKET = 0x800;

  let currentSort = { column: 'default', order: 'asc' };
  let allTuplesCache = [];

  function isBottomRow(tuple) {
    if (!tuple) return true;
    const addr = tuple[1];
    const flags = tuple[3] || 0;
    const isWs = Boolean(flags & DFLAG_WEBSOCKET);
    const noIp = !addr || addr === "(x)" || addr === "(lost)" || addr.startsWith("(");
    return isWs || noIp;
  }

  function compareTuples(a, b) {
    const aBottom = isBottomRow(a);
    const bBottom = isBottomRow(b);
    if (aBottom !== bBottom) {
      return aBottom ? 1 : -1;
    }

    if (currentSort.column === 'size') {
      const aBytes = a[5] || 0;
      const bBytes = b[5] || 0;
      if (aBytes !== bBytes) {
        return currentSort.order === 'asc' ? aBytes - bBytes : bBytes - aBytes;
      }
    } else if (currentSort.column === 'hits') {
      const aHits = a[4] || 0;
      const bHits = b[4] || 0;
      if (aHits !== bHits) {
        return currentSort.order === 'asc' ? aHits - bHits : bHits - aHits;
      }
    } else if (currentSort.column === 'ip') {
      const cmp = (a[1] || '').localeCompare(b[1] || '');
      if (cmp !== 0) {
        return currentSort.order === 'asc' ? cmp : -cmp;
      }
    } else if (currentSort.column === 'domain') {
      const cmp = a[0].localeCompare(b[0]);
      return currentSort.order === 'asc' ? cmp : -cmp;
    }

    return a[0].localeCompare(b[0]);
  }

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const val = bytes / Math.pow(k, i);
    return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${sizes[i]}`;
  }

  // Create host element & attach Shadow DOM
  const host = document.createElement("div");
  host.id = "ipvfoo-overlay-host";
  host.style.cssText = "position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647 !important;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    #widget {
      position: fixed;
      top: 12px;
      right: 12px;
      width: 440px;
      max-width: calc(100vw - 24px);
      max-height: 85vh;
      background: rgba(22, 24, 29, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: #eee;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9px;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.2);
      font-size: 11.5px;
      z-index: 2147483647 !important;
      display: none;
      flex-direction: column;
      overflow: hidden;
      transition: opacity 0.2s, transform 0.2s;
      user-select: none;
    }

    #header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 10px;
      background: rgba(35, 38, 46, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: move;
    }

    #header .title {
      font-weight: 700;
      color: #00d9ff;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      letter-spacing: 0.3px;
    }

    #header .controls {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .btn {
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      cursor: pointer;
      line-height: 1.3;
      transition: background 0.15s;
    }

    .btn-rst {
      background: #e65100;
      color: #fff;
      border-color: #bf360c;
    }
    .btn-rst:hover {
      background: #f57c00;
    }

    .btn-action {
      background: rgba(255, 255, 255, 0.1);
      color: #ccc;
    }
    .btn-action:hover {
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
    }

    #table-wrap {
      overflow-y: auto;
      max-height: calc(85vh - 40px);
      padding: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      white-space: nowrap;
    }

    th {
      text-align: left;
      padding: 4px 6px;
      color: #888;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    td {
      padding: 3px 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: middle;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.05);
    }

    .mainRow td {
      font-weight: 700;
    }

    .domain-cell {
      max-width: 170px;
      overflow: hidden;
      text-overflow: ellipsis;
      user-select: text;
    }

    .ip-cell {
      font-family: Consolas, Monaco, monospace;
      user-select: text;
    }
    .ip4 { color: #ff8a80; }
    .ip6 { color: #80ff80; }

    .bgp-link {
      color: #00d9ff;
      text-decoration: none;
      font-weight: 600;
    }
    .bgp-link:hover {
      text-decoration: underline;
    }

    .hits-cell {
      text-align: center;
      font-weight: 700;
      color: #48ff00;
      font-family: Consolas, Monaco, monospace;
    }
    .hits-zero {
      color: #777;
      font-weight: normal;
    }

    .size-cell {
      text-align: right;
      font-family: Consolas, Monaco, monospace;
      color: #ffd700;
      font-size: 10.5px;
    }
    .size-zero {
      color: #777;
    }

    .highlight td {
      background: rgba(255, 235, 59, 0.22) !important;
    }

    /* Minimized Badge */
    #mini-badge {
      position: fixed;
      top: 12px;
      right: 12px;
      background: rgba(20, 22, 28, 0.95);
      border: 1px solid rgba(0, 217, 255, 0.4);
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      color: #eee;
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: none;
      align-items: center;
      gap: 8px;
      z-index: 2147483647 !important;
      user-select: none;
    }
    #mini-badge:hover {
      border-color: #00d9ff;
      background: rgba(30, 34, 44, 0.98);
    }
    #mini-badge .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #48ff00;
      display: inline-block;
    }

  `;
  shadow.appendChild(style);

  // Widget Container
  const widget = document.createElement("div");
  widget.id = "widget";
  widget.innerHTML = `
    <div id="header">
      <div class="title">
        <span>🌐 IPvFoo Live</span>
      </div>
      <div class="controls">
        <button id="btn-rst" class="btn btn-rst" title="Reset Hit & Size Counter">RESET HITS</button>
        <button id="btn-min" class="btn btn-action" title="Minimize / Sembunyikan">_</button>
        <button id="btn-close" class="btn btn-action" title="Tutup Widget">✕</button>
      </div>
    </div>
    <div id="table-wrap">
      <table>
        <thead>
          <tr>
            <th id="th-domain" style="cursor:pointer;" title="Klik untuk mengurutkan Domain">Domain <span class="sort-icon"></span></th>
            <th id="th-ip" style="cursor:pointer;" title="Klik untuk mengurutkan IP">IP Address <span class="sort-icon"></span></th>
            <th>BGP</th>
            <th id="th-hits" style="text-align:center; cursor:pointer;" title="Klik untuk mengurutkan Hits (Terbanyak/Terkecil)">Hits <span class="sort-icon"></span></th>
            <th id="th-size" style="text-align:right; cursor:pointer;" title="Klik untuk mengurutkan Size (Terbesar/Terkecil)">Size <span class="sort-icon"></span></th>
          </tr>
        </thead>
        <tbody id="addr_tbody"></tbody>
      </table>
    </div>
  `;
  shadow.appendChild(widget);

  // Mini Badge
  const miniBadge = document.createElement("div");
  miniBadge.id = "mini-badge";
  miniBadge.innerHTML = `<span class="dot"></span><span id="mini-text">IPvFoo Loading...</span>`;
  miniBadge.onclick = () => {
    miniBadge.style.display = "none";
    widget.style.display = "flex";
  };
  shadow.appendChild(miniBadge);

  document.documentElement.appendChild(host);

  const tbody = shadow.getElementById("addr_tbody");

  // Sorting Header Click Handlers
  function setSort(col) {
    if (currentSort.column === col) {
      currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
    } else {
      currentSort.column = col;
      currentSort.order = (col === "size" || col === "hits") ? "desc" : "asc";
    }
    updateHeaderSortIndicators();
    reRenderTable();
  }

  function updateHeaderSortIndicators() {
    const cols = ["domain", "ip", "hits", "size"];
    cols.forEach((c) => {
      const el = shadow.getElementById(`th-${c}`);
      if (el) {
        const icon = el.querySelector(".sort-icon");
        if (icon) {
          if (currentSort.column === c) {
            icon.textContent = currentSort.order === "asc" ? " ▲" : " ▼";
            el.style.color = "#00d9ff";
          } else {
            icon.textContent = "";
            el.style.color = "#888";
          }
        }
      }
    });
  }

  shadow.getElementById("th-domain").onclick = () => setSort("domain");
  shadow.getElementById("th-ip").onclick = () => setSort("ip");
  shadow.getElementById("th-hits").onclick = () => setSort("hits");
  shadow.getElementById("th-size").onclick = () => setSort("size");

  // Draggable Header
  const header = shadow.getElementById("header");
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  header.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;
    isDragging = true;
    const rect = widget.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const left = Math.max(10, Math.min(window.innerWidth - widget.offsetWidth - 10, e.clientX - dragOffsetX));
    const top = Math.max(10, Math.min(window.innerHeight - widget.offsetHeight - 10, e.clientY - dragOffsetY));
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
    widget.style.right = "auto";
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Buttons
  shadow.getElementById("btn-min").onclick = () => {
    widget.style.display = "none";
    miniBadge.style.display = "flex";
  };

  shadow.getElementById("btn-close").onclick = () => {
    widget.style.display = "none";
    miniBadge.style.display = "none";
  };

  shadow.getElementById("btn-rst").onclick = async () => {
    if (confirm("Reset Hit & Size Counter?")) {
      try {
        await chrome.runtime.sendMessage({ cmd: "resetHitCounter" });
      } catch (e) {}
      allTuplesCache.forEach((t) => {
        t[4] = 0;
        t[5] = 0;
      });
      reRenderTable();
    }
  };

  function createRow(isFirst, tuple) {
    const domain = tuple[0];
    const addr = tuple[1];
    const version = tuple[2];
    const flags = tuple[3] || 0;
    const hits = tuple[4] !== undefined ? tuple[4] : 0;
    const bytes = tuple[5] !== undefined ? tuple[5] : 0;

    const tr = document.createElement("tr");
    if (isFirst) tr.className = "mainRow";
    if (flags & DFLAG_CONNECTED) tr.classList.add("highlight");
    tr._tuple = tuple;
    tr._domain = domain;

    const lockIcon = (flags & DFLAG_SSL) ? "🔒 " : "";
    const ipClass = version === "6" ? "ip6" : "ip4";

    const bgpHtml = (addr && addr !== "(x)" && !addr.startsWith("("))
      ? `<a href="https://bgp.he.net/ip/${addr}" target="_blank" class="bgp-link">bgp</a>`
      : `<span style="color:#666;">(x)</span>`;

    tr.innerHTML = `
      <td class="domain-cell" title="${domain}">${lockIcon}${domain}</td>
      <td class="ip-cell ${ipClass}">${addr || "(x)"}</td>
      <td>${bgpHtml}</td>
      <td class="hits-cell ${hits > 0 ? '' : 'hits-zero'}">${hits}</td>
      <td class="size-cell ${bytes > 0 ? '' : 'size-zero'}">${formatBytes(bytes)}</td>
    `;
    return tr;
  }

  function updateMiniBadge(tuples) {
    if (!tuples || tuples.length === 0) return;
    const main = tuples[0];
    const mainAddr = main[1] || "(x)";
    let totalHits = 0;
    let totalBytes = 0;
    tuples.forEach((t) => {
      totalHits += t[4] || 0;
      totalBytes += t[5] || 0;
    });
    const miniText = shadow.getElementById("mini-text");
    if (miniText) {
      miniText.textContent = `${mainAddr} | ${totalHits} req | ${formatBytes(totalBytes)}`;
    }
  }

  function reRenderTable() {
    while (tbody.firstChild) {
      tbody.removeChild(tbody.firstChild);
    }
    if (allTuplesCache.length > 0) {
      const mainTuple = allTuplesCache[0];
      const others = allTuplesCache.slice(1).sort(compareTuples);
      tbody.appendChild(createRow(true, mainTuple));
      for (const t of others) {
        tbody.appendChild(createRow(false, t));
      }
      updateMiniBadge(allTuplesCache);
    }
  }

  function pushAll(tuples) {
    allTuplesCache = tuples.filter((t) => !HIDDEN_DOMAINS.includes(t[0]));
    reRenderTable();
  }

  function pushOne(tuple) {
    const domain = tuple[0];
    if (HIDDEN_DOMAINS.includes(domain)) return;

    const idx = allTuplesCache.findIndex((t) => t[0] === domain);
    if (idx >= 0) {
      allTuplesCache[idx] = tuple;
    } else {
      allTuplesCache.push(tuple);
    }
    reRenderTable();
  }

  function updateAllMiniStats() {
    const allTuples = [];
    for (let tr = tbody.firstChild; tr; tr = tr.nextSibling) {
      if (tr._tuple) allTuples.push(tr._tuple);
    }
    updateMiniBadge(allTuples);
  }

  // Connect to Extension Background
  function connect() {
    try {
      const port = chrome.runtime.connect({ name: "content-overlay" });
      port.onMessage.addListener((msg) => {
        if (msg.cmd === "toggleOverlay") {
          if (widget.style.display === "flex" || miniBadge.style.display === "flex") {
            widget.style.display = "none";
            miniBadge.style.display = "none";
          } else {
            widget.style.display = "flex";
            miniBadge.style.display = "none";
          }
        } else if (msg.cmd === "pushAll") {
          pushAll(msg.tuples);
        } else if (msg.cmd === "pushOne") {
          pushOne(msg.tuple);
        }
      });
      port.onDisconnect.addListener(() => {
        setTimeout(connect, 2000);
      });
    } catch (e) {
      setTimeout(connect, 2000);
    }
  }

  connect();
})();
