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
  "dit.whatsapp.net",
  "lh3.googleusercontent.com",
  "api.github.com",
  "apis.google.com",
  "analytics.google.com",
  "maps.googleapis.com",
  "storage.googleapis.com",
  "cdnjs.cloudflare.com",
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

// Load hit counter dari chrome.storage
async function loadHitCounter() {
  try {
    const result = await chrome.storage.local.get(['ipHitCounter', 'lastResetDate']);
    const today = new Date().toDateString();
    const lastReset = result.lastResetDate;
    
    if (lastReset !== today) {
      hitCounter = {};
      await chrome.storage.local.set({ ipHitCounter: {}, lastResetDate: today });
    } else if (result.ipHitCounter) {
      hitCounter = result.ipHitCounter;
    }
  } catch (e) {
    console.log('Could not load hit counter:', e);
  }
}

async function saveHitCounter() {
  try {
    await chrome.storage.local.set({ ipHitCounter: hitCounter });
  } catch (e) {
    console.log('Could not save hit counter:', e);
  }
}

async function resetAllCounters() {
  hitCounter = {};
  await chrome.storage.local.set({ ipHitCounter: {}, lastResetDate: new Date().toDateString() });
  if (table && table.firstChild) {
    const rows = Array.from(table.children);
    rows.forEach((tr, index) => {
      if (tr._tuple) {
        const newRow = makeRow(index === 0, tr._tuple);
        tr.parentNode.replaceChild(newRow, tr);
      }
    });
  }
}

window.onload = async function() {
  await loadHitCounter();
  table = document.getElementById("addr_table");
  table.onmousedown = handleMouseDown;
  
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "x";
  resetBtn.style.cssText = "position: fixed; top: 5px; right: 5px; padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; z-index: 1000;";
  resetBtn.onclick = async () => {
    if (confirm("Reset all IP hit counters?")) {
      await resetAllCounters();
    }
  };
  document.body.appendChild(resetBtn);
  
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
    const promise = chrome.permissions.request({origins: [ALL_URLS]});
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
  const port = chrome.runtime.connect(null, {name: tabId});
  port.onMessage.addListener((msg) => {
    document.bgColor = "";
    switch (msg.cmd) {
      case "pushAll":
        return pushAll(msg.tuples, msg.pattern, msg.color, msg.spillCount);
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

// MODIFIKASI: Filter semua domain saat pertama kali dimuat
function pushAll(tuples, pattern, color, spillCount) {
  removeChildren(table);
  const filteredTuples = tuples.filter(t => !HIDDEN_DOMAINS.includes(t[0]));
  for (let i = 0; i < filteredTuples.length; i++) {
    table.appendChild(makeRow(i == 0, filteredTuples[i]));
  }
  pushPattern(pattern, color);
  pushSpillCount(spillCount);
}

// MODIFIKASI: Jangan tambahkan jika domain ada di daftar hidden
async function pushOne(tuple) {
  const domain = tuple[0];
  const addr = tuple[1];
  
  if (HIDDEN_DOMAINS.includes(domain)) {
    return; // Stop di sini, jangan diproses
  }

  if (addr && addr !== "(x)" && !addr.startsWith("(")) {
    hitCounter[addr] = (hitCounter[addr] || 0) + 1;
    saveHitCounter();
  }
  
  let insertHere = null;
  let isFirst = true;
  for (let tr = table.firstChild; tr; tr = tr.nextSibling) {
    if (tr._domain == domain) {
      minimalCopy(makeRow(isFirst, tuple), tr);
      return;
    }
    if (isFirst) {
      isFirst = false;
    } else if (tr._domain > domain) {
      insertHere = tr;
      break;
    }
  }
  table.insertBefore(makeRow(false, tuple), insertHere);
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
  setTimeout(function() { document.body.className = ""; }, 600);
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

function makeSslImg(flags) {
  switch (flags & (DFLAG_SSL | DFLAG_NOSSL)) {
    case DFLAG_SSL | DFLAG_NOSSL:
      return makeImg("gray_schrodingers_lock.png", "Mixture of HTTPS and non-HTTPS connections.");
    case DFLAG_SSL:
      return makeImg("gray_lock.png", "Connection uses HTTPS.\nWarning: IPvFoo does not verify the integrity of encryption.");
    default:
      return makeImg("gray_unlock.png", "Connection does not use HTTPS.");
  }
}

function makeRow(isFirst, tuple) {
  const domain = tuple[0];
  const addr = tuple[1];
  const version = tuple[2];
  const flags = tuple[3];
  const tr = document.createElement("tr");
  if (isFirst) tr.className = "mainRow";
  tr._tuple = tuple;
  
  const sslImg = makeSslImg(flags);
  sslImg.className = "sslImg";
  const domainTd = document.createElement("td");
  domainTd.appendChild(sslImg);
  const selectMe = document.createElement("span");
  domainTd.appendChild(selectMe);
  selectMe.className = "selectMe";
  if (domain.length > LONG_DOMAIN) {
    selectMe.appendChild(makeSnippedText(domain, Math.floor(LONG_DOMAIN / 2)));
  } else {
    selectMe.appendChild(document.createTextNode(domain));
  }
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
  addrTd.appendChild(document.createTextNode(addr));
  addrTd.onclick = handleClick;
  addrTd.oncontextmenu = handleContextMenu;
  
  const bgpTd = document.createElement("td");
  bgpTd.className = `bgpTd${connectedClass}`;
  if (addr && addr !== "(x)" && !addr.startsWith("(")) {
    const bgpLink = document.createElement("a");
    bgpLink.href = `https://bgp.he.net/ip/${addr}`;
    bgpLink.textContent = "bgp";
    bgpLink.target = "_blank";
    bgpLink.style.color = "#00d9ff";
    bgpLink.style.textDecoration = "none";
    bgpTd.appendChild(bgpLink);
  } else {
    bgpTd.appendChild(document.createTextNode("(x)"));
    bgpTd.style.color = "#999";
  }
  
  const hitsTd = document.createElement("td");
  hitsTd.className = `hitsTd${connectedClass}`;
  const hits = hitCounter[addr] || 0;
  hitsTd.appendChild(document.createTextNode(hits));
  hitsTd.style.textAlign = "center";
  hitsTd.style.color = hits > 0 ? "#48ff00" : "#999";
  hitsTd.style.fontWeight = hits > 0 ? "bold" : "normal";
  
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
  tr.appendChild(bgpTd);
  tr.appendChild(hitsTd);
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
  if (isSpuriousSelection(sel, e.timeStamp)) sel.removeAllRanges();
  selectWholeAddress(this, sel);
  return sel;
}

function nodeToRange(node) {
  const range = document.createRange();
  range.selectNodeContents(node.querySelector('.selectMe') || node);
  return range;
}

function handleClick(e) {
  const sel = window.getSelection();
  if (e.detail == 1 && oldRanges.length == 1) {
    if (sameRange(nodeToRange(this), oldRanges[0])) {
      sel.removeAllRanges();
      return;
    }
  }
  selectWholeAddress(this, sel);
}

function selectWholeAddress(node, sel) {
  if (sel.isCollapsed || !sel.containsNode(node, true)) {
    sel.removeAllRanges();
    sel.addRange(nodeToRange(node));
  }
}