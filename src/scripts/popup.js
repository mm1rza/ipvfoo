/*jshint esversion: 11 */
"use strict";

const isPopup = chrome.extension.getViews({ type: "popup" }).includes(window);
if (isPopup) {
    document.body.classList.add("popup");
} else {
    document.body.classList.add("sidepanel");

    // Hide openSidePanel button in side panel context
    // We execute this on DOMContentLoaded to ensure the element exists
    document.addEventListener('DOMContentLoaded', () => {
        const openSidePanelBtn = document.querySelector('[data-action="openSidePanel"]');
        if (openSidePanelBtn) {
            openSidePanelBtn.style.display = 'none';
        }
    });

    // Register tab/page info updates listener for side panel
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "PAGE_INFO_UPDATED") {
            console.log(">>>> Side panel update", msg.data);
            updateBadge();
        }
    });

    // Request initial page info from active tab
    (async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (tab?.id) {
            console.log(">>>> panel requisition for tab", tab.id);
            chrome.runtime.sendMessage({
                type: "REQUEST_PAGE_INFO"
            });
        }
    })();
}

const outDiv = document.getElementById('out');

let pageData;   // TODO remove ?

const toggableSections = [
    "toggle_anchors",
    "toggle_arelxfn",
    "toggle_cms",
    "toggle_common",
    "toggle_hreflang",
    "toggle_forms",
    "toggle_headers",
    "toggle_html",
    "toggle_html5",
    "toggle_images",
    "toggle_links",
    "toggle_markup",
    "toggle_media",
    "toggle_mobile",
    "toggle_opengraph",
    "toggle_pinterest",
    "toggle_presentation",
    "toggle_rhints",
    "toggle_externalr",
    "toggle_script",
    "toggle_social",
    "toggle_structureddata",
    "toggle_structureddata_jsonld",
    "toggle_structureddata_rdfa2",
    "toggle_structureddata_microdata",
    "toggle_structureddata_other",
    "toggle_svg",
    "toggle_twitter",
    "toggle_videos",
    "toggle_othermetadata",
    "toggle_verification",
    "toggle_security",
    "toggle_largeimages",
    "toggle_geo",
    "toggle_arev"
];

let menu = {};
let tips = {};

function activateUI (tabs) {
    console.log("@activateUI --------------", tabs);
    translator.do();

    // tips
    tippy('[data-bs-toggle="tooltip"]', {
        content: (reference) => {
            return reference.dataset.bsTitle;
        }
    });

    chrome.storage.sync.get(['menu', 'tips', 'activetab', 'debugmode', 'hideupdate'], function (result) {

        console.log("debugmode", result.debugmode)

        menu = result.menu; // set global
        tips = result.tips; // set global

        if (menu == undefined) {
            menu = {};
        }
        if (tips == undefined) {
            tips = {};
        }

        UI.collapsibles.handle();
        UI.tips.handle()

        const activeTab = result.activetab || "help";
        UI.tabs.select(activeTab)

        if (result.activetab == undefined) {
            chrome.storage.sync.set({ activetab: activeTab }, function () { });
        }

        document.getElementById("loading").classList.add("d-none")

        document.querySelector("[data-action=toggle_debug]").checked = result.debugmode
        document.querySelector("[data-action=toggle_update]").checked = result.hideupdate

        // intros in simple sections

        // intros = [
        //     "rec"
        // ];

        // for (section of intros) {
        //     var target = document.querySelector("[data-hasintro='" + section + "']");
        //     if (target) {
        //         var intro_text = chrome.i18n.getMessage("intro_" + section).replace(/\n/g, "<br>");
        //         target.insertAdjacentHTML(
        //             "beforebegin",
        //             "<p class='section_intro" + (menu["toggle_" + section + "_info"] != "hide" ? " visible" : "") + "'><img src='../images/info.png' data-infotoggle='" + section + "'><span>" + intro_text + "</span><em data-infotoggle='" + section + "'>" + chrome.i18n.getMessage("close") + "</em></p>"
        //         );
        //     }
        // }

        // enable toggles

        // var toggles = document.querySelectorAll("[data-infotoggle]");
        // for (var i = 0; i < toggles.length; i++) {
        //     toggles[i].onclick = function (e) {
        //         var container = e.target.parentNode;
        //         target = e.target.dataset.infotoggle;
        //         var st_target = "toggle_" + target + "_info";
        //         if (container.classList.contains('visible')) {
        //             container.classList.remove("visible");
        //             menu[st_target] = "hide";
        //             chrome.storage.sync.set({ "menu": menu }, function () { });
        //         } else {
        //             container.classList.add("visible");
        //             menu[st_target] = "show";
        //             chrome.storage.sync.set({ "menu": menu }, function () { });
        //         }
        //     };
        // }

    });

    // end toggles
    console.log("tabs", tabs);
    if (tabs != undefined) {
        tools(tabs[0].url);
    } else {
        console.log("undefined tabs")
    }
}

