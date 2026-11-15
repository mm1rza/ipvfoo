/*
 * BGP.HE.NET MikroTik Prefix Extractor
 * Injected automatically on https://bgp.he.net/*
 */
"use strict";

(function () {
  const ipv4CidrRegex = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)(\/([0-9]|[1-2][0-9]|3[0-2]))$/;

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
        <button class="bgp-btn-action" id="bgp-cp-filter">📋 Copy BGP LP MikroTik (v7)</button>
        <button class="bgp-btn-action" id="bgp-cp-juniper">📋 Copy BGP LP Juniper</button>
        <button class="bgp-btn-action" id="bgp-cp-juniper-block">📋 Copy BGP Block IP Juniper</button>
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
            generatedData.ipOnly = ipArr.length > 0 ? ipArr.join("\n") : "# Tidak ada IPv4 Prefix di tabel halaman ini.";

            // 2. Address List
            let addrListLines = [
              `# AS Info: ${asNumber} ${orgName}`,
              `/ip firewall address-list`
            ];
            if (ipArr.length > 0) {
              ipArr.forEach((ip) => {
                addrListLines.push(`add list="z-ip-list-${listName}" address=${ip} comment="${asNumber} ${orgName}"`);
              });
              addrListLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
            } else {
              addrListLines.push(`# Tidak ada IPv4 Prefix di tabel halaman ini.`);
            }
            generatedData.addressList = addrListLines.join("\n");

            // 3. IP Route
            let ipRouteLines = [
              `# AS Info: ${asNumber} ${orgName}`,
            ];
            if (ipArr.length > 0) {
              ipArr.forEach((ip) => {
                ipRouteLines.push(`/ip route add dst-address=${ip} gateway=XXXXXXX comment="${asNumber} ${orgName}"`);
              });
              ipRouteLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
            } else {
              ipRouteLines.push(`# Tidak ada IPv4 Prefix di tabel halaman ini.`);
            }
            generatedData.ipRoute = ipRouteLines.join("\n");

            // 4. BGP Filter (RouterOS v7)
            let bgpFilterLines = [
              `# AS Info: ${asNumber} ${orgName}`,
              `/routing filter rule`
            ];
            if (ipArr.length > 0) {
              ipArr.forEach((ip) => {
                bgpFilterLines.push(`/routing filter rule add chain=from_XXX disabled=no comment="${asNumber} ${orgName}" rule="if (dst == ${ip}) { set bgp-weight 300; accept }"`);
              });
              bgpFilterLines.push(`# Total IPv4 Prefix: ${ipArr.length}`);
            } else {
              bgpFilterLines.push(`/routing filter rule add chain=from_XXX disabled=no comment="${asNumber} ${orgName}" rule="if (bgp-as-path \"${asnDigits}$\") { set bgp-local-pref 300; accept }"`);
            }
            generatedData.bgpFilter = bgpFilterLines.join("\n");

            // 5. BGP Local-Preference (Juniper)
            const asPathName = `ALLOW-${cleanOrgName}`;
            let bgpJuniperLines = [
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
              `delete policy-options as-path ${asPathName} ".* ${asnDigits}$"`
            ];
            generatedData.bgpJuniper = bgpJuniperLines.join("\n");

            // 6. BGP Block IP (Juniper)
            const rejectTermName = `reject-${cleanOrgName}`;
            let bgpBlockLines = [
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

