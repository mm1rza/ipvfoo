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

/*
Lifecycle documentation:

The purpose of requestMap is to copy tabInfo from wR.onBeforeRequest to
wR.onResponseStarted (where the IP address is available), and to maintain
the highlighted cell when a connection is open.  A map entry lives from
onBeforeRequest until wR.onCompleted or wR.onErrorOccurred.

An entry in tabMap tries to approximate one "page view".  It begins in
wR.onBeforeRequest(main_frame), and goes away either when another page
begins, or when the tab ceases to exist (see TabTracker for details.)

Icon updates begin once TabTracker succeeds AND (
    wR.onResponseStarted reports the first IP address OR
    wN.onCommitted fires).
Note that we'd like to avoid flashing '?' during a page load.

Popup updates begin sooner, in wR.onBeforeRequest(main_frame), because the
user can demand a popup before any IP addresses are available.
*/

"use strict";

if (chrome.runtime.getManifest().background.service_worker) {
  // This only runs on Chrome.
  // Firefox uses manifest.json/background/scripts instead.
  importScripts("iputil.js", "common.js");
}

// Possible states for an instance of TabInfo.
// We begin at BIRTH, and only ever move forward, not backward.
const TAB_BIRTH = 0;    // Waiting for makeAlive() or remove()
const TAB_ALIVE = 1;    // Waiting for remove()
const TAB_DEAD = 2;

// RequestFilter for webRequest events.
const FILTER_ALL_URLS = { urls: ["<all_urls>"] };

const SECONDS = 1000;  // to milliseconds

const NAME_VERSION = (() => {
  const m = chrome.runtime.getManifest();
  return `${m.name} v${m.version}`;
})();

let debug = false;
function debugLog() {
  if (debug) {
    console.log(new Date().toISOString(), ...arguments);
  }
}

// Log errors from async listeners, because otherwise Firefox hides them
// in the global console.
function wrap(f) {
  const tracer = new Error("wrap() stack trace");
  return (...args) => f(...args).catch((err) => {
    console.error("Error in async listener:", err, tracer);
  });
}

function parseUrl(url) {
  let domain = null;
  let ssl = false;
  let ws = false;

  const u = new URL(url);
  if (u.protocol == "file:") {
    domain = "file://";
  } else if (u.protocol == "chrome:") {
    domain = "chrome://";
  } else {
    domain = u.hostname || "";
    switch (u.protocol) {
      case "https:":
        ssl = true;
        break;
      case "wss:":
        ssl = true;
        // fallthrough
      case "ws:":
        ws = true;
        break;
    }
  }
  return { domain: domain, ssl: ssl, ws: ws, origin: u.origin };
}

function updateNAT64(domain, addr) {
  if (!(IPV4_ONLY_DOMAINS.has(domain) && addr)) {
    return;
  }
  const packed = parseIP(addr);
  if (packed.length != 128/4) {
    return;  // not an IPv6 address
  }
  // Heuristic: Don't consider this a NAT64 prefix if the embedded
  // IPv4 address falls under 0.x.x.x/8.  This filters out cases where all
  // traffic is proxied to the same address, assuming that most proxies
  // have a low-numbered suffix like ::1.
  if (packed.substr(96/4, 2) == '00') {
    return;
  }
  // If this is a new prefix, the watchOptions callback will handle it.
  addPackedNAT64(packed.slice(0, 96/4));
}

class SaveableEntry {
  #prefix;
  #id;
  #dirty = false;
  #remove = false;
  #savedJSON = null;

  constructor(prefix, id) {
    if (!prefix) throw "missing prefix";
    if (!id) throw "missing id";
    this.#prefix = prefix;
    this.#id = id;
  }

  id() { return this.#id; }

  load(j) {
    this.#savedJSON = j;
    for (const [k, v] of Object.entries(JSON.parse(j))) {
      if (this.hasOwnProperty(k)) {
        this[k] = v;
      } else {
        console.error("skipping unknown key", k);
      }
    }
    return this;
  }

  // Limit to 1 in-flight chrome.storage operation per key.
  // No need to await.
  async save() {
    if (this.#dirty) {
      return;  // Already saving.
    }
    this.#dirty = true;
    await null;  // Let the caller finish first.
    while (this.#dirty) {
      this.#dirty = false;
      const key = `${this.#prefix}${this.#id}`
      if (this.#remove) {
        await chrome.storage.session.remove(key);
        return;
      }
      const j = JSON.stringify(this);
      if (this.#savedJSON == j) {
        return;
      }
      //console.log("saving", key, j);
      await chrome.storage.session.set({[key]: j});
      this.#savedJSON = j;
    }
  }

  // No need to await.
  async remove() {
    this.#remove = true;
    await this.save();
  }
}

class SaveableMap {
  #factory;
  #prefix;

  constructor(factory, prefix) {
    this.#factory = factory;
    this.#prefix = prefix;
  }

  validateId(id) {
    if (this.#prefix == "ip/") {
      // Don't restrict ipCache domain name keys.
      return id;
    } else {
      const idNumeric = parseInt(id, 10);
      if (idNumeric) {
        return idNumeric;
      }
    }
    throw `malformed id: ${id}`;
  }

