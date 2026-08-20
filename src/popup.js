/*
Copyright (C) 2011  Paul Marks  http://www.pmarks.net/
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
"use strict";

// Requires <script src="common.js">
const ALL_URLS = "<all_urls>";
const LONG_DOMAIN = 50;
const tabId = window.location.hash.substr(1);
let table = null;
let hitCounter = {};
let byteCounter = {};
let gSawHttpGt1 = false;

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const val = bytes / Math.pow(k, i);
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${sizes[i]}`;
}

// --- DAFTAR DOMAIN YANG DISEMBUNYIKAN ---
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

// Load hit & byte counter dari chrome.storage
async function loadHitCounter() {
  try {
    const result = await chrome.storage.local.get(['ipHitCounter', 'ipByteCounter', 'lastResetDate']);
    const today = new Date().toDateString();
    if (result.lastResetDate !== today) {
      hitCounter = {};
      byteCounter = {};
    } else {
      hitCounter = result.ipHitCounter || {};
      byteCounter = result.ipByteCounter || {};
    }
  } catch (e) {
    console.log('Could not load hit/byte counter:', e);
  }
}

async function resetAllCounters() {
  hitCounter = {};
  byteCounter = {};
  try {
    await chrome.runtime.sendMessage({ cmd: "resetHitCounter" });
  } catch (e) {
    await chrome.storage.local.set({ ipHitCounter: {}, ipByteCounter: {}, lastResetDate: new Date().toDateString() });
  }
  if (table && table.firstChild) {
    for (let tr = table.firstChild; tr; tr = tr.nextSibling) {
      const hitsTd = tr.querySelector('.hitsTd');
      if (hitsTd) {
        hitsTd.textContent = "0";
        hitsTd.style.color = "#999";
        hitsTd.style.fontWeight = "normal";
      }
      const sizeTd = tr.querySelector('.sizeTd');
      if (sizeTd) {
        sizeTd.textContent = "0 B";
        sizeTd.style.color = "#999";
      }
    }
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.ipHitCounter) {
      hitCounter = changes.ipHitCounter.newValue || {};
    }
    if (changes.ipByteCounter) {
      byteCounter = changes.ipByteCounter.newValue || {};
    }
    if (table) {
      for (let tr = table.firstChild; tr; tr = tr.nextSibling) {
        if (tr._tuple) {
          const addr = tr._tuple[1];
          const hitsTd = tr.querySelector('.hitsTd');
          if (hitsTd) {
            const hits = hitCounter[addr] || 0;
            hitsTd.textContent = hits;
            hitsTd.style.color = hits > 0 ? "#48ff00" : "#999";
            hitsTd.style.fontWeight = hits > 0 ? "bold" : "normal";
          }
          const sizeTd = tr.querySelector('.sizeTd');
          if (sizeTd) {
            const bytes = byteCounter[addr] || 0;
            sizeTd.textContent = formatBytes(bytes);
            sizeTd.style.color = bytes > 0 ? "#ffd700" : "#999";
          }
        }
      }
    }
  }
});

let currentSort = { column: 'default', order: 'asc' };

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
    const aBytes = (a && a[5] !== undefined) ? a[5] : (byteCounter[a[1]] || 0);
    const bBytes = (b && b[5] !== undefined) ? b[5] : (byteCounter[b[1]] || 0);
    if (aBytes !== bBytes) {
      return currentSort.order === 'asc' ? aBytes - bBytes : bBytes - aBytes;
    }
  } else if (currentSort.column === 'hits') {
    const aHits = (a && a[4] !== undefined) ? a[4] : (hitCounter[a[1]] || 0);
    const bHits = (b && b[4] !== undefined) ? b[4] : (hitCounter[b[1]] || 0);
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

window.onload = async function () {
  await loadHitCounter();
  table = document.getElementById("addr_table");
  table.onmousedown = handleMouseDown;

  const rstBtn = document.getElementById("rst_btn");
  if (rstBtn) {
    rstBtn.onclick = async () => {
      if (confirm("Reset all IP hit counters?")) {
        await resetAllCounters();
      }
    };
  }

  const closeBtn = document.getElementById("close_btn");
  if (closeBtn) {
    closeBtn.onclick = () => {
      window.close();
    };
  }

  if (IS_MOBILE) {
    document.getElementById("mobile_footer").style.display = "flex";
    document.addEventListener("selectionchange", redrawLookupBubble);
    const resizeObserver = new ResizeObserver(redrawLookupBubble);
    resizeObserver.observe(table);
  }
  if (/^[0-9]+$/.test(tabId)) {
    await beg();
    connectToExtension();
  } else if (tabId) {
    throw new Error(`Bad tabId: ${tabId}`);
  } else {
    console.log("No tabId, using test table");
    const TEST_TUPLES = [
      ["ipv6.example.com", "2001:db8::f00", "6", DFLAG_H1, 10, 1048576, 200, 25, "AS15169"],
      ["ipv4.example.com", "192.0.2.9", "4", DFLAG_NO_TLS, 5, 2048, 200, 40, "AS13335"],
      ["cached.example.com", "2001:db8::f00", "6", DFLAG_H3 | AFLAG_CACHE, 2, 512, 304, 5, "AS15169"],
    ];
    pushAll(TEST_TUPLES, "646", REGULAR_COLOR, 0, true);
  }
};

const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let darkMode = darkModeQuery.matches;
darkModeQuery.addEventListener("change", async (event) => {
  darkMode = event.matches;
  await optionsReady;
  if (lastColor) {
    setColorIsDarkMode(lastColor, darkMode);
  }
});

async function beg() {
  const p = await chrome.permissions.getAll();
  for (const origin of p.origins) {
    if (origin == ALL_URLS) return;
  }
  const button = document.getElementById("beg");
  button.style.display = "block";
  button.addEventListener("click", async () => {
    const promise = chrome.permissions.request({ origins: [ALL_URLS] });
    window.close();
    await promise;
  });
}

function redrawLookupBubble() {
  const bubble = document.getElementById("lookup_bubble");
  const sel = window.getSelection();
  const text = sel.toString();
  const menuTitle = lookupMenuTitle(text);
  const href = selectionToLookupUrl(text)?.href;
  if (!(menuTitle && href)) {
    bubble.style.display = "none";
    return;
  }
  const link = document.getElementById("lookup_link");
  link.textContent = menuTitle;
  link.href = href;
  const selRect = sel.getRangeAt(0).getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();
  bubble.style.display = "block";
  bubble.style.top = `${selRect.bottom + window.scrollY + 5}px`;
  bubble.style.setProperty('--bubble-left', `${selRect.left - 10}px`);
  bubble.style.setProperty('--table-left', `${tableRect.left}px`);
  bubble.style.setProperty('--table-width', `${tableRect.width}px`);
  const bubbleRect = bubble.getBoundingClientRect();
  bubble.style.setProperty('--bubble-width', `${bubbleRect.width}px`);
}

function connectToExtension() {
  const port = chrome.runtime.connect(null, { name: tabId });
  port.onMessage.addListener((msg) => {
    document.bgColor = "";
    switch (msg.cmd) {
      case "pushAll":
        return pushAll(msg.tuples, msg.pattern, msg.color, msg.spillCount, msg.sawHttpGt1);
      case "pushOne":
        return pushOne(msg.tuple);
      case "pushPattern":
        return pushPattern(msg.pattern, msg.color);
      case "pushSpillCount":
        return pushSpillCount(msg.spillCount);
      case "shake":
        return shake();
    }
  });
  port.onDisconnect.addListener(() => {
    document.bgColor = "lightpink";
    setTimeout(connectToExtension, 1);
  });
}

// Clear the table, and fill it with new data.
function pushAll(tuples, pattern, color, spillCount, sawHttpGt1) {
  gSawHttpGt1 = sawHttpGt1;
  removeChildren(table);
  const filteredTuples = tuples.filter(t => !HIDDEN_DOMAINS.includes(t[0]));
  if (filteredTuples.length > 0) {
    const mainTuple = filteredTuples[0];
    const otherTuples = filteredTuples.slice(1).sort(compareTuples);
    table.appendChild(makeRow(true, mainTuple));
    for (let i = 0; i < otherTuples.length; i++) {
      table.appendChild(makeRow(false, otherTuples[i]));
    }
  }
  pushPattern(pattern, color);
  pushSpillCount(spillCount);
}

// Jangan tambahkan jika domain ada di daftar hidden & sortir posisi yang sesuai
async function pushOne(tuple) {
  const domain = tuple[0];
  if (HIDDEN_DOMAINS.includes(domain)) {
    return; // Stop di sini, jangan diproses
  }

  let existingRow = null;
  for (let tr = table.firstChild; tr; tr = tr.nextSibling) {
    if (tr._domain === domain) {
      existingRow = tr;
      break;
    }
  }

  if (existingRow) {
    const wasFirst = existingRow === table.firstChild;
    if (wasFirst) {
      minimalCopy(makeRow(true, tuple), existingRow);
      existingRow._tuple = tuple;
      return;
    }
    table.removeChild(existingRow);
  }

  let insertHere = null;
  for (let tr = table.firstChild; tr; tr = tr.nextSibling) {
    if (tr === table.firstChild) {
      continue;
    }
    if (tr._tuple && compareTuples(tuple, tr._tuple) < 0) {
      insertHere = tr;
      break;
    }
  }
  const newRow = makeRow(false, tuple);
  table.insertBefore(newRow, insertHere);
  if (IS_MOBILE) { zoomHack(); } else { scrollbarHack(); }
}

let lastPattern = "";
let lastColor = "";
function pushPattern(pattern, color) {
  if (lastColor != color) {
    lastColor = color;
    setColorIsDarkMode(lastColor, darkMode);
  }
  if (!IS_MOBILE) return;
  if (lastPattern != pattern) {
    lastPattern = pattern;
  } else {
    return;
  }
  for (const color of ["darkfg", "lightfg"]) {
    const img = document.getElementById(`pattern_icon_${color}`);
    img.src = iconPath(pattern, 32, color);
  }
}

function pushSpillCount(count) {
  document.getElementById("spill_count_container").style.display = count == 0 ? "none" : "block";
  removeChildren(document.getElementById("spill_count")).appendChild(document.createTextNode(count));
  if (IS_MOBILE) { zoomHack(); } else { scrollbarHack(); }
}

function shake() {
  document.body.className = "shake";
  setTimeout(function () { document.body.className = ""; }, 600);
}

function zoomHack() {
  const tableWidth = document.querySelector('table').offsetWidth;
  document.querySelector('meta[name="viewport"]').setAttribute('content', `width=${tableWidth}`);
  table.style.setProperty('--cache-min-width', `${tableWidth * 0.08}px`);
}

let redrawn = false;
function scrollbarHack() {
  if (typeof browser == "undefined") return;
  setTimeout(() => {
    const e = document.documentElement;
    if (e.scrollHeight > e.clientHeight) {
      document.body.style.paddingRight = '20px';
    } else if (!redrawn) {
      document.body.classList.toggle('force-redraw');
      redrawn = true;
    }
  }, 200);
}

function minimalCopy(src, dst) {
  dst.className = src.className;
  for (let s = src.firstChild, d = dst.firstChild, sNext, dNext; s && d; s = sNext, d = dNext) {
    sNext = s.nextSibling;
    dNext = d.nextSibling;
    d.className = s.className;
    if (!d.isEqualNode(s)) {
      dst.replaceChild(s, d);
    }
  }
}

function makeImg(src, title) {
  const img = document.createElement("img");
  img.src = src; img.title = title;
  return img;
}

function makeHttpImg(flags) {
  if (flags & DFLAG_NO_TLS) {
    return makeImg(
        "gray_unlock.png",
        "Some connections do not use TLS.");
  }
  if (gSawHttpGt1) {
    if (flags & DFLAG_H3) {
      return makeImg(
          "gray_h3.png",
          "HTTP/3 (with TLS) is the max version seen.");
    }
    if (flags & DFLAG_H2) {
      return makeImg(
          "gray_h2.png",
          "HTTP/2 (with TLS) is the max version seen.");
    }
    if (flags & DFLAG_H1) {
      return makeImg(
          "gray_h1.png",
          "HTTP/1.x (with TLS) is the max version seen.");
    }
  } else if (flags & (DFLAG_H1 | DFLAG_H2 | DFLAG_H3 | DFLAG_SSL)) {
    return makeImg(
        "gray_lock.png",
        "All connections use TLS.");
  }
  return makeImg(
      "gray_question.png",
      "Failed to parse HTTP status.");
}

function makeSelectMe(...children) {
  const span = document.createElement("span");
  span.className = "selectMe";
  for (const child of children) {
    if (child instanceof Node) {
      span.appendChild(child);
    } else {
      span.appendChild(document.createTextNode(child));
    }
  }
  return span;
}

function makeRow(isFirst, tuple) {
  const domain = tuple[0];
  const addr = tuple[1];
  const version = tuple[2];
  const flags = tuple[3];
  const tr = document.createElement("tr");
  if (isFirst) tr.className = "mainRow";
  tr._tuple = tuple;

  // Build the HTTP icon for the "zeroth" pseudo-column.
  const httpImg = makeHttpImg(flags);
  httpImg.className = "httpImg";

  // Build the "Domain" column.
  const domainTd = document.createElement("td");
  domainTd.appendChild(httpImg);
  domainTd.appendChild(makeSelectMe(
      domain.length > LONG_DOMAIN ? makeSnippedText(domain, Math.floor(LONG_DOMAIN / 2)) : domain));
  domainTd.className = "domainTd";
  domainTd.onclick = handleClick;
  domainTd.oncontextmenu = handleContextMenu;

  const addrTd = document.createElement("td");
  let addrClass = "";
  switch (version) {
    case "4": addrClass = " ip4"; break;
    case "6": addrClass = " ip6"; break;
  }
  const connectedClass = (flags & DFLAG_CONNECTED) ? " highlight" : "";
  addrTd.className = `addrTd${addrClass}${connectedClass}`;
  const match = addr.match(/^(.*:)(\d+[.]\d+[.]\d+[.]\d+)$/);
  if (match) {
    addrTd.appendChild(makeSelectMe(match[1], makeSelectMe(match[2])));
  } else {
    addrTd.appendChild(makeSelectMe(addr));
  }

  addrTd.onclick = handleClick;
  addrTd.oncontextmenu = handleContextMenu;

  const statusTd = document.createElement("td");
  statusTd.className = `statusTd${connectedClass}`;
  const status = (tuple && tuple[6] !== undefined) ? tuple[6] : 200;
  statusTd.textContent = status;
  statusTd.style.textAlign = "center";
  statusTd.style.fontFamily = "monospace";
  statusTd.style.fontSize = "10.5px";
  statusTd.style.fontWeight = "bold";
  if (typeof status === "number") {
    if (status >= 500) statusTd.style.color = "#ff5252";
    else if (status >= 400) statusTd.style.color = "#ffa726";
    else if (status >= 300) statusTd.style.color = "#64b5f6";
    else statusTd.style.color = "#48ff00";
  } else {
    statusTd.style.color = "#ff5252";
  }

  const latTd = document.createElement("td");
  latTd.className = `latTd${connectedClass}`;
  const latency = (tuple && tuple[7] !== undefined) ? tuple[7] : 0;
  latTd.textContent = latency > 0 ? `${latency}ms` : "-";
  latTd.style.textAlign = "right";
  latTd.style.fontFamily = "monospace";
  latTd.style.fontSize = "10.5px";
  if (latency > 500) latTd.style.color = "#ff5252";
  else if (latency > 150) latTd.style.color = "#ffd700";
  else if (latency > 0) latTd.style.color = "#48ff00";
  else latTd.style.color = "#777";

  const hitsTd = document.createElement("td");
  hitsTd.className = `hitsTd${connectedClass}`;
  const hits = (tuple && tuple[4] !== undefined) ? tuple[4] : (hitCounter[addr] || 0);
  hitsTd.appendChild(document.createTextNode(hits));
  hitsTd.style.textAlign = "center";
  hitsTd.style.color = hits > 0 ? "#48ff00" : "#999";
  hitsTd.style.fontWeight = hits > 0 ? "bold" : "normal";

  const sizeTd = document.createElement("td");
  sizeTd.className = `sizeTd${connectedClass}`;
  const bytes = (tuple && tuple[5] !== undefined) ? tuple[5] : (byteCounter[addr] || 0);
  sizeTd.appendChild(document.createTextNode(formatBytes(bytes)));
  sizeTd.style.textAlign = "right";
  sizeTd.style.color = bytes > 0 ? "#ffd700" : "#999";
  sizeTd.style.fontSize = "11px";
  sizeTd.style.fontFamily = "monospace";
  sizeTd.style.paddingLeft = "4pt";
  sizeTd.style.paddingRight = "4pt";

  const bgpTd = document.createElement("td");
  bgpTd.className = `bgpTd${connectedClass}`;
  const asn = tuple && tuple[8];
  let bgpText = "bgp";
  let bgpHref = `https://bgp.he.net/ip/${addr}`;
  if (asn) {
    const cleanAsn = asn.split(" ")[0];
    bgpText = cleanAsn;
    if (cleanAsn.startsWith("AS")) {
      bgpHref = `https://bgp.he.net/${cleanAsn}`;
    }
  }
  if (addr && addr !== "(x)" && !addr.startsWith("(")) {
    const bgpLink = document.createElement("a");
    bgpLink.href = bgpHref;
    bgpLink.textContent = bgpText;
    bgpLink.target = "_blank";
    bgpLink.style.color = "#00d9ff";
    bgpLink.style.textDecoration = "none";
    bgpTd.appendChild(bgpLink);
  } else {
    bgpTd.appendChild(document.createTextNode("-"));
    bgpTd.style.color = "#999";
  }

  const cacheTd = document.createElement("td");
  cacheTd.className = `cacheTd${connectedClass}`;
  if (flags & DFLAG_WEBSOCKET) {
    cacheTd.appendChild(makeImg("websocket.png", "WebSocket handshake."));
    cacheTd.style.paddingLeft = '6pt';
  } else if (flags & AFLAG_CACHE) {
    cacheTd.appendChild(makeImg("cached_arrow.png", "Data from cached requests."));
    cacheTd.style.paddingLeft = '6pt';
  } else {
    cacheTd.style.paddingLeft = '0';
  }

  tr._domain = domain;
  tr.appendChild(domainTd);
  tr.appendChild(addrTd);
  tr.appendChild(statusTd);
  tr.appendChild(latTd);
  tr.appendChild(hitsTd);
  tr.appendChild(sizeTd);
  tr.appendChild(bgpTd);
  tr.appendChild(cacheTd);
  return tr;
}

function makeSnippedText(domain, keep) {
  const prefix = domain.substr(0, keep);
  const snipped = domain.substr(keep, domain.length - 2 * keep);
  const suffix = domain.substr(domain.length - keep);
  const f = document.createDocumentFragment();
  f.appendChild(document.createTextNode(prefix));
  let snippedText = document.createElement("span");
  snippedText.className = "snippedTextInvisible";
  snippedText.textContent = snipped;
  f.appendChild(snippedText);
  const snipImg = makeImg("snip.png", "");
  snipImg.className = "snipImg";
  const snipLink = document.createElement("a");
  snipLink.className = "snipLinkInvisible snipLinkVisible";
  snipLink.href = "#";
  snipLink.addEventListener("click", unsnipAll);
  snipLink.appendChild(snipImg);
  f.appendChild(snipLink);
  f.appendChild(document.createTextNode(suffix));
  return f;
}

function unsnipAll(event) {
  event.preventDefault();
  removeStyles(".snippedTextInvisible", ".snipLinkVisible");
}

function removeStyles(...selectors) {
  const stylesheet = document.styleSheets[0];
  for (const selector of selectors) {
    for (let i = stylesheet.cssRules.length - 1; i >= 0; i--) {
      const rule = stylesheet.cssRules[i];
      if (rule.selectorText === selector) {
        stylesheet.deleteRule(i);
      }
    }
  }
}

let oldTimeStamp = 0;
let oldRanges = [];
function handleMouseDown(e) {
  oldTimeStamp = e.timeStamp;
  oldRanges = [];
  const sel = window.getSelection();
  for (let i = 0; i < sel.rangeCount; i++) {
    oldRanges.push(sel.getRangeAt(i));
  }
}

function sameRange(r1, r2) {
  return (r1.compareBoundaryPoints(Range.START_TO_START, r2) == 0 &&
    r1.compareBoundaryPoints(Range.END_TO_END, r2) == 0);
}

function isSpuriousSelection(sel, newTimeStamp) {
  if (newTimeStamp - oldTimeStamp > 10) return false;
  if (sel.rangeCount != oldRanges.length) return true;
  for (let i = 0; i < sel.rangeCount; i++) {
    if (!sameRange(sel.getRangeAt(i), oldRanges[i])) return true;
  }
  return false;
}

function handleContextMenu(e) {
  const sel = window.getSelection();
  if (isSpuriousSelection(sel, e.timeStamp)) {
    sel.removeAllRanges();
  }
  selectAddress(this, e.target, sel);
  return sel;
}

// Find the innermost "selectMe" that the user clicked on directly,
// otherwise find the outermost "selectMe" in the cell.
// This will either select a NAT64 IPv4 suffix, or the entire address.
function findSelectMe(node, target) {
  const range = document.createRange();
  range.selectNodeContents(
      target?.closest(".selectMe") || node.querySelector(".selectMe"));
  return range;
}

function showPopupToast(msg) {
  let toast = document.getElementById("popup-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "popup-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: #00d9ff;
      color: #111;
      padding: 3px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      z-index: 99999;
      pointer-events: none;
      transition: opacity 0.2s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
  }, 1500);
}

function handleClick(e) {
  const text = (this.querySelector('.selectMe') || this).textContent.trim();
  if (text && text !== "(x)" && text !== "-") {
    navigator.clipboard.writeText(text).then(() => {
      showPopupToast(`Copied: ${text}`);
    }).catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showPopupToast(`Copied: ${text}`);
    });
  }
  const sel = window.getSelection();
  if (e.detail == 1 && oldRanges.length == 1) {
    if (sameRange(findSelectMe(this, e.target), oldRanges[0])) {
      sel.removeAllRanges();
      return;
    }
  }

  selectAddress(this, e.target, sel);
}

// If the user hasn't manually selected part of the address, then select
// the whole thing, to make copying easier.
function selectAddress(node, target, sel) {
  if (sel.isCollapsed || !sel.containsNode(node, true)) {
    sel.removeAllRanges();
    sel.addRange(findSelectMe(node, target));
  }
}