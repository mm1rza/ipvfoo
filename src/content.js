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
    const domain = tuple[0];
    const addr = tuple[1];
    const flags = tuple[3] || 0;
    const isWs = Boolean(flags & DFLAG_WEBSOCKET);
    const noIp = !addr || addr === "(x)" || addr === "(lost)" || addr.startsWith("(");
    const isAux = HIDDEN_DOMAINS.includes(domain);
    return isWs || noIp || isAux;
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
    } else if (currentSort.column === 'status') {
      const aStat = String(a[6] || 200);
      const bStat = String(b[6] || 200);
      if (aStat !== bStat) {
        return currentSort.order === 'asc' ? aStat.localeCompare(bStat) : bStat.localeCompare(aStat);
      }
    } else if (currentSort.column === 'latency') {
      const aLat = a[7] || 0;
      const bLat = b[7] || 0;
      if (aLat !== bLat) {
        return currentSort.order === 'asc' ? aLat - bLat : bLat - aLat;
      }
    } else if (currentSort.column === 'bgp') {
      const cmp = (a[8] || '').localeCompare(b[8] || '');
      if (cmp !== 0) {
        return currentSort.order === 'asc' ? cmp : -cmp;
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

  function formatSpeed(bytesPerSec) {
    if (!bytesPerSec || bytesPerSec <= 0) return "";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.min(Math.floor(Math.log(bytesPerSec) / Math.log(k)), sizes.length - 1);
    const val = bytesPerSec / Math.pow(k, i);
    return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${sizes[i]}`;
  }

  let lastBytesTimestamp = Date.now();
  let lastTotalBytes = 0;
  let currentSpeedBps = 0;
  let domainSpeedMap = {};
  let lastDomainBytes = {};

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
      width: 580px;
      max-width: calc(100vw - 24px);
      max-height: 85vh;
      background: rgba(18, 20, 26, 0.96);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      color: #eee;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 2px rgba(0, 217, 255, 0.3);
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
      padding: 8px 12px;
      background: rgba(30, 34, 44, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      cursor: move;
    }

    #header .title {
      font-weight: 700;
      color: #00d9ff;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      letter-spacing: 0.3px;
    }

    #header .controls {
      display: flex;
      gap: 5px;
      align-items: center;
    }

    .btn {
      padding: 2.5px 8px;
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
      max-height: calc(85vh - 44px);
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
      padding: 5px 6px;
      color: #888;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      user-select: none;
    }

    td {
      padding: 4px 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: middle;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.06);
    }

    .mainRow td {
      font-weight: 700;
    }

    .domain-cell {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      user-select: text;
    }

    .ip-cell {
      font-family: Consolas, Monaco, monospace;
      user-select: text;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .ip4 { color: #ff8a80; }
    .ip6 { color: #80ff80; }

    .asn-tag {
      font-size: 9.5px;
      padding: 1px 4px;
      border-radius: 3px;
      background: rgba(0, 217, 255, 0.15);
      color: #00d9ff;
      border: 1px solid rgba(0, 217, 255, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 600;
      white-space: nowrap;
    }
    .asn-tag.lan {
      background: rgba(255, 152, 0, 0.2);
      color: #ffb74d;
      border-color: rgba(255, 152, 0, 0.4);
    }

    .status-badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      font-family: Consolas, Monaco, monospace;
      text-align: center;
    }
    .status-2xx { background: rgba(76, 175, 80, 0.2); color: #48ff00; }
    .status-3xx { background: rgba(33, 150, 243, 0.2); color: #64b5f6; }
    .status-4xx { background: rgba(255, 152, 0, 0.25); color: #ffa726; }
    .status-5xx, .status-err { background: rgba(244, 67, 54, 0.3); color: #ff5252; font-weight: bold; }

    .lat-cell {
      font-family: Consolas, Monaco, monospace;
      font-size: 10.5px;
      text-align: right;
    }
    .lat-fast { color: #48ff00; }
    .lat-med { color: #ffd700; }
    .lat-slow { color: #ff5252; font-weight: bold; }
    .lat-na { color: #777; }

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

    .widget-speed {
      font-size: 10px;
      font-weight: 700;
      color: #00d9ff;
      background: rgba(0, 217, 255, 0.15);
      border: 1px solid rgba(0, 217, 255, 0.35);
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 8px;
      display: none;
      align-items: center;
      gap: 3px;
      line-height: 1.3;
    }

    .speed-tag {
      display: inline-block;
      margin-left: 4px;
      padding: 1px 4px;
      font-size: 9px;
      font-weight: 700;
      color: #000;
      background: #00d9ff;
      border-radius: 3px;
      line-height: 1.1;
    }

    .row-error td {
      background: rgba(244, 67, 54, 0.15) !important;
    }

    .highlight td {
      background: rgba(255, 235, 59, 0.18) !important;
    }

    /* Minimized Badge */
    #mini-badge {
      position: fixed;
      top: 12px;
      right: 12px;
      background: rgba(18, 20, 26, 0.96);
      border: 1px solid rgba(0, 217, 255, 0.4);
      box-shadow: 0 4px 18px rgba(0,0,0,0.6);
      color: #eee;
      border-radius: 20px;
      padding: 5px 14px;
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
      background: rgba(28, 32, 42, 0.98);
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
      <div class="title" style="display:flex; align-items:center;">
        <span>IPvFoo</span>
        <span id="widget-speed" class="widget-speed"></span>
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
            <th id="th-domain" style="cursor:pointer;" title="Sort Domain">Domain <span class="sort-icon"></span></th>
            <th id="th-ip" style="cursor:pointer;" title="Sort IP">IP Address <span class="sort-icon"></span></th>
            <th id="th-status" style="text-align:center; cursor:pointer;" title="Sort HTTP Status Code">Status <span class="sort-icon"></span></th>
            <th id="th-latency" style="text-align:right; cursor:pointer;" title="Sort Response Latency">Latency <span class="sort-icon"></span></th>
            <th id="th-hits" style="text-align:center; cursor:pointer;" title="Sort Hits">Hits <span class="sort-icon"></span></th>
            <th id="th-size" style="text-align:right; cursor:pointer;" title="Sort Payload Size">Size <span class="sort-icon"></span></th>
            <th id="th-bgp" style="text-align:center; cursor:pointer;" title="Sort BGP">BGP <span class="sort-icon"></span></th>
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
    const cols = ["domain", "ip", "status", "latency", "hits", "size", "bgp"];
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
  shadow.getElementById("th-status").onclick = () => setSort("status");
  shadow.getElementById("th-latency").onclick = () => setSort("latency");
  shadow.getElementById("th-hits").onclick = () => setSort("hits");
  shadow.getElementById("th-size").onclick = () => setSort("size");
  shadow.getElementById("th-bgp").onclick = () => setSort("bgp");

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
    const status = tuple[6] !== undefined ? tuple[6] : 200;
    const latency = tuple[7] !== undefined ? tuple[7] : 0;
    const asn = tuple[8] || "";

    const tr = document.createElement("tr");
    if (isFirst) tr.className = "mainRow";
    if (flags & DFLAG_CONNECTED) tr.classList.add("highlight");
    tr._tuple = tuple;
    tr._domain = domain;

    const lockIcon = (flags & DFLAG_SSL) ? "🔒 " : "";
    const ipClass = version === "6" ? "ip6" : "ip4";

    let statusClass = "status-2xx";
    if (typeof status === "number") {
      if (status >= 500) statusClass = "status-5xx";
      else if (status >= 400) statusClass = "status-4xx";
      else if (status >= 300) statusClass = "status-3xx";
      else if (status >= 200) statusClass = "status-2xx";
    } else {
      statusClass = "status-err";
    }
    const isErr = (typeof status === "number" && status >= 400) || typeof status === "string";
    if (isErr) tr.classList.add("row-error");

    let latClass = "lat-fast";
    let latText = `${latency} ms`;
    if (latency <= 0) {
      latClass = "lat-na";
      latText = "-";
    } else if (latency > 500) {
      latClass = "lat-slow";
    } else if (latency > 150) {
      latClass = "lat-med";
    }

    let bgpText = "bgp";
    let bgpHref = `https://bgp.he.net/ip/${addr}`;
    if (asn) {
      const cleanAsn = asn.split(" ")[0];
      bgpText = cleanAsn;
      if (cleanAsn.startsWith("AS")) {
        bgpHref = `https://bgp.he.net/${cleanAsn}`;
      }
    }

    const bgpHtml = (addr && addr !== "(x)" && !addr.startsWith("("))
      ? `<a href="${bgpHref}" target="_blank" class="bgp-link" title="Lookup ${bgpText} di HE BGP">${bgpText}</a>`
      : `<span style="color:#666;">-</span>`;

    const dSpeed = domainSpeedMap[domain] || 0;
    const speedHtml = dSpeed >= 200 ? ` <span class="speed-tag">⚡${formatSpeed(dSpeed)}</span>` : "";

    tr.innerHTML = `
      <td class="domain-cell" title="Klik untuk copy: ${domain}">${lockIcon}${domain}</td>
      <td class="ip-cell ${ipClass}" title="Klik untuk copy: ${addr || '(x)'}">${addr || "(x)"}</td>
      <td style="text-align:center;"><span class="status-badge ${statusClass}">${status}</span></td>
      <td class="lat-cell ${latClass}">${latText}</td>
      <td class="hits-cell ${hits > 0 ? '' : 'hits-zero'}">${hits}</td>
      <td class="size-cell ${bytes > 0 ? '' : 'size-zero'}">${formatBytes(bytes)}${speedHtml}</td>
      <td style="text-align:center;">${bgpHtml}</td>
    `;

    const domainTd = tr.querySelector(".domain-cell");
    if (domainTd) {
      domainTd.style.cursor = "pointer";
      domainTd.onclick = (e) => {
        e.stopPropagation();
        copyToClipboard(domain, "Domain");
      };
    }

    const ipTd = tr.querySelector(".ip-cell");
    if (ipTd && addr && addr !== "(x)" && !addr.startsWith("(")) {
      ipTd.style.cursor = "pointer";
      ipTd.onclick = (e) => {
        e.stopPropagation();
        copyToClipboard(addr, "IP");
      };
    }

    return tr;
  }

  function copyToClipboard(text, label) {
    if (!text || text === "(x)" || text === "-") return;
    navigator.clipboard.writeText(text).then(() => {
      showCopyToast(`Copied ${label}: ${text}`);
    }).catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showCopyToast(`Copied ${label}: ${text}`);
    });
  }

  function showCopyToast(msg) {
    let toast = shadow.getElementById("copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "copy-toast";
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #00d9ff;
        color: #000;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 11.5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        z-index: 2147483647;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: none;
      `;
      shadow.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 1800);
  }

  function updateMiniBadge(tuples) {
    if (!tuples || tuples.length === 0) return;
    const main = tuples[0];
    const mainAddr = main[1] || "(x)";
    const mainAsn = main[8] ? ` [${main[8]}]` : "";
    const mainStatus = main[6] || 200;
    const mainLat = main[7] ? ` (${main[7]}ms)` : "";
    let totalHits = 0;
    let totalBytes = 0;
    tuples.forEach((t) => {
      totalHits += t[4] || 0;
      totalBytes += t[5] || 0;
    });
    const speedStr = currentSpeedBps >= 200 ? ` | ⚡ ${formatSpeed(currentSpeedBps)}` : "";
    const miniText = shadow.getElementById("mini-text");
    if (miniText) {
      miniText.textContent = `${mainAddr}${mainAsn} | ${mainStatus}${mainLat} | ${totalHits} req | ${formatBytes(totalBytes)}${speedStr}`;
    }
  }

  function calculateSpeed() {
    const now = Date.now();
    const dt = (now - lastBytesTimestamp) / 1000;
    if (dt <= 0.3) return;

    let currentTotalBytes = 0;
    const currentDomainBytes = {};

    allTuplesCache.forEach((t) => {
      const d = t[0];
      const b = t[5] || 0;
      currentTotalBytes += b;
      currentDomainBytes[d] = b;
    });

    const byteDiff = Math.max(0, currentTotalBytes - lastTotalBytes);
    const instantSpeed = byteDiff / dt;

    if (byteDiff > 0) {
      currentSpeedBps = (currentSpeedBps === 0) ? instantSpeed : (currentSpeedBps * 0.4 + instantSpeed * 0.6);
    } else {
      currentSpeedBps = currentSpeedBps * 0.5;
      if (currentSpeedBps < 200) currentSpeedBps = 0;
    }

    for (const [domain, b] of Object.entries(currentDomainBytes)) {
      const prevB = lastDomainBytes[domain] || 0;
      const dDiff = Math.max(0, b - prevB);
      if (dDiff > 0) {
        domainSpeedMap[domain] = (domainSpeedMap[domain] ? domainSpeedMap[domain] * 0.4 : 0) + (dDiff / dt) * 0.6;
      } else {
        domainSpeedMap[domain] = (domainSpeedMap[domain] || 0) * 0.5;
        if (domainSpeedMap[domain] < 200) delete domainSpeedMap[domain];
      }
    }

    lastTotalBytes = currentTotalBytes;
    lastDomainBytes = currentDomainBytes;
    lastBytesTimestamp = now;

    // Update Widget Header Speed Badge
    const speedEl = shadow.getElementById("widget-speed");
    if (speedEl) {
      if (currentSpeedBps >= 200) {
        speedEl.textContent = `⚡ ${formatSpeed(currentSpeedBps)}`;
        speedEl.style.display = "inline-flex";
      } else {
        speedEl.style.display = "none";
      }
    }

    // Update Mini Badge text
    updateMiniBadge(allTuplesCache);

    // Update active domain speed tags in visible table rows
    if (tbody) {
      for (let tr = tbody.firstChild; tr; tr = tr.nextSibling) {
        if (tr._domain && tr._tuple) {
          const dSpeed = domainSpeedMap[tr._domain] || 0;
          const sizeTd = tr.querySelector(".size-cell");
          if (sizeTd) {
            const bytes = tr._tuple[5] || 0;
            const speedHtml = dSpeed >= 200 ? ` <span class="speed-tag">⚡${formatSpeed(dSpeed)}</span>` : "";
            sizeTd.innerHTML = `${formatBytes(bytes)}${speedHtml}`;
          }
        }
      }
    }
  }

  setInterval(calculateSpeed, 800);

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
    allTuplesCache = tuples;
    reRenderTable();
  }

  function pushOne(tuple) {
    const domain = tuple[0];
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