  load(key, savedJSON) {
    if (!key.startsWith(this.#prefix)) {
      return false;
    }
    const suffix = key.slice(this.#prefix.length);
    let id;
    try {
      id = this.validateId(suffix);
    } catch(err) {
      console.error(err);
      return false;
    }
    this[id] = new this.#factory(this.#prefix, id).load(savedJSON);
    return true;
  }

  lookupOrNew(id) {
    id = this.validateId(id);
    let o = this[id];
    if (!o) {
      o = this[id] = new this.#factory(this.#prefix, id);
    }
    return o;
  }

  remove(id) {
    id = this.validateId(id);
    const o = this[id];
    if (o) {
      delete this[id];
      o.remove();
    }
    return o;
  }
}

// -- TabInfo --

class TabInfo extends SaveableEntry {
  born = Date.now();     // For TabTracker timeout.
  mainRequestId = null;  // Request that constructed this tab, if any.
  mainDomain = "";       // Bare domain from the main_frame request.
  mainOrigin = "";       // Origin from the main_frame request.
  committed = false;     // True if onCommitted has fired.
  domains = newMap();    // Updated whenever we get some IPs.
  spillCount = 0;        // How many requests didn't fit in domains.
  lastPattern = "";      // To avoid redundant icon redraws.
  lastTooltip = "";      // To avoid redundant tooltip updates.
  color = REGULAR_COLOR  // or INCOGNITO_COLOR

  // Private, to avoid writing to storage.
  #state = TAB_BIRTH;

  constructor(prefix, tabId) {
    super(prefix, tabId);

    if (!options.ready) throw "must await optionsReady!";

    if (tabMap[tabId]) throw "Duplicate entry in tabMap";
    if (tabTracker.exists(tabId)) {
      this.makeAlive();
    }
  }

  afterLoad() {
    for (const [domain, json] of Object.entries(this.domains)) {
      this.domains[domain] = DomainInfo.fromJSON(this, domain, json);
    }
    updateOriginMap(this.id(), null, this.mainOrigin);
  }

  tooYoungToDie() {
    // Spare new tabs from garbage collection for a minute or so.
    return (this.#state == TAB_BIRTH &&
            this.born >= Date.now() - 60*SECONDS);
  }

  makeAlive() {
    if (this.#state != TAB_BIRTH) {
      return;
    }
    this.#state = TAB_ALIVE;
    this.updateIcon();
  }

  remove() {
    super.remove();  // no await
    this.#state = TAB_DEAD;
    this.domains = newMap();
    updateOriginMap(this.id(), this.mainOrigin, null);
  }

  setInitialDomain(requestId, domain, origin) {
    if (this.mainRequestId == null) {
      this.mainRequestId = requestId;
    } else if (this.mainRequestId != requestId) {
      console.error("mainRequestId changed!");
    }
    this.mainDomain = domain;
    updateOriginMap(this.id(), this.mainOrigin, origin);
    this.mainOrigin = origin;

    // If anyone's watching, show some preliminary state.
    this.pushAll();
    this.save();
  }

  setCommitted(domain, origin) {
    let changed = false;

    if (this.mainDomain != domain) {
      this.mainDomain = domain;
      changed = true;
    }
    this.committed = true;

    // This is usually redundant, but lastPattern takes care of it.
    this.updateIcon();

    // If the table contents changed, then redraw it.
    if (changed) {
      this.pushAll();
    }

    this.save();
  }

  // If the pageAction is supposed to be visible now, then draw it again.
  refreshPageAction() {
    this.lastTooltip = "";
    this.lastPattern = "";
    this.updateIcon();
    this.save();
  }

  addDomain(domain, dflags, addr, aflags, bytes = 0, statusCode = 200, latencyMs = 0) {
    let d = this.domains[domain];
    let addressOrFlagsChanged = true;
    if (!d) {
      // Limit the number of domains per page, to avoid wasting RAM.
      if (Object.keys(this.domains).length >= 256) {
        popups.pushSpillCount(this.id(), ++this.spillCount);
        return;
      }
      d = this.domains[domain] =
          new DomainInfo(this, domain, addr || "(lost)", dflags | aflags);
      if (statusCode) d.statusCode = statusCode;
      if (latencyMs) d.latencyMs = latencyMs;
      d.hits = 1;
      d.bytes = bytes || 0;
      d.countUp();
    } else {
      const oldAddr = d.addr;
      const oldFlags = d.flags;

      // Domain flags just accumulate.
      d.flags |= dflags;

      if (statusCode) d.statusCode = statusCode;
      if (latencyMs) d.latencyMs = latencyMs;
      d.hits = (d.hits || 0) + 1;
      if (bytes > 0) d.bytes = (d.bytes || 0) + bytes;

      // The numerical value of aflags determines which address to keep
      // (uncached replaces cached, etc.)
      if (addr && aflags <= (d.flags & AFLAG_MASK)) {
        d.addr = addr;
        d.flags = (d.flags & DFLAG_MASK) | aflags;
      }
      d.countUp();
      if (d.addr == oldAddr && d.flags == oldFlags) {
        addressOrFlagsChanged = false;
      }
    }

    const effectiveAddr = d.addr || addr;
    if (effectiveAddr && effectiveAddr !== "(x)" && effectiveAddr !== "(lost)" && !effectiveAddr.startsWith("(")) {
      recordIpHit(effectiveAddr, bytes);
      getAsnInfo(effectiveAddr);
    }

    if (addressOrFlagsChanged) {
      this.updateIcon();
      this.save();
    }
    this.pushOne(domain);
  }

  updateIcon() {
    if (!(this.#state == TAB_ALIVE)) {
      return;
    }
    let pattern = "?";
    let has4 = false;
    let has6 = false;
    for (const d of Object.values(this.domains)) {
      if (d.flags & DFLAG_CONNECTED) {
        switch (d.addrVersion()) {
          case "4": has4 = true; break;
          case "6": has6 = true; break;
        }
      }
    }
    if (!has4 && !has6) {
      for (const d of Object.values(this.domains)) {
        switch (d.addrVersion()) {
          case "4": has4 = true; break;
          case "6": has6 = true; break;
        }
      }
    }
    if (has4 && has6) pattern = "46";
    else if (has4) pattern = "4";
    else if (has6) pattern = "6";

    // Set pageAction icon and tooltip.
    const action = chrome.pageAction || chrome.action;
    const tooltip = this.mainDomain ? `IPvFoo: ${this.mainDomain}` : "IPvFoo";

    if (this.lastTooltip != tooltip) {
      action.setTitle({
        "tabId": this.id(),
        "title": tooltip,
      });
      this.lastTooltip = tooltip;
      this.save();
    }

    if (this.lastPattern != pattern) {
      const color = options[this.color] || "darkfg";
      action.setIcon({
        "tabId": this.id(),
        "path": {
          "16": iconPath(pattern, 16, color),
          "32": iconPath(pattern, 32, color),
        },
      });
      popups.pushPattern(this.id(), pattern, this.color);
      if (action.show) {
        action.show(this.id());
      }
      this.lastPattern = pattern;
      this.save();
    }
  }

  pushAll() {
    popups.pushAll(this.id(), this.getTuples(), this.lastPattern, this.color, this.spillCount);
  }

  pushOne(domain) {
    popups.pushOne(this.id(), this.getTuple(domain));
  }

  // Build [domain, addr, version, flags, hits, bytes, statusCode, latencyMs, asn] tuples
  getTuples() {
    const mainDomain = this.mainDomain || "(no domain)";
    const domains = Object.keys(this.domains).sort();
    const mainTuple = [mainDomain, "(x)", "?", 0, 0, 0, 200, 0, ""];
    const tuples = [mainTuple];
    for (const domain of domains) {
      const d = this.domains[domain];
      const hits = d.hits || 0;
      const bytes = d.bytes || 0;
      const asn = (d.addr && getAsnInfo(d.addr)) || "";
      const status = d.statusCode || 200;
      const latency = d.latencyMs || 0;
      if (domain == mainTuple[0]) {
        mainTuple[1] = d.addr;
        mainTuple[2] = d.addrVersion();
        mainTuple[3] = d.flags;
        mainTuple[4] = hits;
        mainTuple[5] = bytes;
        mainTuple[6] = status;
        mainTuple[7] = latency;
        mainTuple[8] = asn;
      } else {
        tuples.push([domain, d.addr, d.addrVersion(), d.flags, hits, bytes, status, latency, asn]);
      }
    }
    return tuples;
  }

  getTuple(domain) {
    const d = this.domains[domain];
    if (!d) {
      return null;
    }
    const hits = d.hits || 0;
    const bytes = d.bytes || 0;
    const asn = (d.addr && getAsnInfo(d.addr)) || "";
    const status = d.statusCode || 200;
    const latency = d.latencyMs || 0;
    return [domain, d.addr, d.addrVersion(), d.flags, hits, bytes, status, latency, asn];
  }
}

class DomainInfo {
  tabInfo;
  domain;
  addr;
  flags;
  statusCode = 200;
  latencyMs = 0;
  hits = 0;
  bytes = 0;

  count = 0;  // count of active requests
  inhibitZero = false;

  constructor(tabInfo, domain, addr, flags) {
    this.tabInfo = tabInfo;
    this.domain = domain;
    this.addr = addr;
    this.flags = flags;
  }

  toJSON() {
    return [this.addr, this.flags & ~DFLAG_CONNECTED, this.statusCode || 200, this.latencyMs || 0, this.hits || 0, this.bytes || 0];
  }

  static fromJSON(tabInfo, domain, json) {
    const [addr, flags, statusCode, latencyMs, hits, bytes] = json;
    const di = new DomainInfo(tabInfo, domain, addr, flags);
    if (statusCode) di.statusCode = statusCode;
    if (latencyMs) di.latencyMs = latencyMs;
    if (hits) di.hits = hits;
    if (bytes) di.bytes = bytes;
    return di;
  }

  addrVersion() {
    if (this.addr) {
      if (this.addr.indexOf(".") >= 0) return "4";
      if (this.addr.indexOf(":") >= 0) return "6";
    }
    return "?";
  }

  async countUp() {
    this.flags |= DFLAG_CONNECTED;
    if (++this.count == 1 && !this.inhibitZero) {
      this.inhibitZero = true;
      await sleep(500);
      this.inhibitZero = false;
      this.#checkZero();
    }
  }

  countDown() {
    if (!(this.count > 0)) throw "Count went negative!";
    --this.count;
    this.#checkZero();
  }

  #checkZero() {
    if (this.count == 0 && !this.inhibitZero) {
      this.flags &= ~DFLAG_CONNECTED;
      this.tabInfo.pushOne(this.domain);
    }
  }
}

class RequestInfo extends SaveableEntry {
  tabIdToBorn = newMap();
  domain = null;
  prefetch = false;
  bytes = 0;
  startTime = 0;
  statusCode = 0;
  latencyMs = 0;

  afterLoad() {
    for (const [tabId, tabBorn] of Object.entries(this.tabIdToBorn)) {
      const tabInfo = tabMap[tabId];
      if (tabInfo?.born != tabBorn) {
        delete this.tabIdToBorn[tabId];
        continue;
      }
      if (!this.domain) {
        continue;  // still waiting for onResponseStarted
      }
      tabInfo.addDomain(this.domain, 0, null, 0);
    }
    if (Object.keys(this.tabIdToBorn).length == 0) {
      requestMap.remove(this.id());
      console.log("garbage-collected RequestInfo", this.id());
      return;
    }
  }
}

class IPCacheEntry extends SaveableEntry {
  time = 0;
  addr = "";
}

// tabId -> TabInfo
const tabMap = new SaveableMap(TabInfo, "tab/")

// requestId -> RequestInfo
const requestMap = new SaveableMap(RequestInfo, "req/");

// Firefox-only domain->ip cache, to help work around
// https://bugzilla.mozilla.org/show_bug.cgi?id=1395020
const IP_CACHE_LIMIT = 1024;
const ipCache = (typeof browser == "undefined") ? null : new SaveableMap(IPCacheEntry, "ip/");
let ipCacheSize = 0;

function ipCacheGrew() {
  ++ipCacheSize;
  //console.log("ipCache", ipCacheSize, Object.keys(ipCache).length);
  if (ipCacheSize <= IP_CACHE_LIMIT) {
    return;
  }
  // Garbage collect half the entries.
  const flat = Object.values(ipCache);
  flat.sort((a, b) => a.time - b.time);
  ipCacheSize = flat.length;  // redundant
  for (const cachedAddr of flat) {
    ipCache.remove(cachedAddr.id());
    if (--ipCacheSize <= IP_CACHE_LIMIT/2) {
      break;
    }
  }
}

// mainOrigin -> Set of tabIds, for tabless service workers.
const originMap = newMap();

function updateOriginMap(tabId, oldOrigin, newOrigin) {
  if (oldOrigin && oldOrigin != newOrigin) {
    const tabs = originMap[oldOrigin];
    if (tabs) {
      tabs.delete(tabId);
      if (!tabs.size) {
        delete originMap[oldOrigin];
      }
    }
  }
  if (newOrigin) {
    let tabs = originMap[newOrigin];
    if (!tabs) {
      tabs = originMap[newOrigin] = new Set();
    }
    tabs.add(tabId);
  }
}

function lookupOriginMap(origin) {
  // returns a Set of tabId values.
  return originMap[origin] || new Set();
}

// Dark mode detection. This can eventually be replaced by
// https://github.com/w3c/webextensions/issues/229
(async () => {
  // Only do dark mode detection on first boot.
  // We will still get updates from the popup windows when visible.
  await optionsReady;
  if (options[REGULAR_COLOR]) {
    return;
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    // Firefox can detect dark mode from the background page.
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    setColorIsDarkMode(REGULAR_COLOR, query.matches);
  } else {
    // Chrome needs an offscreen document to detect dark mode.
    // See the onMessage handler below.
    try {
      await chrome.offscreen.createDocument({
        url: "detectdarkmode.html",
        reasons: ['MATCH_MEDIA'],
        justification: 'detect light/dark mode for icon colors',
      });
    } catch {
      console.log("detectdarkmode failed!");
    }
    try {
      await chrome.offscreen.closeDocument();
    } catch {
      // ignore
    }
  }
})();

// -- IP Hit & Byte Counter (Background Persistent Tracking) --
let ipHitCounter = {};
let ipByteCounter = {};
let lastResetDate = null;
let hitCounterLoaded = false;
let hitCounterSaveTimeout = null;

async function loadHitCounterBackground() {
  try {
    const result = await chrome.storage.local.get(['ipHitCounter', 'ipByteCounter', 'lastResetDate']);
    const today = new Date().toDateString();
    if (result.lastResetDate && result.lastResetDate !== today) {
      ipHitCounter = {};
      ipByteCounter = {};
      lastResetDate = today;
      await chrome.storage.local.set({ ipHitCounter: {}, ipByteCounter: {}, lastResetDate: today });
    } else {
      ipHitCounter = result.ipHitCounter || {};
      ipByteCounter = result.ipByteCounter || {};
      lastResetDate = result.lastResetDate || today;
    }
    hitCounterLoaded = true;
  } catch (e) {
    console.error("Could not load hit counter in background:", e);
    hitCounterLoaded = true;
  }
}

function saveHitCounterBackgroundDebounced() {
  if (hitCounterSaveTimeout) clearTimeout(hitCounterSaveTimeout);
  hitCounterSaveTimeout = setTimeout(async () => {
    try {
      await chrome.storage.local.set({
        ipHitCounter: ipHitCounter,
        ipByteCounter: ipByteCounter,
        lastResetDate: lastResetDate
      });
    } catch (e) {
      console.error("Could not save hit/byte counter in background:", e);
    }
  }, 1000);
}

function recordIpHit(addr, bytes = 0) {
  if (!addr || addr === "(x)" || addr === "(lost)" || addr.startsWith("(")) {
    return;
  }
  const today = new Date().toDateString();
  if (hitCounterLoaded && lastResetDate && lastResetDate !== today) {
    ipHitCounter = {};
    ipByteCounter = {};
    lastResetDate = today;
  }
  ipHitCounter[addr] = (ipHitCounter[addr] || 0) + 1;
  if (bytes > 0) {
    ipByteCounter[addr] = (ipByteCounter[addr] || 0) + bytes;
  }
  saveHitCounterBackgroundDebounced();
}

// ASN & Geo IP Cache
let ipAsnCache = {};
let asnPending = new Set();

async function loadAsnCache() {
  try {
    const res = await chrome.storage.local.get(['ipAsnCache']);
    if (res.ipAsnCache) ipAsnCache = res.ipAsnCache;
  } catch (e) {}
}

function isPrivateIP(addr) {
  if (!addr || addr === "(x)" || addr === "(lost)" || addr.startsWith("(")) return false;
  if (addr === "127.0.0.1" || addr === "::1" || addr === "localhost") return true;

  const parts = addr.split(".");
  if (parts.length === 4) {
    const o1 = parseInt(parts[0], 10);
    const o2 = parseInt(parts[1], 10);
    if (isNaN(o1) || isNaN(o2)) return false;

    // RFC 1918: 10.0.0.0/8
    if (o1 === 10) return true;
    // RFC 1918: 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    // RFC 1918: 192.168.0.0/16
    if (o1 === 192 && o2 === 168) return true;
    // RFC 3927: 169.254.0.0/16 Link-Local
    if (o1 === 169 && o2 === 254) return true;
    // RFC 5735: 127.0.0.0/8 Loopback
    if (o1 === 127) return true;
    // RFC 6598: 100.64.0.0/10 CGNAT
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;
    return false;
  }

  const lower = addr.toLowerCase();
  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:")) {
    return true;
  }
  return false;
}

function getAsnInfo(addr) {
  if (!addr || addr === "(x)" || addr === "(lost)" || addr.startsWith("(")) {
    return "";
  }
  // Check private / LAN IP ranges strictly following CIDR
  if (isPrivateIP(addr)) {
    return "LAN";
  }

  if (ipAsnCache[addr]) {
    // If it was wrongly cached as LAN before, discard
    if (ipAsnCache[addr] === "LAN") {
      delete ipAsnCache[addr];
    } else {
      return ipAsnCache[addr];
    }
  }

  // Fetch ASN asynchronously in background if not pending
  if (!asnPending.has(addr)) {
    asnPending.add(addr);
    fetchAsnInfo(addr);
  }

  return "";
}

async function fetchAsnInfo(addr) {
  try {
    const res = await fetch(`https://ipwhois.app/json/${addr}?objects=asn,org,country_code`);
    if (res.ok) {
      const data = await res.json();
      if (data.asn || data.country_code) {
        const asnStr = `${data.asn || ""} ${data.country_code || ""}`.trim();
        ipAsnCache[addr] = asnStr;
        chrome.storage.local.set({ ipAsnCache });
        for (const tabInfo of Object.values(tabMap)) {
          for (const [domain, di] of Object.entries(tabInfo.domains)) {
            if (di.addr === addr) {
              tabInfo.pushOne(domain);
            }
          }
        }
      }
    }
  } catch (e) {}
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.hasOwnProperty("darkModeOffscreen")) {
    setColorIsDarkMode(REGULAR_COLOR, message.darkModeOffscreen);
  }
  if (message.hasOwnProperty("setStorageSyncDebounce")) {
    storageSyncDebouncer.set(message.setStorageSyncDebounce);
  }
  if (message?.cmd === "resetHitCounter") {
    ipHitCounter = {};
    ipByteCounter = {};
    for (const tabInfo of Object.values(tabMap)) {
      for (const d of Object.values(tabInfo.domains)) {
        d.hits = 0;
        d.bytes = 0;
      }
      tabInfo.pushAll();
    }
    lastResetDate = new Date().toDateString();
    chrome.storage.local.set({ ipHitCounter: {}, ipByteCounter: {}, lastResetDate: lastResetDate });
    if (hitCounterSaveTimeout) clearTimeout(hitCounterSaveTimeout);
    sendResponse?.({ status: "ok" });
  }
});