async function updateBadge () {
    console.log("@updateBadge")

    const queryOptions = { active: true, currentWindow: true };
    const tabs = await chrome.tabs.query(queryOptions);
    window.currentTabUrl = tabs[0].url;

    // evento a content page
    chrome.tabs.sendMessage(tabs[0].id, { action: "pageInfo", mode: "full" }, function (response) {
        console.log("popup getPageInfo callback", response);

        if (response != undefined) {
            console.log("response good", response);
            pageData = response;    // TODO remove ?

            document.getElementById('out').innerHTML = response.out;
            document.getElementById('outextra').innerHTML = response.outextra;

            chrome.action.setBadgeText({ text: String(response.warnings) });
            chrome.action.setBadgeBackgroundColor({ color: response.warnings > 0 ? '#d30' : '#0a0' });
            chrome.action.setBadgeTextColor({ color: response.warnings > 0 ? '#fff' : '#000' })

            chrome.tabs.sendMessage(tabs[0].id, { action: "getLinks" }, function (linkResponse) {
                if (linkResponse && linkResponse.links) {
                    window.pageLinks = linkResponse.links;
                } else {
                    window.pageLinks = [];
                }

                // Add event listeners for filter controls
                const chkNav = document.getElementById('chk-cat-navigation');
                const chkAssets = document.getElementById('chk-cat-assets');
                const chkSEO = document.getElementById('chk-cat-seo');
                const radScopes = document.querySelectorAll('input[name="rad-scope"]');

                if (chkNav) chkNav.addEventListener('change', updateLinkCounters);
                if (chkAssets) chkAssets.addEventListener('change', updateLinkCounters);
                if (chkSEO) chkSEO.addEventListener('change', updateLinkCounters);
                radScopes.forEach(rad => {
                    rad.addEventListener('change', updateLinkCounters);
                });

                // Attach export buttons listeners
                const btnCsv = document.getElementById('btn-export-csv');
                const btnJson = document.getElementById('btn-export-json');
                if (btnCsv) btnCsv.addEventListener('click', downloadCSV);
                if (btnJson) btnJson.addEventListener('click', downloadJSON);

                updateLinkCounters();
                restoreScanResults(window.currentTabUrl);
            });
            checkHostPermissions();
        } else {

            document.getElementById('out').innerHTML = "<div class='p-2'>Not available in Chrome special pages and local files, sorry.<br>If you have just installed the extension, please reload the page.</div>";
            document.getElementById('outextra').innerHTML = "<div class='p-2'>Not available in Chrome special pages and local files, sorry.<br>If you have just installed the extension, please reload the page.</div>";
            // document.getElementById('pills-tools').innerHTML = "Not available in Chrome special pages and local files, sorry.<br>If you have just installed the extension, please reload the page.";

            document.getElementById('broken-links-count').innerText = "0";
            window.pageLinks = [];
            checkHostPermissions();

            chrome.action.setBadgeBackgroundColor({ color: '#ddd' });
            chrome.action.setBadgeTextColor({ color: '#000' })
            chrome.action.setBadgeText({ text: "refr" });
        }

        document.getElementById("ext_version").innerText = chrome.runtime.getManifest().version;

        // UI click
        document.addEventListener('click', function (event) {
            var action = event.target.dataset.action;

            switch (action) {
                case "openSidePanel":
                    console.log("aside");

                    (async () => {
                        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                        console.log("aside tab", tabs);

                        await chrome.sidePanel.open({ tabId: tabs[0].id });
                        window.close(); // Close the popup
                    })();

                    break;

                case "copy":
                    event.preventDefault();
                    var copyContainer = event.target.closest(".values_list") || event.target.closest("tr");
                    var item2copy = copyContainer ? copyContainer.querySelector(".content") : null;
                    if (item2copy) copyItem(item2copy);
                    break;

                case "download":
                    let dlid = event.target.dataset.dlid;
                    var svg_container = document.getElementById(dlid);
                    if (svg_container) {
                        var svgData = svg_container.innerHTML;
                        console.log("dl", svgData);
                        downloadSVGasTextFile(svgData);
                    }
                    break;

                case "print":
                    chrome.storage.local.set({
                        page: tabs[0],
                        sections: response.sections,
                    }, function () {
                        chrome.tabs.create({ url: 'views/print.html' }, function (tab) { });
                    });
                    break;

                case "closeall":
                    UI.collapsibles.closeAll();
                    storeMenu();
                    break;

                case "openall":
                    UI.collapsibles.openAll();
                    storeMenu();
                    break;

                case "show_tip": {
                    let id = event.target.dataset.infotoggle;
                    document.getElementById(`tip_${id}`).classList.add("visible");
                    tips["tip_" + id] = "show";
                    storeTips();
                    break
                }

                case "hide_tip": {
                    let id = event.target.dataset.infotoggle;
                    document.getElementById(`tip_${id}`).classList.remove("visible");
                    tips["tip_" + id] = "hide";
                    storeTips();
                    break
                }

                case "set_tab":
                    let tabname = event.target.dataset.tabname;
                    storeTab(tabname)
                    break;

                case "start_scan":
                    event.preventDefault();
                    startBrokenLinksScan();
                    break;

                case "stop_scan":
                    event.preventDefault();
                    stopBrokenLinksScan();
                    break;

                case "toggle_update":
                    console.log("event.target checked", event.target?.checked)
                    storeUpdate(event.target?.checked);
                    break;

                case "toggle_debug":
                    console.log("event.target checked", event.target?.checked)
                    chrome.storage.sync.set({ debugmode: event.target?.checked }, function () {
                        console.log('Value set');
                    });
                    break;

                case "show_element":
                    let id = event.target.dataset.id;
                    console.log("show", id)
                    chrome.tabs.sendMessage(tabs[0].id, { action: "showElement", value: id }, function (response) { });
                    break;

                default:
                    console.warn("clic - unknown action", action);

            }

        }, false);

        activateUI(tabs)

    });
}

