/*
 * BGP.HE.NET MikroTik Prefix Extractor
 * Injected automatically on https://bgp.he.net/*
 */
"use strict";

(function () {
  const ipv4CidrRegex = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)(\/([0-9]|[1-2][0-9]|3[0-2]))$/;

  let globalUniqueIPs = new Set();
  let generatedData = {
    addressList: "",
    ipRoute: "",
    bgpFilter: "",
    ipOnly: ""
  };

  function init() {
    const headerSearch = document.getElementById("header_search") || document.querySelector("#header form") || document.getElementById("header");
    const content = document.getElementById("content") || document.body;

    if (!headerSearch || !content) return;
    if (document.getElementById("bgp-he-prefix-helper")) return;

    // Inject CSS
    const style = document.createElement("style");
    style.textContent = `
      .bgp-btn-action {
        background: #000066;
        color: #fff;
        border: 1px solid #000033;
        border-radius: 4px;
        padding: 4px 10px;
        margin-right: 6px;
        margin-bottom: 6px;
        font-size: 11.5px;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.15s;
      }
      .bgp-btn-action:hover {
        background: #003399;
      }
      .bgp-btn-close {
        background: #888;
        border-color: #666;
      }
      .bgp-btn-close:hover {
        background: #555;
      }
      .bgp-tabresult {
        background: #fdfdfd;
        border: 2px solid #000066;
        border-radius: 6px;
        padding: 14px;
        width: 95%;
        max-width: 820px;
        margin: 10px auto;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        font-family: Consolas, monospace;
        font-size: 11.5px;
        box-sizing: border-box;
      }
      .bgp-btn-open {
        background: #000066;
        color: #ffd700 !important;
        font-weight: bold;
        padding: 3px 8px;
        border-radius: 4px;
        text-decoration: none;
        margin-left: 10px;
        display: inline-block;
        font-size: 11.5px;
        border: 1px solid #000044;
      }
      .bgp-btn-open:hover {
        background: #003399;
        color: #fff !important;
      }
      .bgp-preview-area {
        width: 100%;
        height: 180px;
        margin-top: 10px;
        font-family: Consolas, monospace;
        font-size: 11px;
        background: #1e1e1e;
        color: #48ff00;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #444;
        box-sizing: border-box;
        white-space: pre;
        overflow-y: auto;
      }
      #bgp-toast {
        position: fixed;
        bottom: 25px;
        right: 25px;
        background: #000066;
        color: #ffd700;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        z-index: 999999;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.2s, transform 0.2s;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    // Toast element
    const toast = document.createElement("div");
    toast.id = "bgp-toast";
    document.body.appendChild(toast);

    // Result container
    const resultBox = document.createElement("div");
    resultBox.id = "bgp-he-prefix-helper";
    resultBox.className = "bgp-tabresult";
    resultBox.style.display = "none";
    resultBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span id="bgp-info-title" style="font-weight:bold; color:#000066; font-size:12.5px;">BGP Prefix MikroTik Tool</span>
        <button class="bgp-btn-action bgp-btn-close" id="bgp-close">✕ Tutup</button>
      </div>
      <div>
        <button class="bgp-btn-action" id="bgp-cp-ip">📋 Copy CIDR</button>
        <button class="bgp-btn-action" id="bgp-cp-addr">📋 Copy Address List</button>
        <button class="bgp-btn-action" id="bgp-cp-route">📋 Copy Ip Route</button>
        <button class="bgp-btn-action" id="bgp-cp-filter">📋 Copy BGP Route Filter (v7)</button>
      </div>
      <textarea id="bgp-preview" class="bgp-preview-area" readonly placeholder="Hasil script akan muncul disini..."></textarea>
      <div id="bgp-total-count" style="margin-top:6px; font-weight:bold; color:#000066; font-size:11px;"></div>
    `;

    content.insertBefore(resultBox, content.firstChild);

    // Button in header
    const getScriptBtn = document.createElement("a");
    getScriptBtn.href = "#";
    getScriptBtn.id = "getscript";
    getScriptBtn.className = "bgp-btn-open";
    getScriptBtn.textContent = "Ambil Prefix List IP";
    headerSearch.appendChild(getScriptBtn);

    getScriptBtn.onclick = (e) => {
      e.preventDefault();
      extractPrefixes();
    };

    document.getElementById("bgp-close").onclick = () => {
      resultBox.style.display = "none";
    };

    document.getElementById("bgp-cp-ip").onclick = () => {
      copyToClipboard(generatedData.ipOnly, "CIDR Only");
      document.getElementById("bgp-preview").value = generatedData.ipOnly;
    };

    document.getElementById("bgp-cp-addr").onclick = () => {
      copyToClipboard(generatedData.addressList, "Address List");
      document.getElementById("bgp-preview").value = generatedData.addressList;
    };

    document.getElementById("bgp-cp-route").onclick = () => {
      copyToClipboard(generatedData.ipRoute, "Ip Route");
      document.getElementById("bgp-preview").value = generatedData.ipRoute;
    };

    document.getElementById("bgp-cp-filter").onclick = () => {
      copyToClipboard(generatedData.bgpFilter, "BGP Route Filter (v7)");
      document.getElementById("bgp-preview").value = generatedData.bgpFilter;
    };
  }

  function showToast(msg) {
    const toast = document.getElementById("bgp-toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
    }, 2000);
  }

  function copyToClipboard(text, label) {
    if (!text) {
      showToast("Tidak ada prefix ditemukan");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast(`✅ Berhasil copy ${label} (${globalUniqueIPs.size} IPv4)`);
    }).catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast(`✅ Berhasil copy ${label} (${globalUniqueIPs.size} IPv4)`);
    });
  }

  function extractPrefixes() {
    globalUniqueIPs.clear();

    let asNumber = "";
    let orgName = "";
    let listName = "";

    const pathParts = location.pathname.split("/").filter(Boolean);
    const firstPart = pathParts[0] || "";

    if (firstPart.startsWith("AS")) {
      asNumber = firstPart.split("#")[0];
      const headerLinks = document.querySelectorAll("#header a");
      if (headerLinks.length > 1) {
        const text = headerLinks[1].innerText || "";
        orgName = text.replace(asNumber, "").trim();
      }
      if (!orgName) {
        const h1 = document.querySelector("#header h1") || document.querySelector("h1");
        orgName = h1 ? h1.innerText.replace(asNumber, "").trim() : asNumber;
      }
    } else {
      const firstTdLink = document.querySelector("table tr td a");
      asNumber = firstTdLink ? firstTdLink.textContent.trim() : "AS";
      const h1 = document.querySelector("#header h1") || document.querySelector("h1");
      const match = h1 ? h1.textContent.match(/"([^"]+)"/) : null;
      orgName = match ? match[1] : (h1 ? h1.textContent.trim() : "Target");
    }

    listName = orgName.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!listName) listName = asNumber || "BGP-List";

    const allLinks = document.querySelectorAll("table a");
    allLinks.forEach((a) => {
      const ip = a.textContent.trim();
      if (!ipv4CidrRegex.test(ip)) return;
      globalUniqueIPs.add(ip);
    });

    if (globalUniqueIPs.size === 0) {
      alert("Tidak ada IPv4 Prefix (CIDR) ditemukan di tabel halaman ini.");
      return;
    }

    const ipArr = Array.from(globalUniqueIPs);

    // 1. IP Only (CIDR)
    generatedData.ipOnly = ipArr.join("\n");

    // 2. Address List
    let addrListLines = [
      `# AS Info: ${asNumber} ${orgName}`,
      `/ip firewall address-list`
    ];
    ipArr.forEach((ip) => {
      addrListLines.push(`add list="ip-list-${listName}" address=${ip} comment="${asNumber} ${orgName}"`);
    });
    addrListLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
    generatedData.addressList = addrListLines.join("\n");

    // 3. IP Route
    let ipRouteLines = [
      `# AS Info: ${asNumber} ${orgName}`,
      `# IP Route`
    ];
    ipArr.forEach((ip) => {
      ipRouteLines.push(`/ip route add dst-address=${ip} gateway=VPN-XXX comment="${asNumber} ${orgName}"`);
    });
    ipRouteLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
    generatedData.ipRoute = ipRouteLines.join("\n");

    // 4. BGP Filter (RouterOS v7)
    let bgpFilterLines = [
      `# AS Info: ${asNumber} ${orgName}`,
      `/routing filter rule`
    ];
    ipArr.forEach((ip) => {
      bgpFilterLines.push(`/routing filter rule add chain=from_XXX disabled=no comment="${asNumber} ${orgName}" rule="if (dst == ${ip}) { set bgp-weight 300; accept }"`);
    });
    bgpFilterLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
    generatedData.bgpFilter = bgpFilterLines.join("\n");

    // Display (default to CIDR first)
    document.getElementById("bgp-info-title").textContent = `BGP Prefix: ${asNumber} (${orgName})`;
    document.getElementById("bgp-preview").value = generatedData.ipOnly;
    document.getElementById("bgp-total-count").textContent = `Total Ditemukan: ${ipArr.length} IPv4 Prefix`;
    document.getElementById("bgp-he-prefix-helper").style.display = "block";
    showToast(`Ditemukan ${ipArr.length} IPv4 Prefix!`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