// This class prevents writing to storage.sync more than once per second,
// so the user can type in a text field without spamming the network.
// It runs in background.js to avoid data loss if the user closes the
// options window within 1 second of typing.
class StorageSyncDebouncer {
  latest = {};
  pending = {};
  writePromise = null;
  set(items) {
    for (let [key, value] of Object.entries(items)) {
      if (this.latest[key] !== value) {
        this.latest[key] = value;
        this.pending[key] = value;
      }
    }
    if (!this.writePromise && Object.keys(this.pending).length > 0) {
      this.writePromise = this._writeWithDelay();
    }
  }
  async _writeWithDelay() {
    while (Object.keys(this.pending).length > 0) {
      const toWrite = this.pending;
      this.pending = {};
      //console.log("writing", toWrite);
      await Promise.all([
        chrome.storage.sync.set(toWrite),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
    }
    this.writePromise = null;
  }
}
const storageSyncDebouncer = new StorageSyncDebouncer();

// Must "await storageReady;" before reading maps.
// You can force initStorage() from the console for debugging purposes.
const initStorage = async () => {
  await optionsReady;
  await loadHitCounterBackground();
  await loadAsnCache();

  // These are be no-ops unless initStorage() is called manually.
  clearMap(tabMap);
  clearMap(requestMap);
  if (ipCache) clearMap(ipCache);

  const items = await chrome.storage.session.get();
  const unparseable = [];
  for (const [k, v] of Object.entries(items)) {
    if (!(tabMap.load(k, v) || requestMap.load(k, v) || ipCache?.load(k, v))) {
      unparseable.push(k);
    }
  }
  if (unparseable.length) {
    console.error("skipped unparseable keys:", unparseable);
  }
  // Reconsitute the DomainInfo objects and connection counts.
  for (const tabInfo of Object.values(tabMap)) {
    tabInfo.afterLoad();
  }
  for (const requestInfo of Object.values(requestMap)) {
    requestInfo.afterLoad();
  }
  if (ipCache) {
    ipCacheSize = Object.keys(ipCache).length;
  }
};
const storageReady = initStorage();

// -- Popups & In-Page Overlays --
class Popups {
  ports = newMap();  // tabId -> Set of ports

  attachPort(port) {
    const tabId = port.sender?.tab?.id || port.name;
    if (!this.ports[tabId]) {
      this.ports[tabId] = new Set();
    }
    this.ports[tabId].add(port);
    tabMap[tabId]?.pushAll();
  }

  detachPort(port) {
    const tabId = port.sender?.tab?.id || port.name;
    if (this.ports[tabId]) {
      this.ports[tabId].delete(port);
      if (this.ports[tabId].size === 0) {
        delete this.ports[tabId];
      }
    }
  }

  pushAll(tabId, tuples, pattern, color, spillCount) {
    if (this.ports[tabId]) {
      for (const port of this.ports[tabId]) {
        try {
          port.postMessage({
            cmd: "pushAll",
            tuples: tuples,
            pattern: pattern,
            color: color,
            spillCount: spillCount,
          });
        } catch (e) {}
      }
    }
  }

  pushOne(tabId, tuple) {
    if (!tuple) return;
    if (this.ports[tabId]) {
      for (const port of this.ports[tabId]) {
        try {
          port.postMessage({
            cmd: "pushOne",
            tuple: tuple,
          });
        } catch (e) {}
      }
    }
  }

  pushPattern(tabId, pattern, color) {
    if (this.ports[tabId]) {
      for (const port of this.ports[tabId]) {
        try {
          port.postMessage({
            cmd: "pushPattern",
            pattern: pattern,
            color: color,
          });
        } catch (e) {}
      }
    }
  }

  pushSpillCount(tabId, count) {
    if (this.ports[tabId]) {
      for (const port of this.ports[tabId]) {
        try {
          port.postMessage({
            cmd: "pushSpillCount",
            spillCount: count,
          });
        } catch (e) {}
      }
    }
  }

  toggleOverlay(tabId) {
    if (this.ports[tabId]) {
      for (const port of this.ports[tabId]) {
        try {
          port.postMessage({
            cmd: "toggleOverlay",
          });
        } catch (e) {}
      }
    }
  }

  shake(tabId) {
    if (this.ports[tabId]) {
      for (const port of this.ports[tabId]) {
        try {
          port.postMessage({
            cmd: "shake",
          });
        } catch (e) {}
      }
    }
  }
}

const popups = new Popups();

chrome.runtime.onConnect.addListener(wrap(async (port) => {
  await storageReady;
  popups.attachPort(port);
  port.onDisconnect.addListener(() => {
    popups.detachPort(port);
  });
}));

const actionApi = chrome.action || chrome.pageAction;
actionApi?.onClicked?.addListener(wrap(async (tab) => {
  await storageReady;
  if (tab?.id) {
    popups.toggleOverlay(tab.id);
  }
}));

// Refresh icons after chrome.runtime.reload()
chrome.runtime.onInstalled.addListener(wrap(async () => {
  await storageReady;
  for (const tabInfo of Object.values(tabMap)) {
    tabInfo.refreshPageAction();
  }
}));

// -- TabTracker --

// This class keeps track of every usable tabId, sending notifications when a
// tab appears or disappears.
//
// Rationale:
//
// Sometimes a webRequest event belongs to a hidden tab (e.g. for a pre-rendered
// page), and we can't set a pageAction on it until it becomes visible.
// However, hidden tabs may vanish without a trace, so the best we can really
// do is set a timer, and abandon hope if it doesn't appear.
//
// Once a tab has become visible, then hopefully we can rely on the onRemoved
// event to fire sometime in the future, when the user closes it.
class TabTracker {
  tabSet = newMap();  // Set of all known tabIds

  constructor() {
    chrome.tabs.onCreated.addListener(wrap(async (tab) => {
      await storageReady;
      this.#addTab(tab.id, "onCreated");
    }));
    chrome.tabs.onRemoved.addListener(wrap(async (tabId) => {
      await storageReady;
      this.#removeTab(tabId, "onRemoved");
    }));
    chrome.tabs.onReplaced.addListener(wrap(async (addId, removeId) => {
      await storageReady;
      this.#removeTab(removeId, "onReplaced");
      this.#addTab(addId, "onReplaced");
    }));
    this.#pollAllTabs();
  }

  exists(tabId) {
    return !!this.tabSet[tabId];
  }

  // Every 5 minutes (or after a service_worker restart),
  // poke any tabs that have become out of sync.
  async #pollAllTabs() {
    await storageReady;  // load 'born' timestamps first.
    while (true) {
      const result = await chrome.tabs.query({});
      this.tabSet = newMap();
      for (const tab of result) {
        this.#addTab(tab.id, "pollAlltabs")
      }
      for (const tabId of Object.keys(tabMap)) {
        if (!this.tabSet[tabId]) {
          this.#removeTab(tabId, "pollAllTabs");
        }
      }
      await sleep(300*SECONDS);
    }
  }

  #addTab(tabId, logText) {
    debugLog("addTab", tabId, logText);
    this.tabSet[tabId] = true;
    tabMap[tabId]?.makeAlive();
  }

