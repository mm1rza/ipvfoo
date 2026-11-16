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
      } catch (e) { }
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
    const isIdAsnRegex = /INDONESIA|TELKOM|BIZNET|MORATEL|APJII|IDNIC|CBN|FIRSTMEDIA|LINKNET|INDOSAT|XL|SMARTFREN|IFORTE|FIBERSTAR/i.test(a);
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
    :host {
      /* ======================================================================
         SHADCN THEME TOKENS — Cyber Obsidian & Neon Amber
         Ubah token di bawah ini untuk kustomisasi tema widget secara instan
         ====================================================================== */
      --background: #07090D;
      --foreground: #FFFFFF;
      --card: #0D1016;
      --card-header: #161A22;
      --popover: #161A22;
      --secondary: #1D222D;
      --muted-foreground: #98A1B3;
      --border: rgba(61, 71, 92, 0.45);
      --border-light: rgba(82, 95, 122, 0.25);
      
      --primary: #FA9C1B;
      --primary-glow: #FFB03A;
      --primary-foreground: #07090D;
      --destructive: #F04242;
      
      --cyber-cyan: #00EAFF;
      --cyber-green: #1AE680;
      --cyber-blue: #1A79FF;
      --glow-orange: 0 0 16px rgba(250, 156, 27, 0.35);
      --glow-cyan: 0 0 16px rgba(0, 234, 255, 0.25);
      
      --radius: 8px;
      --radius-sm: 4px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Minimalist Floating Widget Container */
    #widget {
      position: fixed;
      top: 10px;
      right: 10px;
      width: 790px;
      min-width: 730px;
      max-width: calc(100vw - 20px);
      max-height: 85vh;
      background: rgba(7, 9, 13, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: var(--foreground);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.75), 0 0 1px rgba(250, 156, 27, 0.3);
      font-size: 11px;
      z-index: 2147483647 !important;
      display: none;
      flex-direction: column;
      overflow: hidden;
      transition: opacity 0.2s, transform 0.2s;
      user-select: none;
    }

    /* Minimalist Compact Header */
    #header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 9px;
      background: var(--card-header);
      border-bottom: 1px solid var(--border);
      cursor: move;
    }

    #header .title {
      font-weight: 700;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      letter-spacing: 0.2px;
    }

    #header .controls {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    /* Minimalist Compact Button Styles */
    .btn {
      padding: 2px 7px;
      font-size: 10.5px;
      font-weight: 600;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      line-height: 1.25;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn:active {
      transform: scale(0.97);
    }

    .btn-rst {
      background: rgba(240, 66, 66, 0.15);
      color: var(--destructive);
      border-color: rgba(240, 66, 66, 0.35);
    }
    .btn-rst:hover {
      background: var(--destructive);
      color: #fff;
    }

    .btn-action {
      background: var(--secondary);
      color: var(--muted-foreground);
      border-color: var(--border);
    }
    .btn-action:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }

    .btn-export {
      background: var(--secondary);
      color: var(--cyber-cyan);
      border-color: rgba(0, 234, 255, 0.3);
    }
    .btn-export:hover {
      background: var(--cyber-cyan);
      color: #07090D;
      box-shadow: var(--glow-cyan);
    }

    .btn-seo {
      background: rgba(250, 156, 27, 0.15);
      color: var(--primary);
      border-color: rgba(250, 156, 27, 0.45);
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .btn-seo:hover {
      background: var(--primary);
      color: #07090D;
      border-color: var(--primary);
      box-shadow: var(--glow-orange);
    }

    .btn-grabber {
      background: rgba(0, 234, 255, 0.15);
      color: var(--cyber-cyan);
      border-color: rgba(0, 234, 255, 0.45);
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .btn-grabber:hover {
      background: var(--cyber-cyan);
      color: #07090D;
      border-color: var(--cyber-cyan);
      box-shadow: var(--glow-cyan);
    }

    /* Minimalist Table Wrap */
    #table-wrap {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: calc(85vh - 36px);
      padding: 2px 5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      white-space: nowrap;
    }

    th {
      text-align: left;
      padding: 3.5px 5px;
      color: var(--muted-foreground);
      font-size: 9.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--border);
      user-select: none;
    }

    td {
      padding: 3px 5px;
      border-bottom: 1px solid rgba(61, 71, 92, 0.2);
      vertical-align: middle;
    }

    tr:hover td {
      background: rgba(250, 156, 27, 0.08);
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
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      user-select: text;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .ip4 { color: #ff9e80; }
    .ip6 { color: var(--cyber-green); }

    .asn-tag {
      font-size: 9px;
      padding: 1px 4px;
      border-radius: 3px;
      background: var(--secondary);
      color: var(--cyber-cyan);
      border: 1px solid var(--border);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 600;
      white-space: nowrap;
    }
    .asn-tag.lan {
      background: rgba(250, 156, 27, 0.15);
      color: var(--primary);
      border-color: rgba(250, 156, 27, 0.35);
    }

    .status-badge {
      display: inline-block;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 9.5px;
      font-weight: 700;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      text-align: center;
    }

    .route-badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      white-space: nowrap;
      cursor: help;
      line-height: 1.2;
    }
    .badge-iix {
      background: rgba(26, 230, 128, 0.15);
      color: var(--cyber-green);
      border: 1px solid rgba(26, 230, 128, 0.4);
    }
    .badge-cdn {
      background: rgba(0, 234, 255, 0.15);
      color: var(--cyber-cyan);
      border: 1px solid rgba(0, 234, 255, 0.4);
    }
    .badge-intl {
      background: rgba(250, 156, 27, 0.15);
      color: var(--primary);
      border: 1px solid rgba(250, 156, 27, 0.4);
    }
    .badge-lan {
      background: var(--secondary);
      color: var(--muted-foreground);
      border: 1px solid var(--border);
    }
    .badge-unknown {
      color: #666;
    }
    .status-2xx { background: rgba(26, 230, 128, 0.18); color: var(--cyber-green); }
    .status-3xx { background: rgba(26, 121, 255, 0.18); color: var(--cyber-blue); }
    .status-4xx { background: rgba(250, 156, 27, 0.2); color: var(--primary); }
    .status-5xx, .status-err { background: rgba(240, 66, 66, 0.25); color: var(--destructive); font-weight: bold; }

    .lat-cell {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 10px;
      text-align: right;
      white-space: nowrap;
    }
    .lat-fastest { color: var(--cyber-green); font-weight: bold; }
    .lat-regional { color: var(--cyber-cyan); }
    .lat-medium { color: var(--primary); }
    .lat-slow { color: var(--destructive); font-weight: bold; }
    .lat-na { color: #777; }

    .proto-badge {
      display: inline-block;
      font-size: 8.5px;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-weight: 700;
      padding: 1px 3px;
      border-radius: 3px;
      margin-right: 3px;
      line-height: 1.1;
      vertical-align: middle;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .proto-h3 {
      background: var(--primary);
      color: #07090D;
      box-shadow: var(--glow-orange);
    }
    .proto-h2 {
      background: var(--cyber-cyan);
      color: #07090D;
    }
    .proto-h1 {
      background: var(--secondary);
      color: var(--muted-foreground);
      border: 1px solid var(--border);
    }
    .proto-ws {
      background: #d97706;
      color: #ffffff;
    }
    .proto-http {
      background: var(--destructive);
      color: #ffffff;
    }

    .bgp-link {
      color: var(--cyber-cyan);
      text-decoration: none;
      font-weight: 600;
    }
    .bgp-link:hover {
      text-decoration: underline;
    }

    .hits-cell {
      text-align: center;
      font-weight: 700;
      color: var(--cyber-green);
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    }
    .hits-zero {
      color: #777;
      font-weight: normal;
    }

    .size-cell {
      text-align: right;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      color: var(--primary-glow);
      font-size: 10px;
    }
    .size-zero {
      color: #777;
    }

    .widget-speed {
      font-size: 9.5px;
      font-weight: 700;
      color: var(--primary);
      background: rgba(250, 156, 27, 0.15);
      border: 1px solid rgba(250, 156, 27, 0.4);
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 6px;
      display: none;
      align-items: center;
      gap: 3px;
      line-height: 1.2;
    }

    .speed-tag {
      display: inline-block;
      margin-right: 4px;
      padding: 1px 4px;
      font-size: 8.5px;
      font-weight: 700;
      color: #07090D;
      background: var(--primary);
      border-radius: 2px;
      line-height: 1.1;
    }

    .row-error td {
      background: rgba(240, 66, 66, 0.15) !important;
    }

    .highlight td {
      background: rgba(250, 156, 27, 0.15) !important;
    }

    /* Minimalist Minimized Badge */
    #mini-badge {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(7, 9, 13, 0.96);
      border: 1px solid var(--border);
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      color: var(--foreground);
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 10.5px;
      font-weight: 600;
      cursor: pointer;
      display: none;
      align-items: center;
      gap: 6px;
      z-index: 2147483647 !important;
      user-select: none;
      transition: all 0.15s ease;
    }
    #mini-badge:hover {
      border-color: var(--primary);
      background: var(--card-header);
      box-shadow: var(--glow-orange);
    }
    #mini-badge .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--primary);
      display: inline-block;
    }

    /* BGP AS-Path Visualizer Modal (Minimalist shadcn Dialog) */
    #bgp-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.78);
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
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: 0 14px 45px rgba(0, 0, 0, 0.8), var(--glow-cyan);
      color: var(--foreground);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalPop {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    #bgp-modal-header {
      background: var(--card-header);
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
    }

    #bgp-modal-header .title {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    #bgp-modal-close {
      background: none;
      border: none;
      color: var(--muted-foreground);
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      line-height: 1;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
    }
    #bgp-modal-close:hover {
      color: var(--destructive);
      background: rgba(240, 66, 66, 0.15);
    }

    #bgp-modal-body {
      padding: 14px 16px;
      max-height: 70vh;
      overflow-y: auto;
      font-size: 11.5px;
    }

    .bgp-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 14px;
    }

    .bgp-card {
      background: var(--secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
    }

    .bgp-card-label {
      font-size: 9.5px;
      color: var(--muted-foreground);
      text-transform: uppercase;
      margin-bottom: 3px;
      font-weight: 600;
    }

    .bgp-card-val {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--foreground);
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    }

    .bgp-card-sub {
      font-size: 10.5px;
      color: var(--cyber-cyan);
      margin-top: 2px;
    }

    .bgp-path-container {
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-bottom: 12px;
    }

    .bgp-path-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bgp-flow-wrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .bgp-node {
      background: var(--secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 5px 8px;
      text-align: center;
      min-width: 90px;
    }
    .bgp-node-origin {
      border-color: var(--primary);
      background: rgba(250, 156, 27, 0.12);
    }
    .bgp-node-client {
      border-color: var(--cyber-green);
      background: rgba(26, 230, 128, 0.12);
    }
    .bgp-node-asn {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--foreground);
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    }
    .bgp-node-name {
      font-size: 9px;
      color: var(--muted-foreground);
      max-width: 110px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }
    .bgp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .bgp-table th {
      background: var(--secondary);
      color: var(--muted-foreground);
      padding: 6px 8px;
      font-weight: 600;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    .bgp-table td {
      padding: 6px 8px;
      border-bottom: 1px solid rgba(61, 71, 92, 0.25);
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    }
    .bgp-table tr:hover td {
      background: rgba(250, 156, 27, 0.08);
    }
    .bgp-rtt-fast { color: var(--cyber-green); font-weight: 700; }
    .bgp-rtt-med { color: var(--primary); font-weight: 700; }
    .bgp-rtt-slow { color: var(--destructive); font-weight: 700; }

    .bgp-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      margin-top: 10px;
    }

    .bgp-btn {
      padding: 5px 11px;
      border-radius: var(--radius-sm);
      font-size: 10.5px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
    }
    .bgp-btn-mkt {
      background: var(--primary);
      color: #07090D;
    }
    .bgp-btn-mkt:hover {
      background: var(--primary-glow);
      box-shadow: var(--glow-orange);
    }
    .bgp-btn-he {
      background: var(--cyber-cyan);
      color: #07090D;
    }
    .bgp-btn-he:hover {
      box-shadow: var(--glow-cyan);
    }

    .bgp-loading {
      text-align: center;
      padding: 24px 16px;
      color: var(--cyber-cyan);
      font-weight: 600;
      font-size: 12px;
    }
  `;
  shadow.appendChild(style);

  // Widget Container
  const widget = document.createElement("div");
  widget.id = "widget";
  widget.innerHTML = `
    <div id="header">
      <div class="title" style="display:flex; align-items:center;">
        <span>IPvFooKan</span>
        <span id="widget-speed" class="widget-speed"></span>
      </div>
      <div class="controls">
        <button id="btn-screenshot" class="btn btn-export" title="Ambil Full Page Screenshot">📸</button>
        <button id="btn-export-txt" class="btn btn-export" title="Export Session ke TXT">TXT</button>
        <button id="btn-seo" class="btn btn-seo" title="Buka META SEO Inspector (New Tab)">META SEO</button>
        <button id="btn-linkgrabber" class="btn btn-grabber" title="Ekstrak Semua Link di Halaman Ini (Link Grabber)">LINK GRABBER</button>
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
  miniBadge.innerHTML = `<span class="dot"></span><span id="mini-text">IPvFooKan Loading...</span>`;
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
      const blob = (content instanceof Blob) ? content : new Blob([content], { type: mimeType });
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

  // Full-page screen capture (inspired by ref/full-page-screen-capture-chrome-extension-master)
  async function takeFullPageScreenshot() {
    const origWidgetDisplay = widget.style.display;
    const origMiniDisplay = miniBadge.style.display;
    widget.style.display = "none";
    miniBadge.style.display = "none";

    showCopyToast("📸 Mengambil screenshot halaman...");

    const body = document.body;
    const origScrollX = window.scrollX;
    const origScrollY = window.scrollY;
    const origDocOverflow = document.documentElement.style.overflow;
    const origBodyOverflowY = body ? body.style.overflowY : "";

    if (body) {
      body.style.overflowY = "visible";
    }
    document.documentElement.style.overflow = "hidden";

    try {
      const fullWidth = Math.max(
        document.documentElement.clientWidth,
        body ? body.scrollWidth : 0,
        document.documentElement.scrollWidth,
        body ? body.offsetWidth : 0,
        document.documentElement.offsetWidth
      );
      const fullHeight = Math.max(
        document.documentElement.clientHeight,
        body ? body.scrollHeight : 0,
        document.documentElement.scrollHeight,
        body ? body.offsetHeight : 0,
        document.documentElement.offsetHeight
      );
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const scrollPad = 200;
      const yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0);
      const xDelta = windowWidth;

      // Susun urutan scroll dari bawah ke atas agar sticky headers
      // ditimpa rapi oleh render bagian atas halaman terakhir (metode Peter Coles)
      const arrangements = [];
      let yPos = fullHeight - windowHeight;
      while (yPos > -yDelta) {
        let xPos = 0;
        while (xPos < fullWidth) {
          arrangements.push([xPos, Math.max(0, yPos)]);
          xPos += xDelta;
        }
        yPos -= yDelta;
      }

      let canvas = null;
      let ctx = null;
      let scale = 1;

      for (let i = 0; i < arrangements.length; i++) {
        const [x, y] = arrangements[i];
        window.scrollTo(x, y);
        await new Promise((r) => setTimeout(r, 160));

        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ cmd: "captureVisibleTab" }, (res) => {
            resolve(res || {});
          });
        });

        if (!resp || !resp.dataUrl) {
          throw new Error(resp && resp.error ? resp.error : "Gagal menangkap layar viewport");
        }

        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("Gagal merender potongan layar"));
          image.src = resp.dataUrl;
        });

        if (!canvas) {
          scale = img.width / windowWidth || 1;
          canvas = document.createElement("canvas");
          canvas.width = Math.round(fullWidth * scale);
          canvas.height = Math.round(fullHeight * scale);
          ctx = canvas.getContext("2d");
        }

        ctx.drawImage(img, Math.round(x * scale), Math.round(y * scale));
      }

      if (canvas) {
        canvas.toBlob((blob) => {
          if (!blob) {
            showCopyToast("❌ Gagal membuat berkas screenshot");
            return;
          }
          const host = (location.hostname || "page").replace(/[^a-zA-Z0-9.-]/g, "_");
          const d = new Date();
          const pad2 = (n) => String(n).padStart(2, "0");
          const dateStr = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
          const filename = `screenshot_${host}_${dateStr}.png`;
          triggerDownload(blob, filename, "image/png");
          showCopyToast("📸 Screenshot full page berhasil disimpan!");
        }, "image/png");
      }
    } catch (err) {
      console.error("[IPvFooKan] Screenshot error:", err);
      showCopyToast("❌ Gagal screenshot: " + (err.message || err));
    } finally {
      document.documentElement.style.overflow = origDocOverflow;
      if (body) body.style.overflowY = origBodyOverflowY;
      window.scrollTo(origScrollX, origScrollY);
      widget.style.display = origWidgetDisplay;
      miniBadge.style.display = origMiniDisplay;
    }
  }

  function getExportFilename(mainDomain, ext) {
    const host = (mainDomain || location.hostname || "session").replace(/[^a-zA-Z0-9.-]/g, "_");
    const d = new Date();
    const pad2 = (n) => String(n).padStart(2, "0");
    const dateStr = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
    return `ipvfookan_${host}_${dateStr}.${ext}`;
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
  const btnScreenshot = shadow.getElementById("btn-screenshot");
  if (btnScreenshot) {
    btnScreenshot.onclick = () => {
      takeFullPageScreenshot();
    };
  }

  shadow.getElementById("btn-export-txt").onclick = () => {
    exportTxtSession(allTuplesCache, allTuplesCache[0] ? allTuplesCache[0][0] : location.hostname);
  };

  shadow.getElementById("btn-seo").onclick = () => {
    openSeoInNewTab();
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

  // BGP / AS-Path Modal DOM
  const modalBackdrop = document.createElement("div");
  modalBackdrop.id = "bgp-modal-backdrop";
  modalBackdrop.innerHTML = `
    <div id="bgp-modal">
      <div id="bgp-modal-header">
        <div class="title">
          <span>🛰️ BGP AS-Path & Route Visualizer</span>
        </div>
        <button id="bgp-modal-close" title="Tutup Modal">✕</button>
      </div>
      <div id="bgp-modal-body">
        <div class="bgp-loading">⏳ Memuat rute BGP AS-Path...</div>
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
      showCopyToast("IP tidak valid untuk rute BGP");
      return;
    }

    modalBackdrop.style.display = "flex";
    const body = modalBackdrop.querySelector("#bgp-modal-body");
    body.innerHTML = `
      <div class="bgp-loading">
        <div style="font-size: 26px; margin-bottom: 8px;">🛰️</div>
        Memuat data BGP AS-Path global untuk <strong>${addr}</strong> (${domain})...
      </div>
    `;

    try {
      chrome.runtime.sendMessage({ cmd: "lookupBgpPath", ip: addr }, (bgpRes) => {
        if (bgpRes && !bgpRes.error) {
          renderBgpModalContent(bgpRes, domain, addr, asn);
        } else {
          body.innerHTML = `
            <div style="color:#ff5252; padding: 25px; text-align:center;">
              ⚠️ Gagal mengambil rute: ${bgpRes?.error || "Koneksi timeout"}
            </div>
          `;
        }
      });
    } catch (e) {
      body.innerHTML = `<div style="color:#ff5252; padding:25px; text-align:center;">Error: ${e.message}</div>`;
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
            ${flowNodes.join('<span class="bgp-arrow">──►</span>')}
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
        } catch (e) { }
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
      } catch (e) { }
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

    const grabberPayload = {
      sourceUrl: sourceUrl,
      sourceHost: sourceHost,
      assets: assets,
      timestamp: Date.now()
    };

    showCopyToast(`🚀 Membuka Grabber (${assets.length} aset) di Tab Baru...`);

    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ grabber_data: grabberPayload }, () => {
          chrome.runtime.sendMessage({ cmd: "open_grabber_tab" }, (res) => {
            if (chrome.runtime.lastError || !res || res.status !== "ok") {
              openPreRenderedGrabberBlob(grabberPayload);
            }
          });
        });
        return;
      }
    } catch (e) {
      console.warn("openGrabberInNewTab storage error:", e);
    }

    openPreRenderedGrabberBlob(grabberPayload);
  }

  function openPreRenderedGrabberBlob(payload) {
    const assets = payload.assets || [];
    const sourceUrl = payload.sourceUrl || window.location.href;
    const sourceHost = payload.sourceHost || window.location.hostname;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asset & Link Grabber - ${escapeHtml(sourceHost)}</title>
  <style>
    /* ========================================================================
       SHADCN UI THEME TOKENS — Cyber Obsidian & Neon Amber
       Ubah token di bawah ini untuk kustomisasi tema Link Grabber
       ======================================================================== */
    :root {
      --background: #07090D;
      --foreground: #FFFFFF;
      --card: #0D1016;
      --card-header: #161A22;
      --popover: #161A22;
      --secondary: #1D222D;
      --muted: #161A22;
      --muted-foreground: #98A1B3;
      --border: rgba(61, 71, 92, 0.45);
      --border-light: rgba(82, 95, 122, 0.25);
      --input: rgba(61, 71, 92, 0.55);
      
      --primary: #FA9C1B;
      --primary-glow: #FFB03A;
      --primary-foreground: #07090D;
      --destructive: #F04242;
      
      --cyber-cyan: #00EAFF;
      --cyber-green: #1AE680;
      --cyber-blue: #1A79FF;
      --glow-orange: 0 0 25px rgba(250, 156, 27, 0.35);
      --glow-cyan: 0 0 25px rgba(0, 234, 255, 0.25);
      
      --radius: 8px;
      --radius-sm: 4px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background: var(--background);
      color: var(--foreground);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: var(--card-header);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
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
      font-size: 17px;
      font-weight: 700;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand .source-link {
      font-size: 12px;
      color: var(--cyber-cyan);
      text-decoration: none;
      max-width: 450px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }
    .brand .source-link:hover { text-decoration: underline; }
    .header-badge {
      background: rgba(250, 156, 27, 0.15);
      border: 1px solid rgba(250, 156, 27, 0.4);
      color: var(--primary);
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 600;
    }

    .main-wrap {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      padding: 18px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .toolbar-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tabs-row {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .tab-btn {
      background: var(--secondary);
      border: 1px solid var(--border);
      color: var(--muted-foreground);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background: rgba(250, 156, 27, 0.1);
      color: #fff;
      border-color: var(--primary);
    }
    .tab-btn.active {
      background: var(--primary);
      color: #07090D;
      border-color: var(--primary);
      box-shadow: var(--glow-orange);
      font-weight: 700;
    }
    .tab-badge {
      background: var(--card);
      color: var(--cyber-cyan);
      border: 1px solid var(--border);
      padding: 1px 7px;
      border-radius: 10px;
      font-size: 10.5px;
      font-weight: 700;
      font-family: Consolas, Monaco, monospace;
      letter-spacing: 0.3px;
    }
    .tab-btn.active .tab-badge {
      background: rgba(7, 9, 13, 0.25);
      color: #07090D;
      border-color: transparent;
    }

    .filter-actions-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-input {
      flex: 1;
      min-width: 250px;
      background: var(--background);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 7px 12px;
      color: #fff;
      font-size: 12.5px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: var(--glow-orange);
    }

    .btn {
      font-size: 11.5px;
      font-weight: 600;
      padding: 7px 12px;
      border-radius: var(--radius-sm);
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
      background: var(--primary);
      color: #07090D;
      border-color: rgba(250, 156, 27, 0.5);
      font-weight: 700;
    }
    .btn-primary:hover {
      background: var(--primary-glow);
      box-shadow: var(--glow-orange);
    }
    .btn-purple {
      background: var(--cyber-cyan);
      color: #07090D;
      border-color: rgba(0, 234, 255, 0.4);
      font-weight: 700;
    }
    .btn-purple:hover {
      box-shadow: var(--glow-cyan);
    }
    .btn-outline {
      background: var(--secondary);
      color: var(--foreground);
      border-color: var(--border);
    }
    .btn-outline:hover {
      background: var(--card);
      border-color: var(--primary);
      color: var(--primary);
    }

    .options-row {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--muted-foreground);
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
      accent-color: var(--primary);
      width: 14px;
      height: 14px;
    }

    .view-toggle {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }
    .view-btn {
      background: var(--secondary);
      border: 1px solid var(--border);
      color: var(--muted-foreground);
      padding: 4px 9px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 11px;
    }
    .view-btn.active {
      background: var(--primary);
      color: #07090D;
      border-color: var(--primary);
      font-weight: 700;
    }

    .content-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      padding: 10px;
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
      gap: 10px;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      background: var(--secondary);
      border: 1px solid var(--border-light);
      transition: background 0.15s, border-color 0.15s;
    }
    .asset-item:hover {
      background: var(--card-header);
      border-color: rgba(250, 156, 27, 0.4);
    }
    .item-num {
      color: var(--muted-foreground);
      font-size: 10.5px;
      font-family: monospace;
      min-width: 28px;
      text-align: right;
    }
    .item-thumb {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-sm);
      background: #000;
      border: 1px solid var(--border);
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
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      font-family: monospace;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .badge-image { background: rgba(250, 156, 27, 0.15); color: var(--primary); border: 1px solid rgba(250, 156, 27, 0.35); }
    .badge-link { background: rgba(0, 234, 255, 0.15); color: var(--cyber-cyan); border: 1px solid rgba(0, 234, 255, 0.35); }
    .badge-media { background: rgba(26, 121, 255, 0.15); color: var(--cyber-blue); border: 1px solid rgba(26, 121, 255, 0.35); }
    .badge-doc { background: rgba(26, 230, 128, 0.15); color: var(--cyber-green); border: 1px solid rgba(26, 230, 128, 0.35); }
    .badge-code { background: rgba(192, 132, 252, 0.15); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.35); }
    .badge-base64 { background: rgba(240, 66, 66, 0.15); color: var(--destructive); border: 1px solid rgba(240, 66, 66, 0.35); }

    .item-dim {
      font-size: 9.5px;
      color: var(--muted-foreground);
      font-family: monospace;
      white-space: nowrap;
    }
    .item-host {
      background: var(--secondary);
      color: var(--cyber-cyan);
      border-radius: 3px;
      padding: 1px 5px;
      font-size: 10.5px;
      font-weight: 600;
      white-space: nowrap;
      border: 1px solid var(--border);
    }
    .item-title {
      color: var(--foreground);
      font-size: 11.5px;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-url {
      flex: 1;
      color: var(--primary);
      text-decoration: none;
      font-family: monospace;
      font-size: 11.5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      word-break: break-all;
    }
    .item-url:hover {
      text-decoration: underline;
      color: var(--primary-glow);
    }
    .item-actions {
      display: flex;
      gap: 5px;
      align-items: center;
      flex-shrink: 0;
    }
    .btn-action {
      background: var(--secondary);
      border: 1px solid var(--border);
      color: var(--muted-foreground);
      border-radius: var(--radius-sm);
      padding: 3px 8px;
      cursor: pointer;
      font-size: 10.5px;
      font-weight: 600;
      transition: all 0.15s;
      white-space: nowrap;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .btn-action:hover {
      background: var(--primary);
      color: #07090D;
      border-color: var(--primary);
    }
    .btn-action-b64 {
      border-color: rgba(250, 156, 27, 0.35);
      color: var(--primary);
    }
    .btn-action-b64:hover {
      background: var(--primary);
      color: #07090D;
      border-color: var(--primary);
    }

    .asset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 12px;
      padding: 6px;
    }
    .grid-card {
      background: var(--secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s;
    }
    .grid-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
      box-shadow: var(--glow-orange);
    }
    .grid-img-wrap {
      height: 140px;
      background: #000;
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
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .grid-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      font-family: monospace;
      color: var(--muted-foreground);
    }
    .grid-title {
      font-size: 11px;
      color: var(--foreground);
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
      font-size: 10px;
      padding: 4px 3px;
    }

    .empty-state {
      padding: 50px 20px;
      text-align: center;
      color: var(--muted-foreground);
      font-size: 13px;
    }

    #toast {
      position: fixed;
      bottom: 20px;
      right: 24px;
      background: var(--card-header);
      color: var(--primary);
      border: 1px solid var(--primary);
      padding: 9px 16px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 600;
      box-shadow: var(--glow-orange);
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.2s ease;
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
      <h1>&#x1F4E6; Content &amp; Asset Grabber</h1>
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
          thumbHtml = '<div class="item-thumb" title="Lihat gambar"><img src="' + escapeHtml(item.url) + '" loading="lazy" /></div>';
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

  function extractPageSeoData() {
    const data = {};

    data.url = window.location.href;
    data.origin = window.location.origin;
    data.pathname = window.location.pathname;
    data.hostname = window.location.hostname;
    data.protocol = window.location.protocol;
    data.generatedAt = new Date().toLocaleString();
    data.doctype = document.doctype ? ("<!DOCTYPE " + document.doctype.name + ">") : "";
    data.lang = document.documentElement.lang || "";
    data.charset = document.characterSet || document.inputEncoding || "UTF-8";

    // Title
    data.title = (document.title || "").trim();
    data.titleLength = data.title.length;

    // Description
    const descEl = document.querySelector('meta[name="description" i], meta[property="description" i]');
    data.description = descEl ? (descEl.getAttribute("content") || "").trim() : "";
    data.descriptionLength = data.description.length;

    // Keywords
    const kwEl = document.querySelector('meta[name="keywords" i]');
    data.keywords = kwEl ? (kwEl.getAttribute("content") || "").trim() : "";

    // Canonical
    const canonicalEl = document.querySelector('link[rel="canonical" i]');
    data.canonical = canonicalEl ? (canonicalEl.getAttribute("href") || "").trim() : "";
    data.canonicalAbsolute = canonicalEl ? canonicalEl.href : "";
    data.isCanonicalSelf = data.canonicalAbsolute === data.url;

    // Robots & Googlebot
    const robotsEl = document.querySelector('meta[name="robots" i]');
    data.robots = robotsEl ? (robotsEl.getAttribute("content") || "").trim() : "";
    const googlebotEl = document.querySelector('meta[name="googlebot" i]');
    data.googlebot = googlebotEl ? (googlebotEl.getAttribute("content") || "").trim() : "";

    // Viewport
    const viewportEl = document.querySelector('meta[name="viewport" i]');
    data.viewport = viewportEl ? (viewportEl.getAttribute("content") || "").trim() : "";

    // Other Meta
    const authorEl = document.querySelector('meta[name="author" i]');
    data.author = authorEl ? (authorEl.getAttribute("content") || "").trim() : "";
    const generatorEl = document.querySelector('meta[name="generator" i]');
    data.generator = generatorEl ? (generatorEl.getAttribute("content") || "").trim() : "";
    const themeEl = document.querySelector('meta[name="theme-color" i]');
    data.themeColor = themeEl ? (themeEl.getAttribute("content") || "").trim() : "";

    // Social: Open Graph
    data.og = [];
    document.querySelectorAll('meta[property^="og:" i], meta[name^="og:" i]').forEach(el => {
      const prop = el.getAttribute("property") || el.getAttribute("name");
      const content = el.getAttribute("content") || "";
      data.og.push({ property: prop, content });
    });

    // Social: Twitter Cards
    data.twitter = [];
    document.querySelectorAll('meta[name^="twitter:" i], meta[property^="twitter:" i]').forEach(el => {
      const name = el.getAttribute("name") || el.getAttribute("property");
      const content = el.getAttribute("content") || "";
      data.twitter.push({ name, content });
    });

    // Structured Data: JSON-LD
    data.jsonLd = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script, idx) => {
      const raw = script.textContent.trim();
      let parsed = null;
      let error = null;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        error = e.message;
      }
      let types = [];
      if (parsed) {
        if (Array.isArray(parsed)) {
          types = parsed.map(p => p["@type"] || "Item").filter(Boolean);
        } else if (parsed["@graph"]) {
          types = parsed["@graph"].map(p => p["@type"] || "Item").filter(Boolean);
        } else if (parsed["@type"]) {
          types = [parsed["@type"]];
        }
      }
      data.jsonLd.push({
        index: idx + 1,
        raw,
        parsed,
        error,
        types: types.join(", ") || (parsed ? "Schema.org" : "Invalid")
      });
    });

    // Headings (H1 - H6)
    data.headings = [];
    const headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    let prevLevel = 0;
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el, idx) => {
      const tag = el.tagName.toLowerCase();
      headingCounts[tag] = (headingCounts[tag] || 0) + 1;
      const level = parseInt(tag.charAt(1), 10);
      const text = (el.innerText || el.textContent || "").trim().replace(/\\s+/g, " ");
      const isHidden = (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0);
      let isSkip = false;
      let expectedTag = "";
      if (prevLevel > 0 && level > prevLevel + 1) {
        isSkip = true;
        expectedTag = "h" + (prevLevel + 1);
      }
      prevLevel = level;

      data.headings.push({
        id: "h_" + idx,
        tag: tag.toUpperCase(),
        level,
        text: text || "(Empty heading)",
        length: text.length,
        isHidden,
        isSkip,
        expectedTag
      });
    });
    data.headingCounts = headingCounts;

    // Links Analysis (Tanpa img)
    const allLinks = Array.from(document.querySelectorAll("a[href]"));
    let internalLinks = 0;
    let externalLinks = 0;
    let nofollowLinks = 0;
    let targetBlankNoOpener = 0;
    let emptyLinks = 0;

    allLinks.forEach(a => {
      const href = a.getAttribute("href") || "";
      const rel = (a.getAttribute("rel") || "").toLowerCase();
      const target = (a.getAttribute("target") || "").toLowerCase();

      if (rel.includes("nofollow")) nofollowLinks++;
      if (target === "_blank" && !rel.includes("noopener") && !rel.includes("noreferrer")) {
        targetBlankNoOpener++;
      }

      if (!href || href === "#" || href.startsWith("javascript:")) {
        emptyLinks++;
      } else {
        try {
          const u = new URL(a.href);
          if (u.origin === window.location.origin) {
            internalLinks++;
          } else {
            externalLinks++;
          }
        } catch (e) {
          internalLinks++;
        }
      }
    });

    data.linksStats = {
      total: allLinks.length,
      internal: internalLinks,
      external: externalLinks,
      nofollow: nofollowLinks,
      blankNoOpener: targetBlankNoOpener,
      empty: emptyLinks
    };

    // Resource Hints
    data.resourceHints = [];
    document.querySelectorAll('link[rel="preload" i], link[rel="preconnect" i], link[rel="prefetch" i], link[rel="dns-prefetch" i]').forEach(el => {
      data.resourceHints.push({
        rel: el.getAttribute("rel"),
        href: el.getAttribute("href"),
        as: el.getAttribute("as") || "-",
        type: el.getAttribute("type") || "-",
        crossorigin: el.hasAttribute("crossorigin") ? (el.getAttribute("crossorigin") || "anonymous") : null
      });
    });

    // External Resources
    const domainMap = new Map();
    const currentHost = window.location.hostname;
    const checkUrl = (url, type) => {
      if (!url || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("javascript:")) return;
      try {
        const u = new URL(url, window.location.href);
        if (u.hostname !== currentHost && !u.hostname.endsWith("." + currentHost)) {
          if (!domainMap.has(u.hostname)) {
            let category = "Third Party";
            const h = u.hostname.toLowerCase();
            if (h.includes("google-analytics") || h.includes("googletagmanager") || h.includes("segment") || h.includes("hotjar") || h.includes("clarity")) category = "Analytics";
            else if (h.includes("cloudflare") || h.includes("unpkg") || h.includes("jsdelivr") || h.includes("cdnjs") || h.includes("akamai") || h.includes("fastly")) category = "CDN";
            else if (h.includes("fonts.googleapis") || h.includes("fonts.gstatic") || h.includes("typekit")) category = "Web Fonts";
            else if (h.includes("facebook") || h.includes("twitter") || h.includes("linkedin") || h.includes("tiktok")) category = "Social Media";
            else if (h.includes("doubleclick") || h.includes("googlesyndication") || h.includes("adnxs")) category = "Advertising";
            domainMap.set(u.hostname, { hostname: u.hostname, category, count: 0, types: new Set() });
          }
          const entry = domainMap.get(u.hostname);
          entry.count++;
          entry.types.add(type);
        }
      } catch (e) { }
    };

    document.querySelectorAll("script[src]").forEach(s => checkUrl(s.src, "script"));
    document.querySelectorAll("link[href]").forEach(l => checkUrl(l.href, l.getAttribute("rel") || "link"));
    data.externalDomains = Array.from(domainMap.values()).map(d => ({
      hostname: d.hostname,
      category: d.category,
      count: d.count,
      types: Array.from(d.types).join(", ")
    }));

    // Forms
    data.forms = Array.from(document.forms).map((f, i) => ({
      index: i + 1,
      action: f.action || "(Current URL)",
      method: (f.method || "get").toUpperCase(),
      fields: f.elements ? f.elements.length : 0
    }));

    // HTML5 Report
    data.html5 = {
      isHtml5: !!(document.doctype && document.doctype.name && document.doctype.name.toLowerCase() === "html" && !document.doctype.publicId),
      hasHtml5Tags: !!document.querySelector("header, nav, main, footer, section, article, aside")
    };

    // Security
    const cspEl = document.querySelector('meta[http-equiv="Content-Security-Policy" i]');
    const referrerEl = document.querySelector('meta[name="referrer" i]');
    data.security = {
      isHttps: window.location.protocol === "https:",
      csp: cspEl ? cspEl.getAttribute("content") : null,
      referrerPolicy: referrerEl ? referrerEl.getAttribute("content") : null
    };

    // Diagnostics
    data.diagnostics = [];
    if (!data.title) {
      data.diagnostics.push({ level: "error", category: "Title", message: "Tag <title> tidak ditemukan pada halaman ini!" });
    } else if (data.titleLength < 30) {
      data.diagnostics.push({ level: "warning", category: "Title", message: "Title pendek (" + data.titleLength + " karakter). Rekomendasi: 30 - 60 karakter." });
    } else if (data.titleLength > 60) {
      data.diagnostics.push({ level: "warning", category: "Title", message: "Title panjang (" + data.titleLength + " karakter). Berisiko terpotong pada hasil Google SERP." });
    } else {
      data.diagnostics.push({ level: "good", category: "Title", message: "Panjang title optimal (" + data.titleLength + " karakter)." });
    }

    if (!data.description) {
      data.diagnostics.push({ level: "warning", category: "Description", message: "Meta description tidak ditemukan! Google akan membuat cuplikan otomatis." });
    } else if (data.descriptionLength < 70) {
      data.diagnostics.push({ level: "warning", category: "Description", message: "Meta description pendek (" + data.descriptionLength + " karakter). Rekomendasi: 120 - 160 karakter." });
    } else if (data.descriptionLength > 160) {
      data.diagnostics.push({ level: "warning", category: "Description", message: "Meta description panjang (" + data.descriptionLength + " karakter). Berpotensi terpotong di SERP." });
    } else {
      data.diagnostics.push({ level: "good", category: "Description", message: "Panjang meta description optimal (" + data.descriptionLength + " karakter)." });
    }

    if (!data.canonical) {
      data.diagnostics.push({ level: "info", category: "Canonical", message: "Canonical link tidak didefinisikan. Disarankan untuk mencegah konten duplikat." });
    } else if (document.querySelectorAll('link[rel="canonical"]').length > 1) {
      data.diagnostics.push({ level: "error", category: "Canonical", message: "Ditemukan lebih dari 1 tag canonical di halaman!" });
    } else {
      data.diagnostics.push({ level: "good", category: "Canonical", message: "Canonical terpasang: " + data.canonical });
    }

    if (data.headingCounts.h1 === 0) {
      data.diagnostics.push({ level: "error", category: "Headings", message: "Tidak ada tag <h1> pada halaman! Setiap halaman harus memiliki tepat 1 <h1>." });
    } else if (data.headingCounts.h1 > 1) {
      data.diagnostics.push({ level: "warning", category: "Headings", message: "Ditemukan " + data.headingCounts.h1 + " tag <h1>. Rekomendasi SEO terbaik adalah 1 tag <h1> utama per halaman." });
    } else {
      data.diagnostics.push({ level: "good", category: "Headings", message: "Struktur <h1> tepat (terdapat 1 tag <h1> utama)." });
    }

    if (!data.viewport) {
      data.diagnostics.push({ level: "error", category: "Mobile", message: "Meta viewport tidak ditemukan! Halaman tidak ramah mobile." });
    } else {
      if (data.viewport.includes("user-scalable=no")) {
        data.diagnostics.push({ level: "warning", category: "Mobile", message: "user-scalable=no mematikan fitur zoom cubit di ponsel (isu aksesibilitas WCAG)." });
      }
      if (data.viewport.includes("maximum-scale=1") || data.viewport.includes("maximum-scale=1.0")) {
        data.diagnostics.push({ level: "warning", category: "Mobile", message: "maximum-scale membatasi kemampuan zoom pengguna (sebaiknya jangan dibatasi)." });
      }
    }

    if (data.robots.toLowerCase().includes("noindex")) {
      data.diagnostics.push({ level: "warning", category: "Robots", message: "Tag robots berisi 'noindex'! Mesin pencari TIDAK akan mengindeks halaman ini." });
    }

    if (data.jsonLd.length > 0) {
      data.diagnostics.push({ level: "good", category: "Structured Data", message: "Ditemukan " + data.jsonLd.length + " skema Structured Data JSON-LD (Schema.org)." });
    } else {
      data.diagnostics.push({ level: "info", category: "Structured Data", message: "Tidak ditemukan structured data JSON-LD (Schema.org)." });
    }

    const hasOgTitle = data.og.some(o => o.property.toLowerCase() === "og:title");
    const hasOgImage = data.og.some(o => o.property.toLowerCase() === "og:image");
    if (hasOgTitle && hasOgImage) {
      data.diagnostics.push({ level: "good", category: "Social", message: "Meta Open Graph terpasang (og:title dan og:image tersedia)." });
    } else {
      data.diagnostics.push({ level: "info", category: "Social", message: "Meta Open Graph belum lengkap (og:title atau og:image belum terdeteksi)." });
    }

    return data;
  }

  function buildSeoReportHtml(data) {
    if (!data) data = {};
    const sourceUrl = data.url || window.location.href || "";
    const sourceHost = data.hostname || "page";
    const generatedAt = data.generatedAt || new Date().toLocaleString();

    function escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const diagnostics = data.diagnostics || [];
    const goodCount = diagnostics.filter(d => d.level === "good").length;
    const warnCount = diagnostics.filter(d => d.level === "warning").length;
    const errCount = diagnostics.filter(d => d.level === "error").length;

    const headingCounts = data.headingCounts || { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    const h1Count = headingCounts.h1 || 0;
    const schemas = data.jsonLd || [];
    const ogList = data.og || [];
    const twList = data.twitter || [];
    const headings = data.headings || [];
    const lStats = data.linksStats || { total: 0, internal: 0, external: 0, nofollow: 0, blankNoOpener: 0, empty: 0 };
    const hints = data.resourceHints || [];
    const extDomains = data.externalDomains || [];
    const sec = data.security || {};

    let diagHtml = '<div style="display:flex; flex-direction:column; gap:8px;">';
    diagnostics.forEach(diag => {
      let pillClass = "alert-good";
      let icon = "PASS";
      if (diag.level === "warning") { pillClass = "alert-warn"; icon = "WARNING"; }
      if (diag.level === "error") { pillClass = "alert-err"; icon = "ERROR"; }
      if (diag.level === "info") { pillClass = "alert-info"; icon = "INFO"; }
      diagHtml += '<div class="meta-row" style="padding:6px 0;">' +
        '<div class="meta-key" style="width:130px; min-width:130px;"><span class="alert-pill ' + pillClass + '">' + icon + '</span></div>' +
        '<div class="meta-value-wrap">' +
        '<strong style="color:#fff; font-size:12px; margin-right:6px;">[' + escapeHtml(diag.category) + ']</strong>' +
        '<span class="meta-content">' + escapeHtml(diag.message) + '</span>' +
        '</div></div>';
    });
    diagHtml += '</div>';

    const commonRows = [
      { key: "doctype", val: data.doctype ? escapeHtml(data.doctype) : "<em>None</em>", count: null },
      { key: "html lang", val: data.lang ? escapeHtml(data.lang) : "<em>Not specified</em>", count: null },
      { key: "charset", val: escapeHtml(data.charset || "UTF-8"), count: null },
      { key: "head title", val: data.title ? escapeHtml(data.title) : "<em>(Missing Title)</em>", count: (data.titleLength || 0) + " characters" },
      { key: "meta description", val: data.description ? escapeHtml(data.description) : "<em>(Missing Description)</em>", count: (data.descriptionLength || 0) + " characters" },
      { key: "canonical link", val: data.canonical ? ('<a href="' + escapeHtml(data.canonical) + '" target="_blank" style="color:var(--accent-cyan); text-decoration:none;">' + escapeHtml(data.canonical) + '</a>') : "<em>Not defined</em>", count: null },
      { key: "meta keywords", val: data.keywords ? (escapeHtml(data.keywords) + ' <span class="alert-pill alert-info">INFO: Obsolete for Google</span>') : "<em>None</em>", count: null },
      { key: "meta robots", val: data.robots ? escapeHtml(data.robots) : "<em>None (index, follow assumed)</em>", count: null },
      { key: "author", val: data.author ? escapeHtml(data.author) : "<em>None</em>", count: null },
      { key: "generator", val: data.generator ? escapeHtml(data.generator) : "<em>None</em>", count: null },
      { key: "theme-color", val: data.themeColor ? ('<span style="display:inline-block; width:12px; height:12px; background:' + escapeHtml(data.themeColor) + '; border-radius:2px; vertical-align:middle; margin-right:4px;"></span> ' + escapeHtml(data.themeColor)) : "<em>None</em>", count: null }
    ];
    let commonHtml = "";
    commonRows.forEach(r => {
      commonHtml += '<div class="meta-row">' +
        '<div class="meta-key">' + escapeHtml(r.key) + '</div>' +
        '<div class="meta-value-wrap">' +
        '<div class="meta-content">' + r.val + '</div>' +
        '<div class="meta-sub-info">' +
        (r.count ? '<span class="char-count">(' + escapeHtml(r.count) + ')</span>' : '') +
        '<button class="copy-btn" data-copy="' + escapeHtml(String(r.val).replace(/<[^>]*>/g, '')) + '" data-label="' + escapeHtml(r.key) + '">Copy</button>' +
        '</div>' +
        '</div></div>';
    });

    let mobileHtml = '<div class="meta-row"><div class="meta-key">viewport</div><div class="meta-value-wrap"><div class="meta-content">' + escapeHtml(data.viewport || "Missing meta viewport") + '</div><div class="meta-sub-info"><button class="copy-btn" data-copy="' + escapeHtml(data.viewport || '') + '" data-label="Viewport">Copy</button></div></div></div>';

    const findOg = (prop) => {
      const item = ogList.find(o => o.property && o.property.toLowerCase() === prop.toLowerCase());
      return item ? item.content : "";
    };
    const findTw = (name) => {
      const item = twList.find(t => t.name && t.name.toLowerCase() === name.toLowerCase());
      return item ? item.content : "";
    };
    const ogTitle = findOg("og:title") || data.title || "";
    const ogDesc = findOg("og:description") || data.description || "";
    const ogImage = findOg("og:image");
    const ogSite = findOg("og:site_name") || sourceHost;
    const twTitle = findTw("twitter:title") || ogTitle;
    const twDesc = findTw("twitter:description") || ogDesc;
    const twImage = findTw("twitter:image") || ogImage;

    let socialPreviewsHtml =
      '<div class="preview-card">' +
      '<div class="preview-card-header">Facebook / Open Graph Preview</div>' +
      '<div class="preview-img-wrap">' +
      (ogImage ? ('<img src="' + escapeHtml(ogImage) + '" alt="OG Image Preview" class="social-preview-img">') : '<span class="preview-no-img">Tidak ada og:image</span>') +
      '</div>' +
      '<div class="preview-body">' +
      '<div class="preview-domain">' + escapeHtml(ogSite) + '</div>' +
      '<div class="preview-title">' + escapeHtml(ogTitle || "Judul Halaman") + '</div>' +
      '<div class="preview-desc">' + escapeHtml(ogDesc || "Deskripsi halaman") + '</div>' +
      '</div>' +
      '</div>' +
      '<div class="preview-card">' +
      '<div class="preview-card-header">Twitter / X Card Preview</div>' +
      '<div class="preview-img-wrap">' +
      (twImage ? ('<img src="' + escapeHtml(twImage) + '" alt="Twitter Image Preview" class="social-preview-img">') : '<span class="preview-no-img">Tidak ada twitter:image</span>') +
      '</div>' +
      '<div class="preview-body">' +
      '<div class="preview-domain">' + escapeHtml(sourceHost) + '</div>' +
      '<div class="preview-title">' + escapeHtml(twTitle || "Judul Halaman") + '</div>' +
      '<div class="preview-desc">' + escapeHtml(twDesc || "Deskripsi halaman") + '</div>' +
      '</div>' +
      '</div>';

    let socTagsHtml = '<div style="display:flex; flex-direction:column; gap:4px;">';
    ogList.forEach(item => {
      socTagsHtml += '<div class="meta-row" style="padding:6px 0;"><div class="meta-key" style="color:#60a5fa;">' + escapeHtml(item.property) + '</div><div class="meta-value-wrap"><span class="meta-content">' + escapeHtml(item.content) + '</span><button class="copy-btn" data-copy="' + escapeHtml(item.content) + '" data-label="' + escapeHtml(item.property) + '">Copy</button></div></div>';
    });
    twList.forEach(item => {
      socTagsHtml += '<div class="meta-row" style="padding:6px 0;"><div class="meta-key" style="color:#38bdf8;">' + escapeHtml(item.name) + '</div><div class="meta-value-wrap"><span class="meta-content">' + escapeHtml(item.content) + '</span><button class="copy-btn" data-copy="' + escapeHtml(item.content) + '" data-label="' + escapeHtml(item.name) + '">Copy</button></div></div>';
    });
    socTagsHtml += '</div>';

    let schemaHtml = "";
    if (schemas.length === 0) {
      schemaHtml = '<div style="color:var(--text-muted); font-style:italic;">Tidak ditemukan Structured Data JSON-LD pada halaman ini.</div>';
    } else {
      schemas.forEach(s => {
        let codeStr = s.raw;
        try { codeStr = JSON.stringify(s.parsed, null, 2); } catch (e) { }
        schemaHtml += '<div class="code-block-wrap"><div class="code-block-header"><span class="title">JSON-LD #' + s.index + ' &mdash; ' + escapeHtml(s.types) + '</span><button class="copy-btn btn-copy-schema" data-idx="' + s.index + '">Copy JSON</button></div><pre class="json-code">' + escapeHtml(codeStr) + '</pre></div>';
      });
    }

    let sumHtml = "";
    ["h1", "h2", "h3", "h4", "h5", "h6"].forEach(h => {
      sumHtml += '<span class="heading-tag-badge htag-' + h + '">' + h.toUpperCase() + ': ' + (headingCounts[h] || 0) + '</span>';
    });

    let treeHtml = "";
    if (headings.length === 0) {
      treeHtml = '<div style="color:var(--text-muted); font-style:italic;">Tidak ada tag heading (H1 - H6) ditemukan.</div>';
    } else {
      headings.forEach(item => {
        const skipWarning = item.isSkip ? ('<span class="alert-pill alert-warn">Expected ' + item.expectedTag.toUpperCase() + '</span>') : "";
        const hiddenWarning = item.isHidden ? '<span class="alert-pill alert-info">Hidden Element</span>' : "";
        treeHtml += '<div class="heading-item hlevel-' + item.level + '">' +
          '<span class="heading-tag-badge htag-' + item.tag.toLowerCase() + '">' + item.tag + '</span>' +
          '<span style="flex:1; color:#fff;">' + escapeHtml(item.text) + '</span>' +
          '<span class="char-count">(' + item.length + ' chars)</span>' +
          skipWarning + hiddenWarning +
          '<button class="copy-btn" data-copy="' + escapeHtml(item.text) + '" data-label="' + item.tag + '">Copy</button>' +
          '</div>';
      });
    }

    const forms = data.forms || [];
    let formsHtml = "";
    if (forms.length > 0) {
      formsHtml = '<div style="margin-top:16px;"><strong style="font-size:12px; color:var(--accent-cyan); text-transform:uppercase;">Forms (' + forms.length + ')</strong><table class="data-table" style="margin-top:6px;"><thead><tr><th>Action</th><th>Method</th><th>Fields Count</th></tr></thead><tbody>';
      forms.forEach(f => {
        formsHtml += '<tr><td><code>' + escapeHtml(f.action) + '</code></td><td><span class="alert-pill alert-info">' + escapeHtml(f.method) + '</span></td><td>' + f.fields + ' fields</td></tr>';
      });
      formsHtml += '</tbody></table></div>';
    }

    const html5 = data.html5 || {};
    let html5Html = '<div style="margin-top:14px; padding:10px 14px; background:#0d121f; border:1px solid var(--border-color); border-radius:6px; font-size:12.5px;">' +
      '<span>Doctype is ' + (html5.isHtml5 ? '<span class="alert-pill alert-good">HTML5</span>' : '<span class="alert-pill alert-warn">Legacy / None</span>') + ' &mdash; HTML5 semantic elements ' + (html5.hasHtml5Tags ? '<span class="alert-pill alert-good">Detected</span>' : '<span class="alert-pill alert-info">None</span>') + '</span>' +
      '</div>';

    let linksHtml =
      '<table class="data-table">' +
      '<thead><tr><th>Tipe Link / Anchor</th><th>Jumlah</th><th>Status Rekomendasi SEO</th></tr></thead>' +
      '<tbody>' +
      '<tr><td><strong>Total Link &lt;a href&gt;</strong></td><td><span class="alert-pill alert-info">' + lStats.total + '</span></td><td>Semua tautan yang terdeteksi di dokumen</td></tr>' +
      '<tr><td><strong>Internal Links</strong></td><td><span class="alert-pill alert-good">' + lStats.internal + '</span></td><td>Tautan menuju halaman internal domain yang sama</td></tr>' +
      '<tr><td><strong>External Links</strong></td><td><span class="alert-pill alert-info">' + lStats.external + '</span></td><td>Tautan menuju domain lain (Outbound links)</td></tr>' +
      '<tr><td><strong>Nofollow Links</strong></td><td><span class="alert-pill alert-warn">' + lStats.nofollow + '</span></td><td>Tautan dengan instruksi <code>rel="nofollow"</code></td></tr>' +
      '<tr><td><strong>Target _blank tanpa noopener</strong></td><td><span class="alert-pill ' + (lStats.blankNoOpener > 0 ? 'alert-err' : 'alert-good') + '">' + lStats.blankNoOpener + '</span></td><td>' + (lStats.blankNoOpener > 0 ? 'Risiko keamanan tab-nabbing, tambahkan rel="noopener"' : 'Aman') + '</td></tr>' +
      '<tr><td><strong>Link Kosong / Javascript (#)</strong></td><td><span class="alert-pill alert-warn">' + lStats.empty + '</span></td><td>Tautan yang mengarah ke \'#\' atau \'javascript:void(0)\'</td></tr>' +
      '</tbody>' +
      '</table>';

    let hintsHtml = "";
    if (hints.length === 0) {
      hintsHtml = '<div style="color:var(--text-muted); font-style:italic;">Tidak ada resource hints (preload/preconnect) ditemukan.</div>';
    } else {
      hintsHtml = '<table class="data-table"><thead><tr><th>Rel</th><th>As Type</th><th>Target URL</th><th>Crossorigin</th></tr></thead><tbody>';
      hints.forEach(h => {
        hintsHtml += '<tr><td><span class="alert-pill alert-info">' + escapeHtml(h.rel) + '</span></td><td><code>' + escapeHtml(h.as) + '</code></td><td><a href="' + escapeHtml(h.href) + '" target="_blank" style="color:var(--accent-cyan); text-decoration:none;">' + escapeHtml(h.href) + '</a></td><td>' + (h.crossorigin ? escapeHtml(h.crossorigin) : '-') + '</td></tr>';
      });
      hintsHtml += '</tbody></table>';
    }

    let extHtml = "";
    if (extDomains.length === 0) {
      extHtml = '<div style="color:var(--text-muted); font-style:italic;">Tidak ada domain pihak ketiga eksternal yang dipanggil.</div>';
    } else {
      extHtml = '<table class="data-table"><thead><tr><th>Domain Eksternal</th><th>Kategori</th><th>Hits / Panggilan</th><th>Tipe Resource</th></tr></thead><tbody>';
      extDomains.forEach(ed => {
        extHtml += '<tr><td><strong>' + escapeHtml(ed.hostname) + '</strong></td><td><span class="alert-pill alert-info">' + escapeHtml(ed.category) + '</span></td><td>' + ed.count + '</td><td><code>' + escapeHtml(ed.types) + '</code></td></tr>';
      });
      extHtml += '</tbody></table>';
    }

    let secHtml =
      '<table class="data-table">' +
      '<thead><tr><th>Konfigurasi Keamanan</th><th>Nilai</th><th>Status</th></tr></thead>' +
      '<tbody>' +
      '<tr><td><strong>Protokol HTTPS</strong></td><td>' + escapeHtml(data.protocol || 'https:') + '</td><td><span class="alert-pill ' + (sec.isHttps ? 'alert-good' : 'alert-err') + '">' + (sec.isHttps ? 'SECURE (HTTPS)' : 'INSECURE (HTTP)') + '</span></td></tr>' +
      '<tr><td><strong>Content-Security-Policy (CSP)</strong></td><td>' + (sec.csp ? escapeHtml(sec.csp) : '<em>Not specified in meta</em>') + '</td><td><span class="alert-pill ' + (sec.csp ? 'alert-good' : 'alert-info') + '">' + (sec.csp ? 'Configured' : 'Optional / Server Header') + '</span></td></tr>' +
      '<tr><td><strong>Referrer-Policy</strong></td><td>' + (sec.referrerPolicy ? escapeHtml(sec.referrerPolicy) : '<em>Default browser policy</em>') + '</td><td><span class="alert-pill alert-info">' + escapeHtml(sec.referrerPolicy || 'Default') + '</span></td></tr>' +
      '</tbody>' +
      '</table>';

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IPvFooKan SEO Audit - ${escapeHtml(sourceHost)}</title>
  <style>
    /* ========================================================================
       SHADCN UI THEME TOKENS — Cyber Obsidian & Neon Amber
       Ubah token di bawah ini untuk kustomisasi tema SEO Audit Report
       ======================================================================== */
    :root {
      --background: #07090D;
      --foreground: #FFFFFF;
      --card: #0D1016;
      --card-header: #161A22;
      --popover: #161A22;
      --secondary: #1D222D;
      --muted: #161A22;
      --muted-foreground: #98A1B3;
      --border: rgba(61, 71, 92, 0.45);
      --border-light: rgba(82, 95, 122, 0.25);
      --input: rgba(61, 71, 92, 0.55);
      
      --primary: #FA9C1B;
      --primary-glow: #FFB03A;
      --primary-foreground: #07090D;
      --destructive: #F04242;
      
      --cyber-cyan: #00EAFF;
      --cyber-green: #1AE680;
      --cyber-blue: #1A79FF;
      --glow-orange: 0 0 25px rgba(250, 156, 27, 0.35);
      --glow-cyan: 0 0 25px rgba(0, 234, 255, 0.25);
      
      --radius: 8px;
      --radius-sm: 4px;
      
      /* Legacy mappings */
      --bg-body: var(--background);
      --bg-card: var(--card);
      --bg-card-alt: var(--secondary);
      --border-color: var(--border);
      --text-main: var(--foreground);
      --text-muted: var(--muted-foreground);
      --accent-cyan: var(--cyber-cyan);
      --accent-blue: var(--cyber-blue);
      --accent-green: var(--cyber-green);
      --accent-yellow: var(--primary);
      --accent-red: var(--destructive);
      --accent-purple: #c084fc;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg-body);
      color: var(--text-main);
      line-height: 1.5;
      font-size: 14px;
    }
    .app-container { display: flex; min-height: 100vh; }
    .main-content { flex: 1; padding: 24px 32px; max-width: calc(100% - 280px); }
    .sidebar-nav {
      width: 280px; position: sticky; top: 0; height: 100vh;
      overflow-y: auto; background: var(--card);
      border-left: 1px solid var(--border-color); padding: 24px 18px;
    }
    header.report-header {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius); padding: 20px 24px; margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .header-top {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
    }
    .brand-title { display: flex; align-items: center; gap: 10px; }
    .brand-title h1 { font-size: 20px; font-weight: 800; color: var(--primary); letter-spacing: -0.3px; }
    .version-tag {
      font-size: 11px; background: rgba(250, 156, 27, 0.15);
      color: var(--primary); padding: 2px 8px; border-radius: 12px;
      border: 1px solid rgba(250, 156, 27, 0.35); font-weight: 600;
    }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; font-size: 12px; font-weight: 600;
      border-radius: var(--radius-sm); border: 1px solid var(--border-color);
      background: var(--bg-card-alt); color: var(--text-main); cursor: pointer;
      transition: all 0.15s ease; text-decoration: none;
    }
    .btn:hover { background: rgba(250, 156, 27, 0.12); border-color: var(--primary); color: #fff; }
    .btn-primary { background: var(--primary); border-color: rgba(250, 156, 27, 0.5); color: #07090D; font-weight: 700; }
    .btn-primary:hover { background: var(--primary-glow); box-shadow: var(--glow-orange); }
    .target-url-box {
      background: #0d121f; border: 1px solid var(--border-color);
      border-radius: 8px; padding: 10px 14px; display: flex;
      align-items: center; justify-content: space-between; gap: 12px;
      font-family: Consolas, Monaco, monospace; font-size: 13px; word-break: break-all;
    }
    .target-url-link { color: var(--accent-cyan); text-decoration: none; }
    .target-url-link:hover { text-decoration: underline; }
    .diagnostic-cards {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px; margin-top: 16px;
    }
    .score-card {
      background: #0d121f; border: 1px solid var(--border-color);
      border-radius: 8px; padding: 12px 14px; text-align: center;
    }
    .score-num { font-size: 22px; font-weight: 800; font-family: Consolas, Monaco, monospace; }
    .score-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-top: 2px; }
    .num-good { color: var(--accent-green); }
    .num-warn { color: var(--accent-yellow); }
    .num-err { color: var(--accent-red); }
    .num-info { color: var(--accent-cyan); }
    .filter-bar { margin-bottom: 24px; display: flex; gap: 12px; }
    .search-input {
      flex: 1; background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 8px; padding: 10px 16px; color: #fff; font-size: 13px; outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus { border-color: var(--accent-cyan); box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2); }
    section.report-section {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 12px; margin-bottom: 24px; overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    }
    .section-header {
      background: #121827; padding: 14px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex; justify-content: space-between; align-items: center;
    }
    .section-title { font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
    .section-badge {
      font-size: 11px; background: var(--bg-card-alt); border: 1px solid var(--border-color);
      padding: 2px 8px; border-radius: 10px; color: var(--text-muted); font-family: Consolas, monospace;
    }
    .section-body { padding: 16px 20px; }
    .meta-row {
      display: flex; align-items: flex-start; padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05); gap: 16px;
    }
    .meta-row:last-child { border-bottom: none; }
    .meta-key {
      width: 170px; min-width: 170px; font-weight: 700;
      color: var(--accent-cyan); font-size: 12.5px; text-align: right;
      font-family: Consolas, Monaco, monospace; padding-top: 2px; word-break: break-all;
    }
    .meta-value-wrap { flex: 1; word-break: break-word; font-size: 13.5px; }
    .meta-content { color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .meta-sub-info { display: flex; align-items: center; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
    .char-count { font-size: 11px; color: var(--text-muted); font-family: Consolas, monospace; }
    .alert-pill {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
    }
    .alert-good { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .alert-warn { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .alert-err { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .alert-info { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .copy-btn {
      background: transparent; border: none; cursor: pointer; color: #64748b;
      padding: 2px 6px; font-size: 12px; border-radius: 4px; transition: all 0.15s;
    }
    .copy-btn:hover { color: var(--accent-cyan); background: rgba(56, 189, 248, 0.1); }
    .social-preview-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px; margin-top: 14px;
    }
    .preview-card { background: #0d121f; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .preview-card-header {
      padding: 8px 12px; background: #141b2b; font-weight: 700;
      font-size: 11px; color: var(--text-muted); text-transform: uppercase;
      border-bottom: 1px solid var(--border-color);
    }
    .preview-img-wrap {
      width: 100%; height: 180px; background: #090c14;
      display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .preview-img-wrap img { max-width: 100%; max-height: 100%; object-fit: cover; }
    .preview-no-img { color: #475569; font-size: 12px; }
    .preview-body { padding: 12px 14px; }
    .preview-title { font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 4px; line-height: 1.3; }
    .preview-desc { font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-bottom: 6px; }
    .preview-domain { font-size: 11px; color: var(--accent-cyan); text-transform: uppercase; font-family: Consolas, monospace; }
    .heading-tree { display: flex; flex-direction: column; gap: 6px; }
    .heading-item {
      display: flex; align-items: center; gap: 10px; padding: 6px 10px;
      border-radius: 6px; background: #0d121f; border: 1px solid rgba(255, 255, 255, 0.04); font-size: 13px;
    }
    .heading-tag-badge { font-weight: 800; font-family: Consolas, monospace; padding: 1px 6px; border-radius: 4px; font-size: 11px; }
    .htag-h1 { background: #7c3aed; color: #fff; }
    .htag-h2 { background: #0284c7; color: #fff; }
    .htag-h3 { background: #0d9488; color: #fff; }
    .htag-h4 { background: #ca8a04; color: #fff; }
    .htag-h5 { background: #475569; color: #fff; }
    .htag-h6 { background: #334155; color: #cbd5e1; }
    .hlevel-1 { margin-left: 0px; }
    .hlevel-2 { margin-left: 20px; border-left: 2px solid #0284c7; }
    .hlevel-3 { margin-left: 40px; border-left: 2px solid #0d9488; }
    .hlevel-4 { margin-left: 60px; border-left: 2px solid #ca8a04; }
    .hlevel-5 { margin-left: 80px; border-left: 2px solid #475569; }
    .hlevel-6 { margin-left: 100px; border-left: 2px solid #334155; }
    table.data-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    table.data-table th {
      text-align: left; padding: 8px 12px; background: #0d121f;
      color: var(--text-muted); border-bottom: 1px solid var(--border-color);
      font-size: 11px; text-transform: uppercase; font-weight: 600;
    }
    table.data-table td { padding: 9px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); vertical-align: middle; }
    table.data-table tr:hover { background: rgba(255, 255, 255, 0.02); }
    .code-block-wrap { background: #070a12; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
    .code-block-header {
      background: #0e1320; padding: 8px 14px; display: flex;
      justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); font-size: 12px;
    }
    .code-block-header .title { font-weight: 700; color: var(--accent-cyan); font-family: Consolas, monospace; }
    pre.json-code { padding: 12px 14px; font-family: Consolas, Monaco, monospace; font-size: 12px; color: #93c5fd; overflow-x: auto; max-height: 350px; line-height: 1.45; }
    .sidebar-nav-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 12px; }
    .nav-list { list-style: none; }
    .nav-item { margin-bottom: 4px; }
    .nav-link {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; border-radius: 6px; color: #94a3b8; text-decoration: none; font-size: 13px; font-weight: 500; transition: all 0.15s;
    }
    .nav-link:hover, .nav-link.active { background: var(--bg-card-alt); color: var(--accent-cyan); }
    .nav-count { font-size: 11px; background: #0d121f; padding: 1px 6px; border-radius: 10px; color: #64748b; font-family: Consolas, monospace; }
    .toast-msg {
      position: fixed; bottom: 24px; right: 24px; background: #0284c7; color: #fff;
      padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 13px;
      z-index: 99999; opacity: 0; transform: translateY(10px); transition: all 0.2s; pointer-events: none;
    }
    .toast-msg.show { opacity: 1; transform: translateY(0); }
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .sidebar-nav, .filter-bar, .header-actions, .copy-btn { display: none !important; }
      .main-content { max-width: 100% !important; padding: 0 !important; }
      section.report-section { border: 1px solid #ccc !important; box-shadow: none !important; break-inside: avoid; }
      .section-header { background: #f0f0f0 !important; color: #000 !important; }
      .section-title { color: #000 !important; }
      .meta-content { color: #000 !important; }
      .target-url-box { border: 1px solid #ccc !important; background: #fafafa !important; }
      pre.json-code { color: #222 !important; max-height: none !important; }
    }
  </style>
</head>
<body>
  <div class="app-container">
    <main class="main-content">
      <header class="report-header">
        <div class="header-top">
          <div class="brand-title">
            <span style="font-size:24px;">&#x1F50D;</span>
            <div>
              <h1><span style="color:var(--accent-cyan);">IPvFooKan</span> SEO Audit &mdash; <span style="color:#fff;">${escapeHtml(sourceHost)}</span></h1>
              <span class="version-tag">v0.1</span>
            </div>
          </div>
          <div class="header-actions">
            <button id="btn-copy-summary" class="btn btn-primary" title="Copy Ringkasan SEO (Markdown)">&#x1F4CB; Copy Summary</button>
            <button id="btn-export-json" class="btn" title="Export Raw Data ke JSON">&#x1F4BE; Export JSON</button>
          </div>
        </div>

        <div class="target-url-box">
          <div style="display:flex; align-items:center; gap:8px;">
            <span>&#x1F310;</span>
            <a id="target-url-link" href="${escapeHtml(sourceUrl)}" target="_blank" class="target-url-link">${escapeHtml(sourceUrl)}</a>
          </div>
          <button class="copy-btn" id="btn-copy-url" title="Copy URL">Copy</button>
        </div>

        <div class="diagnostic-cards">
          <div class="score-card"><div id="stat-tests" class="score-num">${diagnostics.length}</div><div class="score-label">Total Checks</div></div>
          <div class="score-card"><div id="stat-good" class="score-num num-good">${goodCount}</div><div class="score-label">Passed</div></div>
          <div class="score-card"><div id="stat-warn" class="score-num num-warn">${warnCount}</div><div class="score-label">Warnings</div></div>
          <div class="score-card"><div id="stat-err" class="score-num num-err">${errCount}</div><div class="score-label">Errors</div></div>
          <div class="score-card"><div id="stat-h1" class="score-num num-info">${h1Count}</div><div class="score-label">H1 Count</div></div>
          <div class="score-card"><div id="stat-schema" class="score-num num-info">${schemas.length}</div><div class="score-label">Schemas</div></div>
        </div>
      </header>

      <div class="filter-bar">
        <input type="text" id="search-input" class="search-input" placeholder="&#x1F50D; Cari meta tag, nilai property, atau heading di laporan..." />
      </div>

      <section id="diagnostics-section" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x1FA7A;</span> SEO Health Diagnostics</div>
          <span id="badge-diag-count" class="section-badge">${diagnostics.length} checks</span>
        </div>
        <div class="section-body" id="diagnostics-container">${diagHtml}</div>
      </section>

      <section id="common" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x1F4C4;</span> COMMON & CORE META</div>
          <span class="section-badge">Core SEO</span>
        </div>
        <div class="section-body" id="common-container">${commonHtml}</div>
      </section>

      <section id="mobile" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x1F4F1;</span> MOBILE & VIEWPORT</div>
          <span class="section-badge">Mobile Ready</span>
        </div>
        <div class="section-body" id="mobile-container">${mobileHtml}</div>
      </section>

      <section id="social" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x1F310;</span> SOCIAL (OPEN GRAPH & TWITTER)</div>
          <span id="badge-social-count" class="section-badge">${ogList.length + twList.length} tags</span>
        </div>
        <div class="section-body" id="social-container">
          <div class="social-preview-grid" id="social-previews-container">${socialPreviewsHtml}</div>
          <div style="margin-top:16px;" id="social-tags-container">${socTagsHtml}</div>
        </div>
      </section>

      <section id="structureddata" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x1F9E9;</span> STRUCTURED DATA (JSON-LD & SCHEMA)</div>
          <span id="badge-schema-count" class="section-badge">${schemas.length} schemas</span>
        </div>
        <div class="section-body" id="schema-container">${schemaHtml}</div>
      </section>

      <section id="headings" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x1F4D1;</span> MARKUP & HEADINGS (H1 - H6)</div>
          <span id="badge-headings-count" class="section-badge">${headings.length} headings</span>
        </div>
        <div class="section-body" id="headings-container">
          <div id="headings-summary" style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap;">${sumHtml}</div>
          <div class="heading-tree" id="headings-tree-container">${treeHtml}</div>
          ${formsHtml}
          ${html5Html}
        </div>
      </section>

      <section id="links" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x2693;</span> LINKS & ANCHORS ANALYSIS</div>
          <span id="badge-links-count" class="section-badge">${lStats.total} links</span>
        </div>
        <div class="section-body" id="links-container">${linksHtml}</div>
      </section>

      <section id="rhints" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x26A1;</span> RESOURCE HINTS</div>
          <span id="badge-hints-count" class="section-badge">${hints.length} hints</span>
        </div>
        <div class="section-body" id="hints-container">${hintsHtml}</div>
      </section>

      <section id="externalr" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x1F3E2;</span> EXTERNAL RESOURCES & 3RD PARTIES</div>
          <span id="badge-ext-count" class="section-badge">${extDomains.length} domains</span>
        </div>
        <div class="section-body" id="external-container">${extHtml}</div>
      </section>

      <section id="security" class="report-section">
        <div class="section-header">
          <div class="section-title"><span>&#x1F6E1;&#xFE0F;</span> SECURITY & CONFIG</div>
          <span class="section-badge">HTTPS & CSP</span>
        </div>
        <div class="section-body" id="security-container">${secHtml}</div>
      </section>
    </main>

    <aside class="sidebar-nav">
      <div class="sidebar-nav-title">Daftar Bagian</div>
      <ul class="nav-list">
        <li class="nav-item"><a href="#diagnostics-section" class="nav-link"><span>&#x1FA7A; Diagnostics</span></a></li>
        <li class="nav-item"><a href="#common" class="nav-link"><span>&#x1F4C4; Common Meta</span></a></li>
        <li class="nav-item"><a href="#mobile" class="nav-link"><span>&#x1F4F1; Mobile & Viewport</span></a></li>
        <li class="nav-item"><a href="#social" class="nav-link"><span>&#x1F310; Social Meta</span> <span id="nav-badge-social" class="nav-count">${ogList.length + twList.length}</span></a></li>
        <li class="nav-item"><a href="#structureddata" class="nav-link"><span>&#x1F9E9; Structured Data</span> <span id="nav-badge-schema" class="nav-count">${schemas.length}</span></a></li>
        <li class="nav-item"><a href="#headings" class="nav-link"><span>&#x1F4D1; Headings (H1-H6)</span> <span id="nav-badge-headings" class="nav-count">${headings.length}</span></a></li>
        <li class="nav-item"><a href="#links" class="nav-link"><span>&#x2693; Links Analysis</span> <span id="nav-badge-links" class="nav-count">${lStats.total}</span></a></li>
        <li class="nav-item"><a href="#rhints" class="nav-link"><span>&#x26A1; Resource Hints</span> <span id="nav-badge-hints" class="nav-count">${hints.length}</span></a></li>
        <li class="nav-item"><a href="#externalr" class="nav-link"><span>&#x1F3E2; External Resources</span> <span id="nav-badge-ext" class="nav-count">${extDomains.length}</span></a></li>
        <li class="nav-item"><a href="#security" class="nav-link"><span>&#x1F6E1;&#xFE0F; Security & Config</span></a></li>
      </ul>
      <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border-color); font-size:11px; color:#64748b; line-height:1.4;">
        IPvFooKan SEO Audit Report
      </div>
    </aside>
  </div>

  <div id="toast" class="toast-msg">Teks berhasil disalin!</div>

  <script>
    const DATA = ${JSON.stringify(data).replace(/<\/script>/gi, "<\\/script>")};

    function showToast(msg) {
      const t = document.getElementById("toast");
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

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      if (btn.id === "btn-copy-url") {
        copyText(DATA.url, "URL");
        return;
      }
      if (btn.classList.contains("btn-copy-schema")) {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        const s = (DATA.jsonLd || []).find(item => item.index === idx);
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

    const btnSum = document.getElementById("btn-copy-summary");
    if (btnSum) {
      btnSum.onclick = () => {
        let md = "URL: " + (DATA.url || "") + "\\r\\n";
        md += "Generated: " + (DATA.generatedAt || "") + "\\r\\n\\r\\n";
        md += "## Ringkasan Skor\\r\\n";
        md += "- Total Tests: " + (DATA.diagnostics ? DATA.diagnostics.length : 0) + "\\r\\n";
        md += "- Passed: " + ${goodCount} + "\\r\\n";
        md += "- Warnings: " + ${warnCount} + "\\r\\n";
        md += "- Errors: " + ${errCount} + "\\r\\n\\r\\n";
        md += "## Metadata Utama\\r\\n";
        md += "- Title (" + (DATA.titleLength || 0) + " chars): " + (DATA.title || "") + "\\r\\n";
        md += "- Description (" + (DATA.descriptionLength || 0) + " chars): " + (DATA.description || "") + "\\r\\n";
        md += "- Canonical: " + (DATA.canonical || 'None') + "\\r\\n";
        md += "- H1: " + (DATA.headingCounts ? (DATA.headingCounts.h1 || 0) : 0) + "\\r\\n";
        md += "- Structured Data: " + (DATA.jsonLd ? DATA.jsonLd.length : 0) + " schemas\\r\\n\\r\\n";
        md += "## Diagnostik\\r\\n";
        (DATA.diagnostics || []).forEach(d => {
          md += "- [" + d.level.toUpperCase() + "] " + d.category + ": " + d.message + "\\r\\n";
        });
        copyText(md, "Ringkasan Markdown");
      };
    }

    const btnExport = document.getElementById("btn-export-json");
    if (btnExport) {
      btnExport.onclick = () => {
        const jsonStr = JSON.stringify(DATA, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "seo_" + (DATA.hostname || "report") + "_" + Date.now() + ".json";
        a.click();
        URL.revokeObjectURL(url);
        showToast("✅ Berhasil mengekspor JSON!");
      };
    }


    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = document.querySelectorAll(".meta-row, .heading-item");
        rows.forEach(r => {
          if (!query) {
            r.style.display = "";
            return;
          }
          const text = r.textContent.toLowerCase();
          r.style.display = text.includes(query) ? "" : "none";
        });
      };
    }
  </script>
</body>
</html>`;
  }

  function openSeoInNewTab() {
    const sourceUrl = window.location.href;
    const sourceHost = window.location.hostname || "page";

    showCopyToast("🚀 Membuka IPvFooKan SEO (" + escapeHtml(sourceHost) + ") di Tab Baru...");

    const seoData = extractPageSeoData();
    const seoPayload = {
      page: {
        url: sourceUrl,
        title: document.title,
        hostname: sourceHost
      },
      last_seo_data: seoData,
      timestamp: Date.now()
    };

    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(seoPayload, () => {
          chrome.runtime.sendMessage({ cmd: "open_seo_tab" }, (res) => {
            if (chrome.runtime.lastError || !res || res.status !== "ok") {
              openPreRenderedSeoBlob(seoData);
            }
          });
        });
        return;
      }
    } catch (e) {
      console.warn("openSeoInNewTab storage error:", e);
    }

    openPreRenderedSeoBlob(seoData);
  }

  function openPreRenderedSeoBlob(seoData) {
    const fullHtml = buildSeoReportHtml(seoData);
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  }

  window.__ipvfoo_open_linkgrabber = openGrabberInNewTab;
  window.__ipvfoo_open_seo = openSeoInNewTab;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && (msg.action === "take_screenshot" || msg.cmd === "takeFullPageScreenshot")) {
      takeFullPageScreenshot();
      sendResponse({ ok: true });
    }
    if (msg && msg.action === "open_linkgrabber") {
      openGrabberInNewTab();
      sendResponse({ ok: true });
    }
    if (msg && msg.action === "open_seo") {
      openSeoInNewTab();
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