function tools (url) {

    console.log("@tools", url);

    if (url) {
        url = url.replace("https://", "");
        url = url.replace("http://", "");
        url = url.split("?")[0];
        var domain = url.split("/")[0];
        var simpledomain = domain.replace(/^www\./, "");

        var parts = domain.split(".");
        if (parts.length > 2) parts = parts.slice(1);

        var sdomain = parts.join(".");

        html("linksinfo", "<b>The following links will analyze this URL: " + domain + "</b><br><br><span style='color:#ddd'>" + chrome.i18n.getMessage("external_url_tip") + "</span><br><br>");

        var ref = "?referer=http://goo.gl/ffGBYq";
        var refadd = "&referer=http://goo.gl/ffGBYq";

        // SEO
        var out = "";

        // Safety
        out = "";
        out += favlnk("http://www.google.com/safebrowsing/diagnostic?site=" + domain + refadd, "Google Safe Browsing"); // safety - ok2019
        out += favlnk("http://www.mywot.com/en/scorecard/" + domain + ref, "WOT"); // safety rating - ok2019
        out += favlnk("http://safeweb.norton.com/report/show?url=" + domain + refadd, "Norton Safe Web"); // safety rating - ok2019
        out += favlnk("https://cside.dev/domains/" + simpledomain, "c/side - 3rd party scripts"); // 3rd party scripts cehcker - new2025
        html("links2", out);

        out = "";
        out += favlnk("http://www.semrush.com/info/" + domain + ref, "SEMRush (login required)"); // keyword
        out += favlnk("http://www.wmtips.com/tools/info/?url=" + domain + refadd, "WMTIPS"); // traffic info - ok2019
        html("links1", out);

        // Social
        out = "";
        out += favlnk("https://validator.schema.org/#url=" + url, "Schema Markup Validator"); // checked - ok2022
        out += favlnk("https://search.google.com/test/rich-results?url=" + url, "Google Structured Data Testing Tool"); // checked - ok2021
        html("links4", out);

        // Other
        out = "";
        out += favlnk("http://whois.domaintools.com/" + domain + ref, "DomainTools"); // info
        out += favlnk("http://images.google.com/images?q=site:" + sdomain + refadd, "Google Images");
        out += favlnk("http://www.intodns.com/" + sdomain + ref, "intoDNS");
        out += favlnk("http://web.archive.org/web/*/" + url, "WaybackMachine");
        out += favlnk("https://archive.ph/" + url, "archive.today");
        html("links3", out);

    } else {
        html("links1", "<div class='ad_seo_item'>n.a</div>");
        html("links2", "<div class='ad_seo_item'>n.a</div>");
        html("links3", "<div class='ad_seo_item'>n.a</div>");
        html("links4", "<div class='ad_seo_item'>n.a</div>");

    }
}

updateBadge();

translator.do();