  #removeTab(tabId, logText) {
    debugLog("removeTab", tabId, logText);
    delete this.tabSet[tabId];
    if (tabMap[tabId]?.tooYoungToDie()) {
      return;
    }
    tabMap.remove(tabId);
  }
}

const tabTracker = new TabTracker();

// -- webNavigation --

// Typically, onBeforeNavigate fires between the main_frame
// onBeforeRequest and onResponseStarted events, and we don't have to do
// anything here.
//
// However, when the site is using a service worker, the main_frame request
// never happens, so we need to initialize the tab here instead.
//
// Conveniently, this also ensures that the previous page data is cleared
// when navigating to a file://, chrome://, or Chrome Web Store URL.
chrome.webNavigation.onBeforeNavigate.addListener(wrap(async (details) => {
  if (!(details.frameId == 0 && details.tabId > 0)) {
    return;
  }
  await storageReady;
  let tabInfo = tabMap[details.tabId];
  const requestInfo = requestMap[tabInfo?.mainRequestId];
  if (requestInfo && requestInfo.domain == null) {
    return;  // Typical no-op case.
  }
  debugLog(`tabId=${details.tabId} is a service worker or special URL`);
  const parsed = parseUrl(details.url);
  tabMap.remove(details.tabId);
  tabInfo = tabMap.lookupOrNew(details.tabId);
  tabInfo.setInitialDomain(-1, parsed.domain, parsed.origin);
}));

