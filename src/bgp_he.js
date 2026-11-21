/*
 * BGP.HE.NET MikroTik Prefix Extractor
 * Injected automatically on https://bgp.he.net/*
 */
"use strict";

(function () {
  const ipv4CidrRegex = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)(\/([0-9]|[1-2][0-9]|3[0-2]))$/;

  const TEMPLATES = {
    private: {
      name: "IP Private Local",
      countText: "Total: 15 Rules MikroTik address-list (ip-private-local)",
      title: "Template MikroTik: IP Private Local (Address List)",
      data: `/ip firewall address-list
add address=0.0.0.0/8 comment=ip-private-local list=ip-private-local
add address=10.0.0.0/8 comment=ip-private-local list=ip-private-local
add address=100.64.0.0/10 comment=ip-private-local list=ip-private-local
add address=127.0.0.0/8 comment=ip-private-local list=ip-private-local
add address=169.254.0.0/16 comment=ip-private-local list=ip-private-local
add address=172.16.0.0/12 comment=ip-private-local list=ip-private-local
add address=192.0.0.0/24 comment=ip-private-local list=ip-private-local
add address=192.0.2.0/24 comment=ip-private-local list=ip-private-local
add address=192.168.0.0/16 comment=ip-private-local list=ip-private-local
add address=198.18.0.0/15 comment=ip-private-local list=ip-private-local
add address=198.51.100.0/24 comment=ip-private-local list=ip-private-local
add address=203.0.113.0/24 comment=ip-private-local list=ip-private-local
add address=224.0.0.0/3 comment=ip-private-local list=ip-private-local
add address=255.255.255.255 comment=ip-private-local list=ip-private-local
add address=240.0.0.0/4 comment=ip-private-local list=ip-private-local
`
    },
    youtube: {
      name: "YouTube RAW Filter",
      countText: "Total: 3 Rules RAW prerouting (zzz-list-ip-google)",
      title: "Template MikroTik: YouTube Domain Content Filter (RAW)",
      data: `/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-google address-list-timeout=12h chain=prerouting content=.googlevideo.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-google address-list-timeout=12h chain=prerouting content=.youtube.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-google address-list-timeout=12h chain=prerouting content=.ytimg.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
`
    },
    tiktok: {
      name: "TikTok RAW Filter",
      countText: "Total: 3 Rules RAW prerouting (zzz-list-ip-tiktok)",
      title: "Template MikroTik: TikTok Domain Content Filter (RAW)",
      data: `/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-tiktok address-list-timeout=12h chain=prerouting content=.tiktokcdn.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-tiktok address-list-timeout=12h chain=prerouting content=.tiktokv.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-tiktok address-list-timeout=12h chain=prerouting content=.tiktok.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
`
    },
    winupdate: {
      name: "Windows Update RAW Filter",
      countText: "Total: 11 Rules RAW prerouting (zzz-list-ip-windows-update)",
      title: "Template MikroTik: Windows Update Content Filter (RAW)",
      data: `/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=windowsupdate.microsoft.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=.windowsupdate.microsoft.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=.update.microsoft.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=.windowsupdate.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=download.windowsupdate.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=.download.windowsupdate.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=download.microsoft.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=wustat.windows.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=ntservicepack.microsoft.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=go.microsoft.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
/ip firewall raw add action=add-dst-to-address-list address-list=zzz-list-ip-windows-update address-list-timeout=12h chain=prerouting content=dl.delivery.mp.microsoft.com dst-address-list=!ip-private-local src-address-list=ip-local disabled=yes
`
    }
  };

  let globalUniqueIPs = new Set();
  let currentAsNumber = "";
  let generatedData = {
    addressList: "",
    ipRoute: "",
    bgpFilter: "",
    bgpJuniper: "",
    bgpJuniperBlock: "",
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
        width: 98%;
        max-width: 1240px;
        margin: 10px auto;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        font-family: Consolas, monospace;
        font-size: 11.5px;
        box-sizing: border-box;
      }
      .bgp-header-btn-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 10px;
        vertical-align: middle;
      }
      .bgp-btn-open {
        background: #000066;
        color: #ffd700 !important;
        font-weight: bold;
        padding: 4px 10px;
        border-radius: 4px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        font-size: 11.5px;
        border: 1px solid #000044;
        white-space: nowrap;
        cursor: pointer;
        line-height: 1.2;
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
        white-space: pre-wrap;
        word-break: break-all;
        overflow-x: hidden;
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

    // Result container: BGP Prefix Extractor
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
        <button class="bgp-btn-action" id="bgp-cp-ip">CIDR</button>
        <button class="bgp-btn-action" id="bgp-cp-addr">Address List</button>
        <button class="bgp-btn-action" id="bgp-cp-route">Ip Route</button>
        <button class="bgp-btn-action" id="bgp-cp-filter">BGP LP MikroTik (v7)</button>
        <button class="bgp-btn-action" id="bgp-cp-juniper">BGP LP Juniper</button>
        <button class="bgp-btn-action" id="bgp-cp-juniper-block">BGP Block IP Juniper</button>
      </div>
      <textarea id="bgp-preview" class="bgp-preview-area" readonly placeholder="Hasil script akan muncul disini..."></textarea>
      <div id="bgp-total-count" style="margin-top:6px; font-weight:bold; color:#000066; font-size:11px;"></div>
    `;

    // Dedicated Container: Template List IP/Domain (Dibuat terpisah mandiri)
    const templateBox = document.createElement("div");
    templateBox.id = "bgp-he-template-box";
    templateBox.className = "bgp-tabresult";
    templateBox.style.display = "none";
    templateBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span id="bgp-template-title" style="font-weight:bold; color:#000066; font-size:12.5px;">Template MikroTik: List IP & Domain RAW</span>
        <button class="bgp-btn-action bgp-btn-close" id="bgp-template-close">✕ Tutup</button>
      </div>
      <div>
        <button class="bgp-btn-action" id="bgp-tpl-priv">IP Private Local</button>
        <button class="bgp-btn-action" id="bgp-tpl-youtube">YouTube RAW</button>
        <button class="bgp-btn-action" id="bgp-tpl-tiktok">TikTok RAW</button>
        <button class="bgp-btn-action" id="bgp-tpl-winupdate">Windows Update RAW</button>
      </div>
      <textarea id="bgp-template-preview" class="bgp-preview-area" readonly placeholder="Hasil script template akan muncul disini..."></textarea>
      <div id="bgp-template-count" style="margin-top:6px; font-weight:bold; color:#000066; font-size:11px;"></div>
    `;

    content.insertBefore(templateBox, content.firstChild);
    content.insertBefore(resultBox, content.firstChild);

    // Flex container di header agar kedua tombol berdampingan 1 baris
    const headerBtnWrap = document.createElement("div");
    headerBtnWrap.className = "bgp-header-btn-wrap";

    // Tombol 1: Ambil Prefix List IP
    const getScriptBtn = document.createElement("a");
    getScriptBtn.href = "#";
    getScriptBtn.id = "getscript";
    getScriptBtn.className = "bgp-btn-open";
    getScriptBtn.textContent = "Ambil Prefix List IP";
    headerBtnWrap.appendChild(getScriptBtn);

    // Tombol 2: Template List IP/Domain
    const templatePrivBtn = document.createElement("a");
    templatePrivBtn.href = "#";
    templatePrivBtn.id = "bgp-template-priv";
    templatePrivBtn.className = "bgp-btn-open";
    templatePrivBtn.textContent = "Template List IP/Domain";
    templatePrivBtn.title = "Lihat & Copy Template MikroTik IP & Domain (IP Private, YouTube, TikTok, Windows Update)";
    headerBtnWrap.appendChild(templatePrivBtn);

    headerSearch.appendChild(headerBtnWrap);

    let currentTemplateKey = "private";
    function applyTemplate(key, autoCopy = true) {
      currentTemplateKey = key;
      const tpl = TEMPLATES[key] || TEMPLATES.private;
      templateBox.style.display = "block";
      document.getElementById("bgp-template-title").textContent = tpl.title;
      document.getElementById("bgp-template-preview").value = tpl.data;
      document.getElementById("bgp-template-count").textContent = tpl.countText;
      if (autoCopy) {
        copyToClipboard(tpl.data, tpl.name, tpl.countText.split(":")[1]?.trim() || "");
      }
      templateBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    getScriptBtn.onclick = (e) => {
      e.preventDefault();
      templateBox.style.display = "none";
      extractPrefixes();
    };

    templatePrivBtn.onclick = (e) => {
      e.preventDefault();
      resultBox.style.display = "none";
      applyTemplate("private", false);
    };

    document.getElementById("bgp-close").onclick = () => {
      resultBox.style.display = "none";
    };

    document.getElementById("bgp-template-close").onclick = () => {
      templateBox.style.display = "none";
    };

    document.getElementById("bgp-tpl-priv").onclick = () => {
      applyTemplate("private", true);
    };

    document.getElementById("bgp-tpl-youtube").onclick = () => {
      applyTemplate("youtube", true);
    };

    document.getElementById("bgp-tpl-tiktok").onclick = () => {
      applyTemplate("tiktok", true);
    };

    document.getElementById("bgp-tpl-winupdate").onclick = () => {
      applyTemplate("winupdate", true);
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
      copyToClipboard(generatedData.bgpFilter, "BGP LP MikroTik (v7)");
      document.getElementById("bgp-preview").value = generatedData.bgpFilter;
    };

    document.getElementById("bgp-cp-juniper").onclick = () => {
      copyToClipboard(generatedData.bgpJuniper, "BGP LP Juniper", currentAsNumber);
      document.getElementById("bgp-preview").value = generatedData.bgpJuniper;
    };

    document.getElementById("bgp-cp-juniper-block").onclick = () => {
      copyToClipboard(generatedData.bgpJuniperBlock, "BGP Block IP Juniper", currentAsNumber);
      document.getElementById("bgp-preview").value = generatedData.bgpJuniperBlock;
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

    function copyToClipboard(text, label, info) {
      if (!text) {
        showToast("Data tidak tersedia");
        return;
      }
      const suffix = info ? ` (${info})` : (globalUniqueIPs.size > 0 ? ` (${globalUniqueIPs.size} IPv4)` : "");
      navigator.clipboard.writeText(text).then(() => {
        showToast(`✅ Berhasil copy ${label}${suffix}`);
      }).catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast(`✅ Berhasil copy ${label}${suffix}`);
      });
    }

    function extractPrefixes() {
      currentAsNumber = "";
      globalUniqueIPs.clear();

      let asNumber = "";
      let orgName = "";
      let listName = "";

      const pathParts = location.pathname.split("/").filter(Boolean);
      const firstPart = pathParts[0] || "";

          if (firstPart.toUpperCase().startsWith("AS")) {
            asNumber = firstPart.split("#")[0].toUpperCase();
            const h1 = document.querySelector("#header h1") || document.querySelector("h1");
            if (h1) {
              const text = (h1.innerText || h1.textContent || "").trim();
              orgName = text.replace(new RegExp("^" + asNumber, "i"), "").trim();
            }
            if (!orgName) {
              const headerLinks = document.querySelectorAll("#header a");
              if (headerLinks.length > 1) {
                const text = headerLinks[1].innerText || headerLinks[1].textContent || "";
                orgName = text.replace(new RegExp("^" + asNumber, "i"), "").trim();
              }
            }
            if (!orgName && document.title) {
              const titleMatch = document.title.split("-")[0].trim();
              orgName = titleMatch.replace(new RegExp("^" + asNumber, "i"), "").trim();
            }
          } else {
            const firstTdLink = document.querySelector("table tr td a");
            asNumber = firstTdLink ? firstTdLink.textContent.trim() : "AS";
            const h1 = document.querySelector("#header h1") || document.querySelector("h1");
            const match = h1 ? h1.textContent.match(/"([^"]+)"/) : null;
            orgName = match ? match[1] : (h1 ? h1.textContent.trim() : "Target");
          }

          currentAsNumber = asNumber;

          listName = orgName.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
          if (!listName) listName = asNumber || "BGP-List";

          const allLinks = document.querySelectorAll("table a");
          allLinks.forEach((a) => {
            const ip = a.textContent.trim();
            if (!ipv4CidrRegex.test(ip)) return;
            globalUniqueIPs.add(ip);
          });

            if (globalUniqueIPs.size === 0 && !asNumber) {
              alert("Tidak ada IPv4 Prefix (CIDR) atau AS Number ditemukan di halaman ini.");
              return;
            }

            const ipArr = Array.from(globalUniqueIPs);
            const asnDigits = asNumber.replace(/[^0-9]/g, "") || asNumber;
            // Otomatis trim spasi seluruh kata dan sanitasi agar jadi identifier Juniper yang valid
            const cleanOrgName = orgName.replace(/\s+/g, "").replace(/[^a-zA-Z0-9_-]/g, "") || (asnDigits ? `AS${asnDigits}` : "Target");

            // 1. IP Only (CIDR)
            let ipOnlyLines = [
              `# AS Info: ${asNumber} ${orgName}`,
              ``
            ];
            if (ipArr.length > 0) {
              ipOnlyLines.push(...ipArr);
              ipOnlyLines.push(``);
              ipOnlyLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
            } else {
              ipOnlyLines.push(`# Tidak ada IPv4 Prefix di tabel halaman ini.`);
              ipOnlyLines.push(``);
              ipOnlyLines.push(`# Total IPv4 Prefix: 0`);
            }
            ipOnlyLines.push(``);
            generatedData.ipOnly = ipOnlyLines.join("\n");

            // 2. Address List
            let addrListLines = [
              `# AS Info: ${asNumber} ${orgName}`,
              ``,
              `/ip firewall address-list`
            ];
            if (ipArr.length > 0) {
              ipArr.forEach((ip) => {
                addrListLines.push(`add list="z-ip-list-${listName}" address=${ip} comment="${asNumber} ${orgName}"`);
              });
              addrListLines.push(``);
              addrListLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
            } else {
              addrListLines.push(`# Tidak ada IPv4 Prefix di tabel halaman ini.`);
            }
            addrListLines.push(``);
            generatedData.addressList = addrListLines.join("\n");

            // 3. IP Route
            let ipRouteLines = [
              `# AS Info: ${asNumber} ${orgName}`,
              ``
            ];
            if (ipArr.length > 0) {
              ipArr.forEach((ip) => {
                ipRouteLines.push(`/ip route add dst-address=${ip} gateway=XXXXXXX comment="${asNumber} ${orgName}"`);
              });
              ipRouteLines.push(``);
              ipRouteLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
            } else {
              ipRouteLines.push(`# Tidak ada IPv4 Prefix di tabel halaman ini.`);
            }
            ipRouteLines.push(``);
            generatedData.ipRoute = ipRouteLines.join("\n");

            // 4. BGP Filter (RouterOS v7)
            let bgpFilterLines = [
              `# AS Info: ${asNumber} ${orgName}`,
              ``,
              `/routing filter rule`
            ];
            if (ipArr.length > 0) {
              ipArr.forEach((ip) => {
                bgpFilterLines.push(`/routing filter rule add chain=from_XXX disabled=no comment="${asNumber} ${orgName}" rule="if (dst == ${ip}) { set bgp-weight 300; accept }"`);
              });
              bgpFilterLines.push(``);
              bgpFilterLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
            } else {
              bgpFilterLines.push(`/routing filter rule add chain=from_XXX disabled=no comment="${asNumber} ${orgName}" rule="if (bgp-as-path \"${asnDigits}$\") { set bgp-local-pref 300; accept }"`);
            }
            bgpFilterLines.push(``);
            generatedData.bgpFilter = bgpFilterLines.join("\n");

            // 5. BGP Local-Preference (Juniper)
            const asPathName = `ALLOW-${cleanOrgName}`;
            let bgpJuniperLines = [
              `# AS Info: ${asNumber} ${orgName}`,
              ``,
              `#localpref`,
              `set policy-options as-path ${asPathName} ".* ${asnDigits}$"`,
              `set policy-options policy-statement from_XXXXXXX term ${asPathName} from as-path ${asPathName}`,
              `set policy-options policy-statement from_XXXXXXX term ${asPathName} then local-preference 300`,
              `set policy-options policy-statement from_XXXXXXX term ${asPathName} then accept`,
              `insert policy-options policy-statement from_XXXXXXX term ${asPathName} before term reject`,
              `commit`,
              ``,
              `#delete`,
              `delete policy-options policy-statement from_XXXXXXX term ${asPathName}`,
              `delete policy-options as-path ${asPathName} ".* ${asnDigits}$"`,
              ``,
              `# Total IPv4 Prefix: ${ipArr.length}`,
              ``
            ];
            generatedData.bgpJuniper = bgpJuniperLines.join("\n");

            // 6. BGP Block IP (Juniper)
            const rejectTermName = `reject-${cleanOrgName}`;
            let bgpBlockLines = [
              `# AS Info: ${asNumber} ${orgName}`,
              ``,
              `#block`
            ];
            if (ipArr.length > 0) {
              ipArr.forEach((ip) => {
                bgpBlockLines.push(`set policy-options policy-statement from_XXXXXXX term ${rejectTermName} from route-filter ${ip} exact`);
              });
            } else {
              bgpBlockLines.push(`set policy-options policy-statement from_XXXXXXX term ${rejectTermName} from route-filter 0.0.0.0/0 exact`);
            }
            bgpBlockLines.push(`set policy-options policy-statement from_XXXXXXX term ${rejectTermName} then reject`);
            bgpBlockLines.push(`insert policy-options policy-statement from_XXXXXXX term ${rejectTermName} before term accept`);
            bgpBlockLines.push(`commit`);
            bgpBlockLines.push(``);
            bgpBlockLines.push(`#delete`);
            bgpBlockLines.push(`delete policy-options policy-statement from_XXXXXXX term ${rejectTermName}`);
            bgpBlockLines.push(``);
            bgpBlockLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
            bgpBlockLines.push(``);
            generatedData.bgpJuniperBlock = bgpBlockLines.join("\n");

            // Display
            document.getElementById("bgp-info-title").textContent = `BGP Script: ${asNumber} (${orgName || cleanOrgName})`;
            const defaultPreview = ipArr.length > 0 ? generatedData.ipOnly : generatedData.bgpJuniper;
            document.getElementById("bgp-preview").value = defaultPreview;
            document.getElementById("bgp-total-count").textContent = ipArr.length > 0
              ? `Total Ditemukan: ${ipArr.length} IPv4 Prefix`
              : `AS Number: ${asNumber} (${orgName || cleanOrgName}) — Siap Copy BGP LP Juniper / MikroTik`;
            document.getElementById("bgp-he-prefix-helper").style.display = "block";
            showToast(ipArr.length > 0 ? `Ditemukan ${ipArr.length} IPv4 Prefix!` : `BGP Helper siap untuk ${asNumber}!`);
          }

          function transformCertLinks(root = document) {
            if (!root || !root.querySelectorAll) return;
            const links = root.querySelectorAll("a[href*='certs'], a[href*='_SearchTab'], a[href*='q=']");
            const domainRegex = /^(\*\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?$/;
            const ipRegex = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)(:\d+)?$/;

            links.forEach((link) => {
              const href = link.getAttribute("href") || "";
              let targetDomain = "";

              const qMatch = href.match(/[?&]q=([^&#]+)/i);
              if (qMatch && (href.includes("certs") || href.includes("_SearchTab") || href.includes("/dns/"))) {
                targetDomain = decodeURIComponent(qMatch[1]).trim();
              } else if (href.includes("/certs/") && !href.includes("?")) {
                const parts = href.split("/certs/");
                if (parts[1]) {
                  targetDomain = decodeURIComponent(parts[1].split(/[#?]/)[0]).trim();
                }
              }

              if (!targetDomain && (href.includes("certs") || href.includes("_SearchTab"))) {
                const text = link.textContent.trim();
                if (domainRegex.test(text) || ipRegex.test(text)) {
                  targetDomain = text;
                }
              }

              if (targetDomain) {
                targetDomain = targetDomain.replace(/^\*\./, "").replace(/^\/+|\/+$/g, "");
                if (domainRegex.test(targetDomain) || ipRegex.test(targetDomain)) {
                  link.href = `http://${targetDomain}/`;
                  link.target = "_blank";
                  link.rel = "noopener noreferrer";
                }
              }
            });
          }

          function setupLinkInterceptor() {
            const domainRegex = /^(\*\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?$/;
            const ipRegex = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)(:\d+)?$/;

            // Capture click in case of dynamically injected links or un-transformed clicks
            document.addEventListener(
              "click",
              (e) => {
                const link = e.target.closest("a");
                if (!link) return;
                const href = link.getAttribute("href") || "";
                const qMatch = href.match(/[?&]q=([^&#]+)/i);
                if (qMatch && (href.includes("certs") || href.includes("_SearchTab"))) {
                  let domain = decodeURIComponent(qMatch[1]).trim().replace(/^\*\./, "").replace(/^\/+|\/+$/g, "");
                  if (domainRegex.test(domain) || ipRegex.test(domain)) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(`http://${domain}/`, "_blank", "noopener,noreferrer");
                  }
                }
              },
              true
            );

            // Run initial transformation
            transformCertLinks(document);

            // Watch for dynamic DOM changes (e.g. AJAX tab switches on bgp.he.net)
            const observer = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                  mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      transformCertLinks(node);
                    }
                  });
                }
              }
            });

            observer.observe(document.body || document.documentElement, {
              childList: true,
              subtree: true
            });

            window.addEventListener("hashchange", () => {
              setTimeout(() => transformCertLinks(document), 100);
            });
          }

          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
              init();
              setupLinkInterceptor();
            });
          } else {
            init();
            setupLinkInterceptor();
          }
        }) ();

