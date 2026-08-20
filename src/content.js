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
    } else if (currentSort.column === 'upstream') {
      const cmp = (a[9] || '').localeCompare(b[9] || '');
      if (cmp !== 0) {
        return currentSort.order === 'asc' ? cmp : -cmp;
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

    .upstream-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 700;
      background: rgba(0, 217, 255, 0.12);
      color: #00d9ff;
      border: 1px solid rgba(0, 217, 255, 0.35);
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .upstream-badge:hover {
      background: #00d9ff;
      color: #000;
    }
    .upstream-active {
      background: rgba(72, 255, 0, 0.15);
      color: #48ff00;
      border-color: rgba(72, 255, 0, 0.45);
    }
    .upstream-active:hover {
      background: #48ff00;
      color: #000;
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
      color: #ff2a85;
      background: rgba(255, 42, 133, 0.15);
      border: 1px solid rgba(255, 42, 133, 0.4);
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
      margin-right: 5px;
      padding: 1px 5px;
      font-size: 9px;
      font-weight: 700;
      color: #fff;
      background: #ff2a85;
      border-radius: 3px;
      line-height: 1.1;
      box-shadow: 0 1px 4px rgba(255, 42, 133, 0.4);
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

    /* BGP AS-Path Visualizer Modal */
    #bgp-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 2147483647 !important;
      display: none;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    #bgp-modal {
      width: 580px;
      max-width: 90vw;
      background: #141722;
      border: 1px solid #00d9ff;
      border-radius: 12px;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 217, 255, 0.25);
      color: #eee;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: modalPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes modalPop {
      from { transform: scale(0.88); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    #bgp-modal-header {
      background: #1b202e;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #283046;
    }

    #bgp-modal-header .title {
      font-size: 13.5px;
      font-weight: 700;
      color: #00d9ff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    #bgp-modal-close {
      background: none;
      border: none;
      color: #aaa;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      line-height: 1;
      padding: 2px 6px;
      border-radius: 4px;
    }
    #bgp-modal-close:hover {
      color: #ff5252;
      background: rgba(255, 82, 82, 0.15);
    }

    #bgp-modal-body {
      padding: 16px 18px;
      max-height: 70vh;
      overflow-y: auto;
      font-size: 12px;
    }

    .bgp-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    .bgp-card {
      background: #1c2130;
      border: 1px solid #2d364f;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .bgp-card-label {
      font-size: 10.5px;
      color: #8fa0b5;
      text-transform: uppercase;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .bgp-card-val {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      font-family: Consolas, Monaco, monospace;
    }

    .bgp-card-sub {
      font-size: 11px;
      color: #00d9ff;
      margin-top: 2px;
    }

    .bgp-path-container {
      background: #11141c;
      border: 1px solid #252b3d;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 14px;
    }

    .bgp-path-title {
      font-size: 11.5px;
      font-weight: 700;
      color: #ffd700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bgp-flow-wrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .bgp-node {
      background: #1a2233;
      border: 1px solid #334466;
      border-radius: 6px;
      padding: 6px 10px;
      text-align: center;
      min-width: 100px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .bgp-node-origin {
      border-color: #00d9ff;
      background: #002c38;
    }
    .bgp-node-client {
      border-color: #48ff00;
      background: #0d2e14;
    }
    .bgp-node-asn {
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      font-family: Consolas, Monaco, monospace;
    }
    .bgp-node-name {
      font-size: 9.5px;
      color: #b0c4de;
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .bgp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .bgp-table th {
      background: #181d2a;
      color: #8fa0b5;
      padding: 7px 10px;
      font-weight: 600;
      text-align: left;
      border-bottom: 1px solid #2d364f;
    }
    .bgp-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #202638;
      font-family: Consolas, Monaco, monospace;
    }
    .bgp-table tr:hover td {
      background: rgba(0, 217, 255, 0.08);
    }
    .bgp-rtt-fast { color: #48ff00; font-weight: 700; }
    .bgp-rtt-med { color: #ffd700; font-weight: 700; }
    .bgp-rtt-slow { color: #ff5252; font-weight: 700; }

    .bgp-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 12px;
    }

    .bgp-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .bgp-btn-mkt {
      background: #ff5722;
      color: #fff;
    }
    .bgp-btn-mkt:hover {
      background: #f4511e;
    }
    .bgp-btn-he {
      background: #00d9ff;
      color: #000;
    }
    .bgp-btn-he:hover {
      background: #33e1ff;
    }

    .bgp-loading {
      text-align: center;
      padding: 30px 20px;
      color: #00d9ff;
      font-weight: 600;
      font-size: 13px;
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
            <th id="th-upstream" style="text-align:center; cursor:pointer;" title="Sort Upstream (HalloNet LG)">Upstream <span class="sort-icon"></span></th>
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
    const cols = ["domain", "ip", "status", "latency", "hits", "size", "upstream", "bgp"];
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
  shadow.getElementById("th-upstream").onclick = () => setSort("upstream");
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
    const upstream = tuple[9] || "-";

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
    const speedHtml = dSpeed >= 200 ? `<span class="speed-tag">⚡${formatSpeed(dSpeed)}</span> ` : "";
    const upstreamHtml = (addr && addr !== "(x)" && !addr.startsWith("(") && upstream !== "-")
      ? `<span class="upstream-badge upstream-active" title="Klik untuk lihat Full Traceroute (HalloNet LG)">${upstream}</span>`
      : `<span style="color:#666;">${upstream}</span>`;

    tr.innerHTML = `
      <td class="domain-cell" title="Klik untuk copy: ${domain}">${lockIcon}${domain}</td>
      <td class="ip-cell ${ipClass}" title="Klik untuk copy: ${addr || '(x)'}">${addr || "(x)"}</td>
      <td style="text-align:center;"><span class="status-badge ${statusClass}">${status}</span></td>
      <td class="lat-cell ${latClass}">${latText}</td>
      <td class="hits-cell ${hits > 0 ? '' : 'hits-zero'}">${hits}</td>
      <td class="size-cell ${bytes > 0 ? '' : 'size-zero'}">${speedHtml}${formatBytes(bytes)}</td>
      <td class="upstream-cell" style="text-align:center;">${upstreamHtml}</td>
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

    const upstreamTd = tr.querySelector(".upstream-cell");
    if (upstreamTd && addr && addr !== "(x)" && !addr.startsWith("(")) {
      upstreamTd.style.cursor = "pointer";
      upstreamTd.onclick = (e) => {
        e.stopPropagation();
        openBgpVisualizer(addr, domain, asn);
      };
    }

    const bgpLink = tr.querySelector(".bgp-link");
    if (bgpLink) {
      bgpLink.onclick = (e) => {
        e.stopPropagation();
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
            const speedHtml = dSpeed >= 200 ? `<span class="speed-tag">⚡${formatSpeed(dSpeed)}</span> ` : "";
            sizeTd.innerHTML = `${speedHtml}${formatBytes(bytes)}`;
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

  // BGP / Traceroute Modal DOM
  const modalBackdrop = document.createElement("div");
  modalBackdrop.id = "bgp-modal-backdrop";
  modalBackdrop.innerHTML = `
    <div id="bgp-modal">
      <div id="bgp-modal-header">
        <div class="title">
          <span>🛰️ Live Traceroute & BGP AS-Path (HalloNet LG)</span>
        </div>
        <button id="bgp-modal-close" title="Tutup Modal">✕</button>
      </div>
      <div id="bgp-modal-body">
        <div class="bgp-loading">⏳ Menjalankan traceroute live...</div>
      </div>
    </div>
  `;
  shadow.appendChild(modalBackdrop);

  const modalCloseBtn = modalBackdrop.querySelector("#bgp-modal-close");
  modalCloseBtn.onclick = () => {
    modalBackdrop.style.display = "none";
  };
  modalBackdrop.onclick = (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.style.display = "none";
    }
  };

  async function openBgpVisualizer(addr, domain, asn) {
    if (!addr || addr === "(x)" || addr.startsWith("(")) {
      showCopyToast("IP tidak valid untuk Traceroute");
      return;
    }

    modalBackdrop.style.display = "flex";
    const body = modalBackdrop.querySelector("#bgp-modal-body");
    body.innerHTML = `
      <div class="bgp-loading">
        <div style="font-size: 26px; margin-bottom: 8px;">🛰️</div>
        Menjalankan Live Traceroute dari <strong>Looking Glass HalloNet</strong> ke <strong>${addr}</strong> (${domain})...
      </div>
    `;

    try {
      chrome.runtime.sendMessage({ cmd: "traceroute", ip: addr }, (res) => {
        if (res && res.status === "success" && res.hops && res.hops.length > 0) {
          renderTracerouteModalContent(res, domain, addr, asn);
        } else {
          // Fallback to BGP Looking Glass
          chrome.runtime.sendMessage({ cmd: "lookupBgpPath", ip: addr }, (bgpRes) => {
            if (bgpRes && !bgpRes.error) {
              renderBgpModalContent(bgpRes, domain, addr, asn);
            } else {
              body.innerHTML = `
                <div style="color:#ff5252; padding: 25px; text-align:center;">
                  ⚠️ Gagal mengambil rute: ${res?.error || bgpRes?.error || "Koneksi timeout"}
                </div>
              `;
            }
          });
        }
      });
    } catch (e) {
      body.innerHTML = `<div style="color:#ff5252; padding:25px; text-align:center;">Error: ${e.message}</div>`;
    }
  }

  function renderTracerouteModalContent(data, domain, addr, asn) {
    const body = modalBackdrop.querySelector("#bgp-modal-body");
    const hops = data.hops || [];
    const lastHop = hops[hops.length - 1] || {};
    const targetRtt = lastHop.rtt || "-";
    const targetAsn = lastHop.asn || asn || "Target Server";

    // Extract unique ASNs in order for the breadcrumb flow
    const uniqueAsns = [];
    const seenAsn = new Set();
    for (const h of hops) {
      if (h.asn) {
        const asCode = h.asn.split(" ")[0];
        if (!seenAsn.has(asCode)) {
          seenAsn.add(asCode);
          uniqueAsns.push({ asCode, fullName: h.asn });
        }
      }
    }

    let flowHtml = "";
    if (uniqueAsns.length > 0) {
      const nodes = uniqueAsns.map((item, idx) => {
        const isOrigin = idx === uniqueAsns.length - 1;
        const isClient = idx === 0;
        const nameParts = item.fullName.split(" - ");
        const shortName = nameParts.length > 1 ? nameParts[1] : item.fullName;
        return `
          <div class="bgp-node ${isOrigin ? 'bgp-node-origin' : (isClient ? 'bgp-node-client' : '')}">
            <div class="bgp-node-asn">${item.asCode}</div>
            <div class="bgp-node-name" title="${item.fullName}">${shortName}</div>
          </div>
        `;
      });

      flowHtml = `
        <div class="bgp-path-container">
          <div class="bgp-path-title">
            <span>🛣️ Jalur Transit ISP (AS-Path Breadcrumb)</span>
          </div>
          <div class="bgp-flow-wrapper">
            ${nodes.join('<span class="bgp-arrow">──▶</span>')}
          </div>
        </div>
      `;
    }

    // Build Hop table
    let tableRows = "";
    for (const h of hops) {
      const rttNum = parseFloat(h.rtt);
      let rttClass = "bgp-rtt-fast";
      if (isNaN(rttNum) || rttNum > 100) rttClass = "bgp-rtt-slow";
      else if (rttNum > 35) rttClass = "bgp-rtt-med";

      const asDisplay = h.asn ? `<span style="color:#00d9ff; font-weight:600;">${h.asn}</span>` : `<span style="color:#666;">-</span>`;

      tableRows += `
        <tr>
          <td style="text-align:center; font-weight:bold; color:#ffd700;">${h.hop}</td>
          <td>
            <div style="color:#fff; font-weight:600;">${h.ip}</div>
            <div style="font-size:10px; color:#8fa0b5;">${h.host !== h.ip ? h.host : ''}</div>
          </td>
          <td class="${rttClass}" style="text-align:right;">${h.rtt}</td>
          <td>${asDisplay}</td>
        </tr>
      `;
    }

    const cleanAsn = (targetAsn.split(" ")[0] || "").replace(/[^A-Z0-9]/g, "");
    const heUrl = cleanAsn.startsWith("AS") ? `https://bgp.he.net/${cleanAsn}` : `https://bgp.he.net/ip/${addr}`;
    const lgUrl = `https://lg.hallonet.id/?cmd=traceroute&target=${encodeURIComponent(addr)}`;

    body.innerHTML = `
      <div class="bgp-summary-grid">
        <div class="bgp-card">
          <div class="bgp-card-label">🎯 Target Host & IP</div>
          <div class="bgp-card-val">${addr}</div>
          <div class="bgp-card-sub">${domain}</div>
        </div>
        <div class="bgp-card">
          <div class="bgp-card-label">⚡ Traceroute Latency (RTT)</div>
          <div class="bgp-card-val" style="color:#48ff00;">${targetRtt}</div>
          <div class="bgp-card-sub">${data.hops_count || hops.length} Hops Total (${data.timestamp || 'Real-time'})</div>
        </div>
        <div class="bgp-card" style="grid-column: span 2;">
          <div class="bgp-card-label">🏢 Destination AS & ISP</div>
          <div class="bgp-card-val" style="color:#00d9ff;">${targetAsn}</div>
          <div class="bgp-card-sub" style="color:#ccc;">Source: gw-ixp.106-1.hallonet.id (AS151584 HalloNet)</div>
        </div>
      </div>

      ${flowHtml}

      <div class="bgp-path-container" style="padding:0; overflow:hidden;">
        <table class="bgp-table">
          <thead>
            <tr>
              <th style="width:40px; text-align:center;">Hop</th>
              <th>Host / Router IP</th>
              <th style="width:75px; text-align:right;">RTT</th>
              <th>ASN / Organization</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <div class="bgp-actions">
        <button id="btn-re-trace" class="bgp-btn" style="background:#334466; color:#fff;">🔄 Re-Run</button>
        <button id="btn-copy-mkt-rule" class="bgp-btn bgp-btn-mkt">📋 Copy MikroTik Address-List</button>
        <button id="btn-open-lg" class="bgp-btn" style="background:#2e7d32; color:#fff;">🌐 Looking Glass ↗</button>
        <button id="btn-open-he-bgp" class="bgp-btn bgp-btn-he">🌐 BGP.HE.NET ↗</button>
      </div>
    `;

    const reBtn = body.querySelector("#btn-re-trace");
    if (reBtn) {
      reBtn.onclick = () => {
        openBgpVisualizer(addr, domain, asn);
      };
    }

    const mktBtn = body.querySelector("#btn-copy-mkt-rule");
    if (mktBtn) {
      mktBtn.onclick = () => {
        const listName = "LIST_" + domain.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 20);
        const script = `/ip firewall address-list add list="${listName}" address=${addr} comment="${cleanAsn} ${domain}"`;
        copyToClipboard(script, "MikroTik Script");
      };
    }

    const lgBtn = body.querySelector("#btn-open-lg");
    if (lgBtn) {
      lgBtn.onclick = () => {
        window.open(lgUrl, "_blank");
      };
    }

    const heBtn = body.querySelector("#btn-open-he-bgp");
    if (heBtn) {
      heBtn.onclick = () => {
        window.open(heUrl, "_blank");
      };
    }
  }

  function renderBgpModalContent(data, domain, addr, asn) {
    const body = modalBackdrop.querySelector("#bgp-modal-body");
    const prefix = data.prefix || addr;
    const originAsn = data.originAsn || asn || "Unknown";
    const originHolder = data.originHolder || "Origin Autonomous System";
    const asNames = data.asNames || {};
    const paths = data.paths || [];

    // Construct primary path flow
    let pathHtml = "";
    if (paths.length > 0) {
      const primaryPath = paths[0];
      const flowNodes = [];

      primaryPath.forEach((as, idx) => {
        const isOrigin = idx === primaryPath.length - 1;
        const isClient = idx === 0;
        const asNum = as.startsWith("AS") ? as : `AS${as}`;
        const name = asNames[as] || (isOrigin ? originHolder : `Transit Provider`);
        const cleanName = name.split(" - ")[0] || name;

        flowNodes.push(`
          <div class="bgp-node ${isOrigin ? 'bgp-node-origin' : (isClient ? 'bgp-node-client' : '')}">
            <div class="bgp-node-asn">${asNum}</div>
            <div class="bgp-node-name" title="${name}">${cleanName}</div>
          </div>
        `);
      });

      pathHtml = `
        <div class="bgp-path-container">
          <div class="bgp-path-title">
            <span>🛣️ AS-Path Route (Global Ingress ➔ Origin)</span>
          </div>
          <div class="bgp-flow-wrapper">
            ${flowNodes.join('<span class="bgp-arrow">──▶</span>')}
          </div>
          <div style="font-size:11px; color:#8fa0b5; margin-top:8px;">
            • Total Hop AS: <strong>${primaryPath.length} AS</strong> &nbsp;|&nbsp; 
            • Total Jalur BGP Terdeteksi: <strong>${data.totalPaths || paths.length} rute global</strong>
          </div>
        </div>
      `;
    } else {
      pathHtml = `
        <div class="bgp-path-container" style="text-align:center; color:#999; padding: 15px;">
          Tidak ada data AS-Path aktif dari Looking Glass
        </div>
      `;
    }

    const cleanAsn = originAsn.split(" ")[0];
    const heUrl = cleanAsn.startsWith("AS") ? `https://bgp.he.net/${cleanAsn}` : `https://bgp.he.net/ip/${addr}`;

    body.innerHTML = `
      <div class="bgp-summary-grid">
        <div class="bgp-card">
          <div class="bgp-card-label">🎯 Target Host & IP</div>
          <div class="bgp-card-val">${addr}</div>
          <div class="bgp-card-sub">${domain}</div>
        </div>
        <div class="bgp-card">
          <div class="bgp-card-label">📡 BGP Announced Prefix</div>
          <div class="bgp-card-val" style="color:#00d9ff;">${prefix}</div>
          <div class="bgp-card-sub">Route Advertisement</div>
        </div>
        <div class="bgp-card" style="grid-column: span 2;">
          <div class="bgp-card-label">🏢 Origin Autonomous System</div>
          <div class="bgp-card-val" style="color:#48ff00;">${originAsn}</div>
          <div class="bgp-card-sub" style="color:#ccc;">${originHolder}</div>
        </div>
      </div>

      ${pathHtml}

      <div class="bgp-actions">
        <button id="btn-copy-mkt-rule" class="bgp-btn bgp-btn-mkt">📋 Copy MikroTik Address-List</button>
        <button id="btn-open-he-bgp" class="bgp-btn bgp-btn-he">🌐 Buka BGP.HE.NET ↗</button>
      </div>
    `;

    const mktBtn = body.querySelector("#btn-copy-mkt-rule");
    if (mktBtn) {
      mktBtn.onclick = () => {
        const listName = "LIST_" + domain.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 20);
        const script = `/ip firewall address-list add list="${listName}" address=${prefix} comment="${cleanAsn} ${originHolder.slice(0, 30)}"`;
        copyToClipboard(script, "MikroTik Script");
      };
    }

    const heBtn = body.querySelector("#btn-open-he-bgp");
    if (heBtn) {
      heBtn.onclick = () => {
        window.open(heUrl, "_blank");
      };
    }
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