chrome.webNavigation.onCommitted.addListener(wrap(async (details) => {
  debugLog("wN.oC", details?.tabId, details?.url, details);
  await storageReady;
  if (details.frameId != 0) {
    return;
  }
  const parsed = parseUrl(details.url);
  const tabInfo = tabMap.lookupOrNew(details.tabId);
  tabInfo.setCommitted(parsed.domain, parsed.origin);
}));

// -- tabs --

// Whenever anything tab-related happens, try to refresh the pageAction.  This
// is hacky and inefficient, but the back-stabbing browser leaves me no choice.
// This seems to fix http://crbug.com/124970 and some problems on Google+.
chrome.tabs.onUpdated.addListener(wrap(async (tabId, changeInfo, tab) => {
  debugLog("tabs.oU", tabId);
  await storageReady;
  const tabInfo = tabMap[tabId];
  if (tabInfo) {
    tabInfo.color = tab.incognito ? INCOGNITO_COLOR : REGULAR_COLOR;
    tabInfo.refreshPageAction();
  }
}));

// -- webRequest --

// Experimentally, a main_frame request with a documentId refers to a prefetch
// (possibly using https://developer.chrome.com/blog/private-prefetch-proxy)
// rather than a top-level navigation to a new URL.
function isProperMainFrame(details) {
  return (details.type == "main_frame" || details.type == "outermost_frame") &&
      !details.documentId;
}

