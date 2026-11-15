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

  const DFLAG_NO_TLS = 0x100;  // Unencrypted HTTP
  const DFLAG_H1 = 0x200;      // HTTP/1.x with TLS
  const DFLAG_H2 = 0x400;      // HTTP/2.x with TLS
  const DFLAG_H3 = 0x800;      // HTTP/3.x with TLS
  const DFLAG_CONNECTED = 0x1000;
  const DFLAG_WEBSOCKET = 0x2000;

  const domainProtoCache = new Map();
  function getDomainProtocol(domain, flags) {
    if (domainProtoCache.has(domain)) {
      return domainProtoCache.get(domain);
    }
    let res = "";
    if (flags & DFLAG_WEBSOCKET) {
      res = "WS";
    } else if (flags & DFLAG_H3) {
      res = "H3";
    } else if (flags & DFLAG_H2) {
      res = "H2";
    } else if (flags & DFLAG_H1) {
      res = "H1";
    }

    if (!res && typeof performance !== "undefined" && typeof performance.getEntriesByType === "function") {
      try {
        const entries = performance.getEntriesByType("resource");
        for (let i = entries.length - 1; i >= 0; i--) {
          const entry = entries[i];
          if (entry.name && entry.name.includes(domain) && entry.nextHopProtocol) {
            const p = entry.nextHopProtocol.toLowerCase();
            if (p === "h3" || p.includes("quic")) {
              res = "H3";
              break;
            } else if (p === "h2") {
              res = "H2";
              break;
            } else if (p.includes("http/1")) {
              res = "H1";
              break;
            }
          }
        }
        if (!res) {
          const navEntries = performance.getEntriesByType("navigation");
          if (navEntries && navEntries.length > 0) {
            const nav = navEntries[0];
            if (nav.name && nav.name.includes(domain) && nav.nextHopProtocol) {
              const p = nav.nextHopProtocol.toLowerCase();
              if (p === "h3" || p.includes("quic")) res = "H3";
              else if (p === "h2") res = "H2";
              else if (p.includes("http/1")) res = "H1";
            }
          }
        }
      } catch (e) {}
    }

    if (!res && (flags & DFLAG_NO_TLS)) {
      res = "HTTP";
    }

    if (res) {
      domainProtoCache.set(domain, res);
    }
    return res;
  }

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

  // Klasifikasi Jalur Trafik: IIX, CDN, INTERN
  function classifyTraffic(addr, domain, asn, latency) {
    if (!addr || addr === "(x)" || addr === "(lost)" || addr.startsWith("(")) {
      return { code: "UNKNOWN", label: "-", class: "badge-unknown", desc: "No IP address" };
    }

    // Check Private / LAN
    if (addr.startsWith("10.") || addr.startsWith("192.168.") || addr.startsWith("127.") ||
        addr.startsWith("169.254.") || addr === "::1" || addr.startsWith("fc00:") || addr.startsWith("fe80:") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(addr) ||
        /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(addr)) {
      return { code: "LAN", label: "[LAN / Local]", class: "badge-lan", desc: "Local / Private Network IP" };
    }

    const d = (domain || "").toLowerCase();
    const a = (asn || "").toUpperCase();
    const lat = typeof latency === "number" ? latency : parseFloat(latency) || 0;

    // Check 2-letter ISO country code from ASN string (e.g. "AS15169 ID" or "AS7713 ID")
    const ccMatch = a.match(/\b([A-Z]{2})\b/);
    const country = ccMatch ? ccMatch[1] : "";
    const isIdCountry = country === "ID";
    const isIdAsnListed = typeof isIndonesianAsn === "function" ? isIndonesianAsn(a) : false;

    // Known Global CDNs / Hyperscalers
    const cdnAsnRegex = /\b(AS15169|AS13335|AS20940|AS16625|AS32787|AS54113|AS32934|AS2906|AS16509|AS8075|AS7195|AS209242)\b/;
    const cdnDomainRegex = /(googlevideo|googleusercontent|gstatic|ggpht|gvt1|fbcdn|cdninstagram|tiktokcdn|byteoversea|ibytedtos|fastly|cloudflare|cloudfront|akamaized|akamaihd|edgesuite|edgekey|nflxvideo|nflxso|nflxext|azureedge|msedge)\./;
    const isCdnAsn = cdnAsnRegex.test(a) || /GOOGLE|CLOUDFLARE|AKAMAI|FASTLY|FACEBOOK|META|NETFLIX|AMAZON|CLOUDFRONT|MICROSOFT/i.test(a);
    const isCdnDomain = cdnDomainRegex.test(d);

    // 1. [CDN]
    // Trafik yang ditarik dari Google/Meta/Akamai/Cloudflare Edge server yang ada di dalam ISP / lokal
    if (isCdnAsn || isCdnDomain) {
      if ((lat > 0 && lat <= 32) || /googlevideo|fbcdn|tiktokcdn/i.test(d)) {
        return {
          code: "CDN",
          label: "[CDN]",
          class: "badge-cdn",
          desc: "Trafik ditarik dari Google/Meta/Akamai/Cloudflare Edge server di ISP / lokal"
        };
      }
      if (lat > 35) {
        return {
          code: "INTL",
          label: "[INTERN]",
          class: "badge-intl",
          desc: `Trafik CDN ditarik dari origin internasional (${country || "Singapura/Global"})`
        };
      }
    }

    // 2. [IIX]
    // Trafik domestik Indonesia via OpenIXP/IIX/CDIX
    // Menggunakan database resmi ASN Indonesia (id_asn) atau WHOIS ID
    const isIdAsnRegex = /INDONESIA|TELKOM|BIZNET|MORATEL|APJII|IDNIC|CBN|FIRSTMEDIA|LINKNET|INDOSAT|XL|SMARTFREN|HALLONET|IFORTE|FIBERSTAR/i.test(a);
    if (isIdAsnListed || isIdCountry || isIdAsnRegex) {
      return {
        code: "IIX",
        label: "[IIX]",
        class: "badge-iix",
        desc: "Trafik domestik Indonesia via OpenIXP/IIX/CDIX"
      };
    }

    // Fallback: Indonesian domain TLD (.id) only if not confirmed foreign country
    const isIdDomain = /\.(id|co\.id|go\.id|ac\.id|my\.id|web\.id|biz\.id|sch\.id|net\.id|or\.id)$/i.test(d);
    if (isIdDomain && (!country || country === "ID")) {
      return {
        code: "IIX",
        label: "[IIX]",
        class: "badge-iix",
        desc: "Trafik domestik Indonesia via OpenIXP/IIX/CDIX"
      };
    }

    // 3. [INTERN]
    // Trafik yang keluar lewat kabel laut ke Singapura / Hong Kong / AS
    if (country && country !== "ID") {
      return {
        code: "INTL",
        label: "[INTERN]",
        class: "badge-intl",
        desc: `Trafik keluar lewat kabel laut ke luar negeri (${country})`
      };
    }

    if (lat > 40) {
      return {
        code: "INTL",
        label: "[INTERN]",
        class: "badge-intl",
        desc: "Trafik keluar lewat kabel laut ke Singapura / Hong Kong / AS"
      };
    }

    if (lat > 0 && lat <= 32) {
      return {
        code: "IIX",
        label: "[IIX]",
        class: "badge-iix",
        desc: "Trafik domestik Indonesia via OpenIXP/IIX/CDIX"
      };
    }

    return {
      code: "INTL",
      label: "[INTERN]",
      class: "badge-intl",
      desc: "Trafik keluar lewat kabel laut ke Singapura / Hong Kong / AS"
    };
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
      width: 790px;
      min-width: 740px;
      max-width: calc(100vw - 24px);
      max-height: 85vh;
      background: rgba(18, 20, 26, 0.96);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      color: #eee;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 10px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 2px rgba(0, 217, 255, 0.3);
      font-size: 11px;
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

    .btn-export {
      background: rgba(0, 217, 255, 0.15);
      color: #00d9ff;
      border-color: rgba(0, 217, 255, 0.35);
    }
    .btn-export:hover {
      background: rgba(0, 217, 255, 0.35);
      color: #fff;
    }

    .btn-grabber {
      background: rgba(124, 58, 237, 0.2);
      color: #c084fc;
      border-color: rgba(124, 58, 237, 0.45);
    }
    .btn-grabber:hover {
      background: #7c3aed;
      color: #fff;
      box-shadow: 0 0 8px rgba(124, 58, 237, 0.6);
    }

    #table-wrap {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: calc(85vh - 44px);
      padding: 4px 6px;
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

    .route-badge {
      display: inline-block;
      padding: 1.5px 5.5px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      white-space: nowrap;
      cursor: help;
      line-height: 1.2;
    }
    .badge-iix {
      background: rgba(0, 230, 118, 0.16);
      color: #00e676;
      border: 1px solid rgba(0, 230, 118, 0.45);
    }
    .badge-cdn {
      background: rgba(0, 217, 255, 0.16);
      color: #00d9ff;
      border: 1px solid rgba(0, 217, 255, 0.45);
    }
    .badge-intl {
      background: rgba(255, 145, 0, 0.18);
      color: #ff9100;
      border: 1px solid rgba(255, 145, 0, 0.45);
    }
    .badge-lan {
      background: rgba(255, 255, 255, 0.08);
      color: #bbb;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .badge-unknown {
      color: #666;
    }
    .status-2xx { background: rgba(76, 175, 80, 0.2); color: #48ff00; }
    .status-3xx { background: rgba(33, 150, 243, 0.2); color: #64b5f6; }
    .status-4xx { background: rgba(255, 152, 0, 0.25); color: #ffa726; }
    .status-5xx, .status-err { background: rgba(244, 67, 54, 0.3); color: #ff5252; font-weight: bold; }

    .lat-cell {
      font-family: Consolas, Monaco, monospace;
      font-size: 10.5px;
      text-align: right;
      white-space: nowrap;
    }
    .lat-fastest { color: #00ff88; font-weight: bold; }
    .lat-regional { color: #00d9ff; }
    .lat-medium { color: #fbbf24; }
    .lat-slow { color: #ff5252; font-weight: bold; }
    .lat-na { color: #777; }

    .proto-badge {
      display: inline-block;
      font-size: 9px;
      font-family: Consolas, Monaco, monospace;
      font-weight: 700;
      padding: 1px 3.5px;
      border-radius: 3px;
      margin-right: 4px;
      line-height: 1.1;
      vertical-align: middle;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .proto-h3 {
      background: #7c3aed;
      color: #ffffff;
      box-shadow: 0 0 5px rgba(124, 58, 237, 0.4);
    }
    .proto-h2 {
      background: #0284c7;
      color: #ffffff;
    }
    .proto-h1 {
      background: #475569;
      color: #e2e8f0;
    }
    .proto-ws {
      background: #d97706;
      color: #ffffff;
    }
    .proto-http {
      background: #dc2626;
      color: #ffffff;
    }

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
        <button id="btn-export-csv" class="btn btn-export" title="Export Session ke CSV">CSV</button>
        <button id="btn-export-txt" class="btn btn-export" title="Export Session ke TXT">TXT</button>
        <button id="btn-linkgrabber" class="btn btn-grabber" title="Ekstrak Semua Link di Halaman Ini (Link Grabber)">LINKGRABBER</button>
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
            <th id="th-latency" style="text-align:right; cursor:pointer;" title="Sort Response Latency">Latency <span class="sort-icon"></span></th>
            <th id="th-status" style="text-align:center; cursor:pointer;" title="Sort HTTP Status Code">Status <span class="sort-icon"></span></th>
            <th id="th-hits" style="text-align:center; cursor:pointer;" title="Sort Hits">Hits <span class="sort-icon"></span></th>
            <th id="th-size" style="text-align:right; cursor:pointer;" title="Sort Payload Size">Size <span class="sort-icon"></span></th>
            <th id="th-bgp" style="text-align:left; cursor:pointer;" title="Sort BGP / ASN">BGP / ASN <span class="sort-icon"></span></th>
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
    const cols = ["domain", "ip", "latency", "status", "hits", "size", "bgp"];
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

  // Export Functions
  function triggerDownload(content, filename, mimeType) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      (document.body || document.documentElement).appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1500);
    } catch (e) {
      console.error("Export download error:", e);
    }
  }

  function getExportFilename(mainDomain, ext) {
    const host = (mainDomain || location.hostname || "session").replace(/[^a-zA-Z0-9.-]/g, "_");
    const d = new Date();
    const pad2 = (n) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
    return `ipvfoo_${host}_${dateStr}.${ext}`;
  }

  function getExportProtocol(flags, domain) {
    if (domain) {
      const p = getDomainProtocol(domain, flags);
      if (p) return p;
    }
    if (flags & DFLAG_WEBSOCKET) return "WS";
    if (flags & DFLAG_H3) return "H3";
    if (flags & DFLAG_H2) return "H2";
    if (flags & DFLAG_H1) return "H1";
    if (flags & DFLAG_NO_TLS) return "HTTP";
    return "HTTPS";
  }

  function exportCsvSession(tuples, mainDomain) {
    if (!tuples || tuples.length === 0) {
      showCopyToast("Tidak ada data session untuk di-export");
      return;
    }
    const header = ["Domain", "IP Address", "Latency (ms)", "Status Code", "Hits", "Bytes", "Size Formatted", "IP Version", "Protocol", "BGP / ASN"];
    const rows = [header.map(c => `"${c}"`).join(",")];

    tuples.forEach(t => {
      const domain = t[0] || "";
      const addr = t[1] || "";
      const ver = t[2] || "";
      const flags = t[3] || 0;
      const hits = t[4] !== undefined ? t[4] : 0;
      const bytes = t[5] !== undefined ? t[5] : 0;
      const status = t[6] !== undefined ? t[6] : 200;
      const latency = t[7] !== undefined ? t[7] : 0;
      const asn = t[8] || "";
      const proto = getExportProtocol(flags, domain);

      const row = [
        domain,
        addr,
        latency,
        status,
        hits,
        bytes,
        formatBytes(bytes),
        ver,
        proto,
        asn
      ];

      rows.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));
    });

    const csvContent = rows.join("\r\n");
    const filename = getExportFilename(mainDomain, "csv");
    triggerDownload(csvContent, filename, "text/csv;charset=utf-8;");
    showCopyToast(`✅ Exported CSV (${tuples.length} baris)`);
  }

  function exportTxtSession(tuples, mainDomain) {
    if (!tuples || tuples.length === 0) {
      showCopyToast("Tidak ada data session untuk di-export");
      return;
    }
    const now = new Date();
    const dateStr = now.toISOString().replace("T", " ").substring(0, 19);
    let totalHits = 0;
    let totalBytes = 0;
    tuples.forEach(t => {
      totalHits += t[4] || 0;
      totalBytes += t[5] || 0;
    });

    const lines = [];
    lines.push(`Target / Main Host : ${mainDomain || (tuples[0] ? tuples[0][0] : "-")}`);
    lines.push(`Export Time        : ${dateStr}`);
    lines.push(`Total Domains      : ${tuples.length}`);
    lines.push(`Total Requests     : ${totalHits} reqs`);
    lines.push(`Total Bandwidth    : ${formatBytes(totalBytes)}`);
    lines.push("-".repeat(128));
    lines.push("");

    const pad = (str, len, align = "left") => {
      str = String(str ?? "");
      if (str.length > len) {
        return align === "left" ? str.substring(0, len - 2) + ".." : ".." + str.substring(str.length - (len - 2));
      }
      return align === "left" ? str.padEnd(len, " ") : str.padStart(len, " ");
    };

    lines.push(
      pad("Domain", 30) + " " +
      pad("IP Address", 20) + " " +
      pad("Latency", 9, "right") + " " +
      pad("Status", 7) + " " +
      pad("Hits", 6, "right") + " " +
      pad("Size", 10, "right") + " " +
      pad("Ver", 4) + " " +
      pad("Proto", 6) + "  " +
      "BGP / ASN Organization"
    );
    lines.push("-".repeat(128));

    tuples.forEach(t => {
      const domain = t[0] || "";
      const addr = t[1] || "";
      const ver = t[2] || "";
      const flags = t[3] || 0;
      const hits = t[4] !== undefined ? t[4] : 0;
      const bytes = t[5] !== undefined ? t[5] : 0;
      const status = t[6] !== undefined ? t[6] : 200;
      const rawLat = t[7] !== undefined ? t[7] : 0;
      const latency = rawLat > 0 ? `${rawLat} ms` : "-";
      const asn = t[8] || "-";
      const proto = getExportProtocol(flags, domain);

      lines.push(
        pad(domain, 30) + " " +
        pad(addr, 20) + " " +
        pad(latency, 9, "right") + " " +
        pad(status, 7) + " " +
        pad(hits, 6, "right") + " " +
        pad(formatBytes(bytes), 10, "right") + " " +
        pad(ver, 4) + " " +
        pad(proto, 6) + "  " +
        asn
      );
    });

    lines.push("-".repeat(128));

    const txtContent = lines.join("\r\n");
    const filename = getExportFilename(mainDomain, "txt");
    triggerDownload(txtContent, filename, "text/plain;charset=utf-8;");
    showCopyToast(`✅ Exported TXT (${tuples.length} baris)`);
  }

  // Buttons
  shadow.getElementById("btn-export-csv").onclick = () => {
    exportCsvSession(allTuplesCache, allTuplesCache[0] ? allTuplesCache[0][0] : location.hostname);
  };

  shadow.getElementById("btn-export-txt").onclick = () => {
    exportTxtSession(allTuplesCache, allTuplesCache[0] ? allTuplesCache[0][0] : location.hostname);
  };

  shadow.getElementById("btn-linkgrabber").onclick = () => {
    openGrabberInNewTab();
  };

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
      } catch (e) { }
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

    const lockIcon = (flags & (DFLAG_H1 | DFLAG_H2 | DFLAG_H3) || !(flags & DFLAG_NO_TLS)) ? "🔒 " : "";
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

    const proto = getDomainProtocol(domain, flags);
    let protoBadge = "";
    if (proto === "H3") {
      protoBadge = `<span class="proto-badge proto-h3" title="HTTP/3 (QUIC / UDP)">H3</span>`;
    } else if (proto === "H2") {
      protoBadge = `<span class="proto-badge proto-h2" title="HTTP/2 (Multiplexed TCP)">H2</span>`;
    } else if (proto === "H1") {
      protoBadge = `<span class="proto-badge proto-h1" title="HTTP/1.1 (TLS)">H1</span>`;
    } else if (proto === "WS") {
      protoBadge = `<span class="proto-badge proto-ws" title="WebSocket">WS</span>`;
    } else if (proto === "HTTP") {
      protoBadge = `<span class="proto-badge proto-http" title="HTTP (No TLS / Plaintext)">HTTP</span>`;
    }

    let latClass = "lat-fastest";
    let latText = `${latency} ms`;
    let latTitle = `${latency} ms - Local / IIX / Cache Sangat Cepat (< 30ms)`;
    if (latency <= 0) {
      latClass = "lat-na";
      latText = "-";
      latTitle = "Latency tidak tersedia";
    } else if (latency <= 30) {
      latClass = "lat-fastest";
      latTitle = `${latency} ms - Local / IIX / Cache Sangat Cepat (< 30ms)`;
    } else if (latency <= 80) {
      latClass = "lat-regional";
      latTitle = `${latency} ms - Regional Asia Tenggara / SG (30 - 80ms)`;
    } else if (latency <= 180) {
      latClass = "lat-medium";
      latTitle = `${latency} ms - Asia Timur / US West (80 - 180ms)`;
    } else {
      latClass = "lat-slow";
      latTitle = `${latency} ms - High Latency / Rute Jauh (> 180ms)`;
    }

    let bgpDisplay = "bgp";
    let bgpFull = asn || "bgp";
    let bgpHref = `https://bgp.he.net/ip/${addr}`;
    if (asn) {
      const maxLen = 22;
      bgpDisplay = asn.length > maxLen ? asn.substring(0, maxLen - 2) + ".." : asn;
    }

    const bgpHtml = (addr && addr !== "(x)" && !addr.startsWith("("))
      ? `<a href="${bgpHref}" target="_blank" class="bgp-link" title="${bgpFull} (Klik untuk lookup BGP IP: ${addr})">${bgpDisplay}</a>`
      : `<span style="color:#666;">-</span>`;

    const dSpeed = domainSpeedMap[domain] || 0;
    const speedHtml = dSpeed >= 200 ? `<span class="speed-tag">⚡${formatSpeed(dSpeed)}</span> ` : "";

    tr.innerHTML = `
      <td class="domain-cell" title="Klik untuk copy: ${domain}">${lockIcon}${domain}</td>
      <td class="ip-cell ${ipClass}" title="Klik untuk copy: ${addr || '(x)'}">${addr || "(x)"}</td>
      <td class="lat-cell ${latClass}" title="${latTitle}">${latText}</td>
      <td style="text-align:center; white-space:nowrap;">${protoBadge}<span class="status-badge ${statusClass}">${status}</span></td>
      <td class="hits-cell ${hits > 0 ? '' : 'hits-zero'}">${hits}</td>
      <td class="size-cell ${bytes > 0 ? '' : 'size-zero'}">${speedHtml}${formatBytes(bytes)}</td>
      <td class="bgp-cell" style="text-align:left;">${bgpHtml}</td>
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
      ipTd.title = `Klik untuk copy IP: ${addr}`;
      ipTd.onclick = (e) => {
        e.stopPropagation();
        copyToClipboard(addr, "IP");
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
      miniText.textContent = `${mainAddr} | ${mainStatus}${mainLat} | ${totalHits} req | ${formatBytes(totalBytes)}${speedStr}`;
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
        <div class="bgp-card">
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

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function extractAllPageAssets() {
    const assets = [];
    const seenUrls = new Set();

    function addAsset(type, url, title, extra = {}) {
      if (!url) return;
      url = String(url).trim();
      if (!url || url.startsWith("javascript:") || url.startsWith("mailto:") || url.startsWith("tel:") || url === "#") return;

      let fullUrl = url;
      let isBase64 = url.startsWith("data:");
      if (!isBase64) {
        try {
          fullUrl = new URL(url, window.location.href).href;
        } catch (e) {
          return;
        }
      }

      if (seenUrls.has(fullUrl)) return;
      seenUrls.add(fullUrl);

      let hostname = "";
      let ext = "";

      if (isBase64) {
        const m = fullUrl.match(/^data:([^;]+);/);
        ext = m ? m[1].replace("image/", "") : "base64";
        hostname = "inline:base64";
      } else {
        try {
          const u = new URL(fullUrl);
          hostname = u.hostname;
          const pathname = u.pathname;
          const dotIdx = pathname.lastIndexOf(".");
          if (dotIdx !== -1) {
            ext = pathname.substring(dotIdx + 1).toLowerCase().split(/[\?#]/)[0];
          }
        } catch (e) {}
      }

      let category = type;
      if (category === "auto") {
        if (isBase64 || ["png", "jpg", "jpeg", "webp", "gif", "svg", "ico", "bmp", "avif"].includes(ext)) {
          category = "image";
        } else if (["mp4", "webm", "ogg", "mp3", "wav", "m4a", "flac"].includes(ext)) {
          category = "media";
        } else if (["pdf", "doc", "docx", "xls", "xlsx", "zip", "rar", "7z", "tar", "gz", "txt", "csv"].includes(ext)) {
          category = "doc";
        } else if (["js", "mjs", "css"].includes(ext)) {
          category = "code";
        } else {
          category = "link";
        }
      }

      assets.push({
        category: category,
        url: fullUrl,
        title: title || ext || hostname,
        hostname: hostname,
        ext: ext || (category === "image" ? "img" : "url"),
        isBase64: isBase64,
        ...extra
      });
    }

    // 1. Hyperlinks <a href>
    document.querySelectorAll('a[href]').forEach(el => {
      const text = (el.textContent || el.title || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
      addAsset("auto", el.href, text);
    });

    // 2. Images <img>
    document.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("srcset");
      if (!src) return;
      const alt = (img.alt || img.title || "").trim();
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      addAsset("image", src, alt || `Image ${w ? w + 'x' + h : ''}`, {
        width: w,
        height: h
      });
    });

    // 3. Picture source <source srcset>
    document.querySelectorAll('picture source, video source, audio source').forEach(s => {
      const src = s.srcset || s.src;
      if (src) {
        const firstSrc = src.split(",")[0].trim().split(" ")[0];
        const isMedia = s.parentElement && (s.parentElement.tagName === "VIDEO" || s.parentElement.tagName === "AUDIO");
        addAsset(isMedia ? "media" : "image", firstSrc, "Source Asset");
      }
    });

    // 4. Video & Audio tags
    document.querySelectorAll('video, audio').forEach(m => {
      if (m.src) {
        addAsset("media", m.src, `${m.tagName.toLowerCase()} player`);
      }
    });

    // 5. CSS Background Images
    document.querySelectorAll('*').forEach(el => {
      try {
        const bg = window.getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none" && bg.includes("url(")) {
          const matches = bg.match(/url\(['"]?([^'"]+)['"]?\)/g);
          if (matches) {
            matches.forEach(m => {
              const clean = m.replace(/^url\(['"]?/, "").replace(/['"]?\)$/, "");
              addAsset("image", clean, "CSS Background");
            });
          }
        }
      } catch (e) {}
    });

    // 6. Favicon & Icons
    document.querySelectorAll('link[rel*="icon"]').forEach(l => {
      if (l.href) addAsset("image", l.href, `Favicon (${l.rel})`);
    });

    // 7. Stylesheets <link rel="stylesheet">
    document.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
      if (l.href) addAsset("code", l.href, "Stylesheet CSS");
    });

    // 8. Scripts <script src>
    document.querySelectorAll('script[src]').forEach(s => {
      if (s.src) addAsset("code", s.src, "JavaScript");
    });

    return assets;
  }

  function openGrabberInNewTab() {
    const assets = extractAllPageAssets();
    const sourceUrl = window.location.href;
    const sourceHost = window.location.hostname;

    showCopyToast(`🚀 Membuka Grabber (${assets.length} aset) di Tab Baru...`);

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asset & Link Grabber - ${escapeHtml(sourceHost)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background: #0d0f17;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #151824;
      border-bottom: 1px solid #232738;
      padding: 14px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand h1 {
      font-size: 18px;
      font-weight: 700;
      color: #c084fc;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand .source-link {
      font-size: 12px;
      color: #00d9ff;
      text-decoration: none;
      max-width: 450px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
    .brand .source-link:hover { text-decoration: underline; }
    .header-badge {
      background: rgba(124, 58, 237, 0.25);
      border: 1px solid rgba(124, 58, 237, 0.45);
      color: #e9d5ff;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .main-wrap {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 20px 28px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .toolbar-card {
      background: #151824;
      border: 1px solid #232738;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .tabs-row {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .tab-btn {
      background: #0d0f17;
      border: 1px solid #282d42;
      color: #94a3b8;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background: #1e2337;
      color: #fff;
      border-color: #7c3aed;
    }
    .tab-btn.active {
      background: #7c3aed;
      color: #fff;
      border-color: #9333ea;
      box-shadow: 0 0 12px rgba(124, 58, 237, 0.45);
    }
    .tab-badge {
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
      padding: 1px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      font-family: Consolas, Monaco, monospace;
      letter-spacing: 0.3px;
    }
    .tab-btn.active .tab-badge {
      background: rgba(255, 255, 255, 0.28);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 0 6px rgba(255, 255, 255, 0.25);
    }

    .filter-actions-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-input {
      flex: 1;
      min-width: 250px;
      background: #0d0f17;
      border: 1px solid #282d42;
      border-radius: 8px;
      padding: 8px 14px;
      color: #fff;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-input:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 8px rgba(124, 58, 237, 0.3);
    }

    .btn {
      font-size: 12px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
      text-decoration: none;
    }
    .btn-primary {
      background: #0284c7;
      color: #fff;
      border-color: #0369a1;
    }
    .btn-primary:hover { background: #0369a1; }
    .btn-purple {
      background: #7c3aed;
      color: #fff;
      border-color: #6d28d9;
    }
    .btn-purple:hover { background: #6d28d9; }
    .btn-outline {
      background: #0d0f17;
      color: #cbd5e1;
      border-color: #282d42;
    }
    .btn-outline:hover {
      background: #1e2337;
      color: #fff;
      border-color: #7c3aed;
    }

    .options-row {
      display: flex;
      gap: 20px;
      font-size: 12.5px;
      color: #94a3b8;
      align-items: center;
      flex-wrap: wrap;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      user-select: none;
    }
    .checkbox-label input {
      cursor: pointer;
      accent-color: #7c3aed;
      width: 15px;
      height: 15px;
    }

    .view-toggle {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }
    .view-btn {
      background: #0d0f17;
      border: 1px solid #282d42;
      color: #888;
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
    }
    .view-btn.active {
      background: #7c3aed;
      color: #fff;
      border-color: #7c3aed;
    }

    .content-container {
      background: #151824;
      border: 1px solid #232738;
      border-radius: 10px;
      overflow: hidden;
      padding: 12px;
    }

    .asset-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .asset-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      background: #0d0f17;
      border: 1px solid rgba(255, 255, 255, 0.04);
      transition: background 0.15s, border-color 0.15s;
    }
    .asset-item:hover {
      background: #161a29;
      border-color: rgba(124, 58, 237, 0.4);
    }
    .item-num {
      color: #64748b;
      font-size: 11px;
      font-family: monospace;
      min-width: 32px;
      text-align: right;
    }
    .item-thumb {
      width: 46px;
      height: 46px;
      border-radius: 6px;
      background: #000;
      border: 1px solid #282d42;
      object-fit: contain;
      flex-shrink: 0;
      cursor: pointer;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .item-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-family: monospace;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .badge-image { background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4); }
    .badge-link { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
    .badge-media { background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }
    .badge-doc { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
    .badge-code { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
    .badge-base64 { background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.4); }

    .item-dim {
      font-size: 10px;
      color: #94a3b8;
      font-family: monospace;
      white-space: nowrap;
    }
    .item-host {
      background: rgba(0, 217, 255, 0.12);
      color: #38bdf8;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .item-title {
      color: #cbd5e1;
      font-size: 12px;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-url {
      flex: 1;
      color: #c084fc;
      text-decoration: none;
      font-family: monospace;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      word-break: break-all;
    }
    .item-url:hover {
      text-decoration: underline;
      color: #e9d5ff;
    }
    .item-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-shrink: 0;
    }
    .btn-action {
      background: #1e2337;
      border: 1px solid #333952;
      color: #cbd5e1;
      border-radius: 6px;
      padding: 4px 9px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.15s;
      white-space: nowrap;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-action:hover {
      background: #7c3aed;
      color: #fff;
      border-color: #7c3aed;
    }
    .btn-action-b64 {
      border-color: rgba(236, 72, 153, 0.45);
      color: #f472b6;
    }
    .btn-action-b64:hover {
      background: #ec4899;
      color: #fff;
      border-color: #ec4899;
    }

    .asset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      padding: 8px;
    }
    .grid-card {
      background: #0d0f17;
      border: 1px solid #282d42;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s;
    }
    .grid-card:hover {
      transform: translateY(-3px);
      border-color: #7c3aed;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .grid-img-wrap {
      height: 150px;
      background: #05060a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .grid-img-wrap img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .grid-body {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .grid-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      font-family: monospace;
      color: #94a3b8;
    }
    .grid-title {
      font-size: 11.5px;
      color: #cbd5e1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .grid-actions {
      display: flex;
      gap: 4px;
      margin-top: auto;
    }
    .grid-actions .btn-action {
      flex: 1;
      justify-content: center;
      font-size: 10.5px;
      padding: 5px 4px;
    }

    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }

    #toast {
      position: fixed;
      bottom: 24px;
      right: 28px;
      background: #1e1b4b;
      color: #c084fc;
      border: 1px solid #7c3aed;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
      pointer-events: none;
      z-index: 1000;
    }
    #toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <h1>📦 Content & Asset Grabber</h1>
      <span class="header-badge" id="header-total-count">0 items</span>
      <a href="${escapeHtml(sourceUrl)}" target="_blank" class="source-link" title="Buka website asli">🌐 ${escapeHtml(sourceUrl)}</a>
    </div>
  </header>

  <div class="main-wrap">
    <div class="toolbar-card">
      <div class="tabs-row" id="tabs-bar">
        <button class="tab-btn active" data-tab="all">🌟 Semua <span class="tab-badge" id="count-all">0</span></button>
        <button class="tab-btn" data-tab="image">🖼️ Gambar (PNG/B64) <span class="tab-badge" id="count-image">0</span></button>
        <button class="tab-btn" data-tab="link">🔗 Links <span class="tab-badge" id="count-link">0</span></button>
        <button class="tab-btn" data-tab="media">🎬 Video & Audio <span class="tab-badge" id="count-media">0</span></button>
        <button class="tab-btn" data-tab="doc">📄 Dokumen <span class="tab-badge" id="count-doc">0</span></button>
        <button class="tab-btn" data-tab="code">⚡ Scripts & CSS <span class="tab-badge" id="count-code">0</span></button>
      </div>

      <div class="filter-actions-row">
        <input type="text" id="search-input" class="search-input" placeholder="Ketik untuk filter: nama file, domain, ekstensi .png, base64, dll..." autofocus />
        <button id="btn-copy-urls" class="btn btn-primary" title="Copy semua URL yang tampil">📋 Copy URLs (<span id="copy-count">0</span>)</button>
        <button id="btn-export-txt" class="btn btn-purple" title="Download daftar URL sebagai file teks">📥 Export TXT</button>
        
        <div class="view-toggle">
          <button id="btn-view-list" class="view-btn active" title="Tampilan List">☰ List</button>
          <button id="btn-view-grid" class="view-btn" title="Tampilan Grid Galeri">⊞ Grid</button>
        </div>
      </div>

      <div class="options-row">
        <label class="checkbox-label"><input type="checkbox" id="opt-dedup" checked /> Hide duplicate URLs</label>
        <label class="checkbox-label"><input type="checkbox" id="opt-diff-origin" /> Hide same origin (<span id="curr-origin">${escapeHtml(sourceHost)}</span>)</label>
        <label class="checkbox-label"><input type="checkbox" id="opt-group" /> Group by domain</label>
      </div>
    </div>

    <div class="content-container">
      <div id="content-area"></div>
    </div>
  </div>

  <div id="toast"></div>

  <script>
    const RAW_ASSETS = ${JSON.stringify(assets)};
    const SOURCE_URL = ${JSON.stringify(sourceUrl)};
    const SOURCE_HOST = ${JSON.stringify(sourceHost)};

    let activeCategory = "all";
    let currentViewMode = "list";
    let currentFiltered = [];

    function showToast(msg) {
      const toast = document.getElementById("toast");
      toast.textContent = msg;
      toast.className = "show";
      setTimeout(() => { toast.className = ""; }, 2200);
    }

    function copyToClipboard(text, label) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("✅ Berhasil copy " + (label || "teks") + "!");
        }).catch(() => fallbackCopy(text, label));
      } else {
        fallbackCopy(text, label);
      }
    }

    function fallbackCopy(text, label) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("✅ Berhasil copy " + (label || "teks") + "!");
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
      if (url && url.startsWith("data:")) return url;
      try {
        const res = await fetch(url, { mode: "cors" });
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth || 100;
              canvas.height = img.naturalHeight || 100;
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

    function groupAssetsByDomain(items) {
      const indexes = new Array(items.length);
      const rh = new Array(items.length);
      for (let i = 0; i < items.length; i++) {
        indexes[i] = i;
        rh[i] = (items[i].hostname || "").toLowerCase().split('.').reverse().join('.');
      }
      indexes.sort((i, j) => {
        if (rh[i] < rh[j]) return -1;
        if (rh[i] > rh[j]) return 1;
        return i - j;
      });
      return indexes.map(i => items[i]);
    }

    function updateTabCounts() {
      const counts = { all: RAW_ASSETS.length, image: 0, link: 0, media: 0, doc: 0, code: 0 };
      for (const a of RAW_ASSETS) {
        if (counts[a.category] !== undefined) counts[a.category]++;
      }
      for (const [k, v] of Object.entries(counts)) {
        const el = document.getElementById("count-" + k);
        if (el) el.textContent = v;
      }
      const totalBadge = document.getElementById("header-total-count");
      if (totalBadge) totalBadge.textContent = RAW_ASSETS.length + " items";
    }

    function renderContent() {
      const searchVal = document.getElementById("search-input").value.trim().toLowerCase();
      const hideDuplicates = document.getElementById("opt-dedup").checked;
      const hideSameOrigin = document.getElementById("opt-diff-origin").checked;
      const groupByDomain = document.getElementById("opt-group").checked;
      const contentArea = document.getElementById("content-area");
      const copyCountSpan = document.getElementById("copy-count");

      let items = RAW_ASSETS.slice(0);

      if (activeCategory !== "all") {
        items = items.filter(a => a.category === activeCategory);
      }
      if (hideSameOrigin) {
        items = items.filter(a => a.hostname !== SOURCE_HOST && !a.isBase64);
      }
      if (groupByDomain) {
        items = groupAssetsByDomain(items);
      }

      const seen = new Set();
      const filtered = [];

      for (const item of items) {
        if (hideDuplicates) {
          if (seen.has(item.url)) continue;
          seen.add(item.url);
        }
        if (searchVal) {
          const matchUrl = item.url.toLowerCase().includes(searchVal);
          const matchTitle = item.title && item.title.toLowerCase().includes(searchVal);
          const matchHost = item.hostname && item.hostname.toLowerCase().includes(searchVal);
          const matchExt = item.ext && item.ext.toLowerCase().includes(searchVal);
          if (!matchUrl && !matchTitle && !matchHost && !matchExt) continue;
        }
        filtered.push(item);
      }

      currentFiltered = filtered;
      copyCountSpan.textContent = filtered.length;

      const hasImages = activeCategory === "image" || filtered.some(f => f.category === "image");

      if (filtered.length === 0) {
        contentArea.innerHTML = '<div class="empty-state">🔍 Tidak ada aset yang cocok dengan filter "' + escapeHtml(searchVal) + '"</div>';
        return;
      }

      if (currentViewMode === "grid" && hasImages) {
        renderGridView(filtered, contentArea);
      } else {
        renderListView(filtered, contentArea);
      }
    }

    function renderListView(items, container) {
      let html = '<ul class="asset-list">';
      items.forEach((item, idx) => {
        const isImg = item.category === "image";
        const isB64 = item.isBase64;
        const typeLabel = isB64 ? "BASE64" : (item.ext || item.category);
        const typeClass = isB64 ? "badge-base64" : "badge-" + item.category;

        let thumbHtml = "";
        if (isImg) {
          thumbHtml = '<div class="item-thumb" title="Lihat gambar"><img src="' + escapeHtml(item.url) + '" loading="lazy" onerror="this.style.display=\\'none\\'" /></div>';
        }

        let dimHtml = "";
        if (item.width && item.height) {
          dimHtml = '<span class="item-dim">' + item.width + '×' + item.height + '</span>';
        }

        const displayUrl = isB64 ? item.url.substring(0, 85) + "..." : item.url;

        html += '<li class="asset-item">' +
          '<span class="item-num">' + (idx + 1) + '.</span>' +
          thumbHtml +
          '<span class="item-badge ' + typeClass + '">' + escapeHtml(typeLabel) + '</span>' +
          dimHtml +
          '<span class="item-host">' + escapeHtml(item.hostname) + '</span>' +
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
            '<div class="grid-title" title="' + escapeHtml(item.title || item.url) + '">' + escapeHtml(item.title || item.hostname) + '</div>' +
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
          btn.textContent = "⏳...";
          const b64 = await convertImgToBase64(item.url);
          if (b64) {
            copyToClipboard(b64, "Base64 Image");
            btn.textContent = "✅ Copied!";
          } else {
            showToast("❌ Gagal convert Base64 (CORS)");
            btn.textContent = "❌ Gagal";
          }
          setTimeout(() => { btn.textContent = currentViewMode === "grid" ? "🧬 B64" : "🧬 Base64"; }, 1500);
        };
      });

      container.querySelectorAll(".btn-download").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const item = items[parseInt(btn.getAttribute("data-idx"), 10)];
          if (item) downloadFile(item.url, (item.title || "asset") + "." + (item.ext || "png"));
        };
      });
    }

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.getAttribute("data-tab");
        renderContent();
      };
    });

    // View Toggle
    document.getElementById("btn-view-list").onclick = function() {
      currentViewMode = "list";
      this.classList.add("active");
      document.getElementById("btn-view-grid").classList.remove("active");
      renderContent();
    };
    document.getElementById("btn-view-grid").onclick = function() {
      currentViewMode = "grid";
      this.classList.add("active");
      document.getElementById("btn-view-list").classList.remove("active");
      renderContent();
    };

    // Filters
    document.getElementById("search-input").oninput = renderContent;
    document.getElementById("opt-dedup").onchange = renderContent;
    document.getElementById("opt-diff-origin").onchange = renderContent;
    document.getElementById("opt-group").onchange = renderContent;

    // Copy All URLs
    document.getElementById("btn-copy-urls").onclick = () => {
      if (!currentFiltered.length) return showToast("Tidak ada item untuk di-copy");
      const text = currentFiltered.map(i => i.url).join("\\r\\n");
      copyToClipboard(text, currentFiltered.length + " URLs");
    };

    // Export TXT
    document.getElementById("btn-export-txt").onclick = () => {
      if (!currentFiltered.length) return showToast("Tidak ada aset untuk di-export");
      const text = currentFiltered.map(i => i.category.toUpperCase() + "\\t" + (i.hostname || "") + "\\t" + i.url).join("\\r\\n");
      const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      downloadFile(url, "assets_" + SOURCE_HOST + "_" + Date.now() + ".txt");
      URL.revokeObjectURL(url);
      showToast("✅ Exported " + currentFiltered.length + " assets!");
    };

    // Init
    updateTabCounts();
    renderContent();
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  }

  window.__ipvfoo_open_linkgrabber = openGrabberInNewTab;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action === "open_linkgrabber") {
      openGrabberInNewTab();
      sendResponse({ ok: true });
    }
  });

  let activePort = null;
  let isPageHidden = false;

  // Connect to Extension Background
  function connect() {
    if (isPageHidden) return;
    if (activePort) {
      try {
        activePort.disconnect();
      } catch (e) { }
      activePort = null;
    }
    try {
      const port = chrome.runtime.connect({ name: "content-overlay" });
      activePort = port;
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
        // Access lastError / error to suppress 'Unchecked runtime.lastError' warning
        const _err = chrome.runtime?.lastError || port.error;
        if (activePort === port) {
          activePort = null;
        }
        if (!isPageHidden) {
          setTimeout(connect, 2000);
        }
      });
    } catch (e) {
      if (!isPageHidden) {
        setTimeout(connect, 2000);
      }
    }
  }

  window.addEventListener("pagehide", () => {
    isPageHidden = true;
    if (activePort) {
      try {
        activePort.disconnect();
      } catch (e) { }
      activePort = null;
    }
  });

  window.addEventListener("pageshow", () => {
    isPageHidden = false;
    connect();
  });

  connect();
})();