chrome.webRequest.onBeforeRequest.addListener(wrap(async (details) => {
  debugLog("wR.oBR", details?.tabId, details?.url, details);
  await storageReady;
  const tabId = details.tabId;
  const tabInfos = [];
  let prefetch = false;
  if (tabId > 0) {
    if (isProperMainFrame(details)) {
      const parsed = parseUrl(details.url);
      tabMap.remove(tabId);
      const tabInfo = tabMap.lookupOrNew(tabId);
      tabInfo.setInitialDomain(details.requestId, parsed.domain, parsed.origin);
      tabInfos.push(tabInfo);
    } else {
      prefetch = (details.type == "main_frame" || details.type == "outermost_frame");
      const tabInfo = tabMap[tabId];
      if (tabInfo) {
        tabInfos.push(tabInfo);
      }
    }
  } else if (tabId == -1 && (details.initiator || details.documentUrl)) {
    // Chrome uses initiator, Firefox uses documentUrl.
    const initiator = details.initiator || parseUrl(details.documentUrl).origin;
    // Request is from a tabless Service Worker.
    // Find all tabs matching the initiator's origin.
    for (const tabId of lookupOriginMap(initiator)) {
      const tabInfo = tabMap[tabId];
      if (tabInfo) {
        tabInfos.push(tabInfo);
      }
    }
  }
  if (!tabInfos.length) {
    return;
  }
  const requestInfo = requestMap.lookupOrNew(details.requestId);
  if (requestInfo.tabIdToBorn.size || requestInfo.domain) {
    // Can this actually happen?
    console.error("duplicate request; connection count leak");
  }
  for (const tabInfo of tabInfos) {
    requestInfo.tabIdToBorn[tabInfo.id()] = tabInfo.born;
  }
  requestInfo.domain = null;
  requestInfo.prefetch = prefetch;
  requestInfo.startTime = Date.now();
  requestInfo.save();
}), FILTER_ALL_URLS);

// In the event of a redirect, the mainOrigin may change
// (from http: to https:) between the onBeforeRequest and onCommitted events,
// triggering an "access denied" error.  Patch this from onBeforeRedirect.
//
// As of 2022, this can be tested by visiting http://maps.google.com/
chrome.webRequest.onBeforeRedirect.addListener(wrap(async (details) => {
  await storageReady;
  if (!isProperMainFrame(details)) {
    return;
  }
  const requestInfo = requestMap[details.requestId];
  if (!requestInfo) {
    return;
  }
  for (const [tabId, tabBorn] of Object.entries(requestInfo.tabIdToBorn)) {
    const tabInfo = tabMap[tabId];
    if (tabInfo?.born != tabBorn) {
      continue;
    }
    if (tabInfo.committed) {
      console.error("onCommitted before onBeforeRedirect!");
      continue;
    }
    const parsed = parseUrl(details.redirectUrl);
    tabInfo.setInitialDomain(requestInfo.id(), parsed.domain, parsed.origin);
  }

}), FILTER_ALL_URLS);

chrome.webRequest.onHeadersReceived.addListener(wrap(async (details) => {
  await storageReady;
  const requestInfo = requestMap[details.requestId];
  if (!requestInfo) return;
  if (details.statusCode) {
    requestInfo.statusCode = details.statusCode;
  }
  if (requestInfo.startTime) {
    requestInfo.latencyMs = Math.max(1, Date.now() - requestInfo.startTime);
  }
  const clHeader = details.responseHeaders?.find(h => h.name.toLowerCase() === "content-length");
  if (clHeader) {
    const bytes = parseInt(clHeader.value, 10);
    if (!isNaN(bytes) && bytes > 0) {
      requestInfo.bytes = bytes;
    }
  }
  requestInfo.save();
}), FILTER_ALL_URLS, ["responseHeaders"]);

chrome.webRequest.onResponseStarted.addListener(wrap(async (details) => {
  //debugLog("wR.oRS", details?.tabId, details?.url, details);
  await storageReady;
  const requestInfo = requestMap[details.requestId];
  if (!requestInfo) {
    return;
  }
  const tabInfos = [];
  for (const [tabId, tabBorn] of Object.entries(requestInfo.tabIdToBorn)) {
    const tabInfo = tabMap[tabId];
    if (tabInfo?.born != tabBorn) {
      continue;
    }
    tabInfos.push(tabInfo);
  }
  if (!tabInfos.length) {
    return;
  }
  const parsed = parseUrl(details.url);
  if (!parsed.domain) {
    return;
  }

  let addr = details.ip;
  let fromCache = details.fromCache;

  if (!fromCache) {
    updateNAT64(parsed.domain, addr);
  }

  if (ipCache) {
    // This runs on Firefox only.
    if (addr) {
      const cachedAddr = ipCache.lookupOrNew(parsed.domain);
      const grew = !cachedAddr.addr;
      cachedAddr.time = Date.now();
      cachedAddr.addr = addr;
      cachedAddr.save();
      if (grew) {
        ipCacheGrew();
      }
    } else {
      const cachedAddr = ipCache[parsed.domain];
      if (cachedAddr) {
        fromCache = true;
        addr = cachedAddr.addr;
      }
    }
  }
  addr = reformatForNAT64(addr) || "(x)";

  // Domain flags
  const dflags =
      (parsed.ssl ? DFLAG_SSL : DFLAG_NOSSL) |
      (parsed.ws ? DFLAG_WEBSOCKET : 0);

  // Address flags
  const aflags =
      (requestInfo.prefetch ? AFLAG_PREFETCH : 0) |
      (details.tabId <= 0 ? AFLAG_WORKER : 0) |
      (fromCache ? AFLAG_CACHE : 0);

  if (requestInfo.domain) throw `Duplicate onResponseStarted: ${parsed.domain}`;
  requestInfo.domain = parsed.domain;
  requestInfo.save();
  const bytes = requestInfo.bytes || 0;
  const status = details.statusCode || requestInfo.statusCode || (fromCache ? 200 : 200);
  const latency = requestInfo.latencyMs || (requestInfo.startTime ? Math.max(1, Date.now() - requestInfo.startTime) : 0);
  for (const tabInfo of tabInfos) {
    tabInfo.addDomain(parsed.domain, dflags, addr, aflags, bytes, status, latency);
  }
}), FILTER_ALL_URLS);

const forgetRequest = wrap(async (details) => {
  await storageReady;
  const requestInfo = requestMap.remove(details.requestId);
  if (!requestInfo?.domain) {
    return;
  }
  for (const [tabId, tabBorn] of Object.entries(requestInfo.tabIdToBorn)) {
    const tabInfo = tabMap[tabId];
    if (tabInfo?.born == tabBorn) {
      tabInfo.domains[requestInfo.domain]?.countDown();
    }
  }
});
chrome.webRequest.onCompleted.addListener(forgetRequest, FILTER_ALL_URLS);

chrome.webRequest.onErrorOccurred.addListener(wrap(async (details) => {
  await storageReady;
  const requestInfo = requestMap.remove(details.requestId);
  if (!requestInfo?.domain) {
    return;
  }
  const errStatus = details.error ? details.error.replace("net::ERR_", "") : "ERR";
  const latency = requestInfo.startTime ? Math.max(1, Date.now() - requestInfo.startTime) : 0;
  for (const [tabId, tabBorn] of Object.entries(requestInfo.tabIdToBorn)) {
    const tabInfo = tabMap[tabId];
    if (tabInfo?.born == tabBorn) {
      const d = tabInfo.domains[requestInfo.domain];
      if (d) {
        d.statusCode = errStatus;
        d.latencyMs = latency;
        d.countDown();
        tabInfo.pushOne(requestInfo.domain);
      }
    }
  }
}), FILTER_ALL_URLS);

// -- contextMenus --

// When the user right-clicks a domain or IP address in the popup window,
// add a menu item that opens the requested lookup provider.
const MENU_ID = "ipvfoo-lookup";

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId != MENU_ID) return;
  const text = info.selectionText;
  const url = selectionToLookupUrl(text)?.href;
  if (url) {
    chrome.tabs.create({url});
  } else {
    // Malformed selection; shake the popup content.
    const tabId = /#(\d+)$/.exec(info.pageUrl);
    if (tabId) {
      popups.shake(Number(tabId[1]));
    }
  }
});

watchOptions(async (optionsChanged) => {
  await storageReady;
  optionsChanged = new Set(optionsChanged);
  for (const tabInfo of Object.values(tabMap)) {
    let refreshPageAction = optionsChanged.has(tabInfo.color);
    if (optionsChanged.has(NAT64_KEY)) {
      for (const [domain, di] of Object.entries(tabInfo.domains)) {
        const newAddr = reformatForNAT64(di.addr);
        if (di.addr != newAddr) {
          di.addr = newAddr;
          tabInfo.pushOne(domain);
          refreshPageAction = true;
        }
      }
    }
    if (refreshPageAction) {
      tabInfo.refreshPageAction();
    }
  }

  if (optionsChanged.has(LOOKUP_PROVIDER) ||
      optionsChanged.has(CUSTOM_PROVIDER_DOMAIN) ||
      optionsChanged.has(CUSTOM_PROVIDER_IP)) {
    chrome.contextMenus?.removeAll(() => {
      // Show something sensible, even when domain/ip use different providers.
      const title = lookupMenuTitle("example.com", "0.0.0.0");
      if (title) {
        chrome.contextMenus.create({
          title: title,
          id: MENU_ID,
          // Scope the menu to text selection in our popup windows.
          contexts: ["selection"],
          documentUrlPatterns: [chrome.runtime.getURL("popup.html")],
        });
      }
    });
  }
});
