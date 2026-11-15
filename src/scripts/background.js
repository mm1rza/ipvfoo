/*jshint esversion: 9 */
/* global console,document,chrome */
"use strict";

// generic function to get data from content script
// called on tab event
// async function getPageInfo () {
//     let queryOptions = { active: true, currentWindow: true };
//     let tabs = await chrome.tabs.query(queryOptions);
//     chrome.tabs.sendMessage(tabs[0]?.id, { action: "pageInfo" }, function (response) {
//         console.log("BG getPageInfo callback", response);
//         if (response != undefined) {
//             chrome.action.setBadgeText({ text: String(response.warnings) });
//             chrome.action.setBadgeBackgroundColor({ color: response.warnings > 0 ? '#d30' : '#0a0' });
//             chrome.action.setBadgeTextColor({ color: response.warnings > 0 ? '#fff' : '#000' })
//         } else {
//             chrome.action.setBadgeBackgroundColor({ color: '#ddd' });
//             chrome.action.setBadgeTextColor({ color: '#000' })
//             chrome.action.setBadgeText({ text: "refr" });
//         }
//     });
// }

async function getPageInfo () {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab?.id) return;

    chrome.tabs.sendMessage(
        tab.id,
        { action: "pageInfo" },
        (response) => {
            console.log("BG getPageInfo callback", response);

            // badge logic (unchanged)
            if (response) {
                chrome.action.setBadgeText({ text: String(response.warnings) });
                chrome.action.setBadgeBackgroundColor({
                    color: response.warnings > 0 ? "#d30" : "#0a0"
                });
                chrome.action.setBadgeTextColor({
                    color: response.warnings > 0 ? "#fff" : "#000"
                });

                // 🔥 NEW: notify side panel + popup
                chrome.runtime.sendMessage({
                    type: "PAGE_INFO_UPDATED",
                    tabId: tab.id,
                    data: response || null
                });

            } else {
                chrome.action.setBadgeText({ text: "refr" });
                chrome.action.setBadgeBackgroundColor({ color: "#ddd" });
                chrome.action.setBadgeTextColor({ color: "#000" });
            }

            // // 🔥 NEW: notify side panel + popup
            // chrome.runtime.sendMessage({
            //     type: "PAGE_INFO_UPDATED",
            //     tabId: tab.id,
            //     data: response || null
            // });
        }
    );
}

let activeScans = {}; // key: tabUrl

async function testLink(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout
        
        let response;
        try {
            response = await fetch(url, { method: 'HEAD', signal: controller.signal });
            // Some servers return 405 Method Not Allowed for HEAD requests
            if (response.status === 405) {
                throw new Error("HEAD 405");
            }
        } catch (e) {
            // retry with GET
            const retryController = new AbortController();
            const retryTimeoutId = setTimeout(() => retryController.abort(), 6000);
            response = await fetch(url, { method: 'GET', signal: retryController.signal });
            clearTimeout(retryTimeoutId);
        }
        clearTimeout(timeoutId);
        
        return {
            url: url,
            status: response.status,
            ok: response.ok,
            statusText: response.statusText || (response.ok ? 'OK' : 'Error')
        };
    } catch (error) {
        return {
            url: url,
            status: 'Error/Timeout',
            ok: false,
            statusText: error.message || 'Network Error'
        };
    }
}

async function runBackgroundScan(tabUrl, targetLinks, filters) {
    const SCAN_DELAY_MS = 200;
    
    // Stop any existing scan for this tabUrl first
    if (activeScans[tabUrl]) {
        activeScans[tabUrl].aborted = true;
    }
    
    const scanState = {
        status: 'running',
        completed: 0,
        total: targetLinks.length,
        results: [],
        filters: filters,
        aborted: false
    };
    activeScans[tabUrl] = scanState;
    
    // Save initial state to local storage
    const storageKey = `scan_results_${tabUrl}`;
    await chrome.storage.local.set({ [storageKey]: {
        status: scanState.status,
        completed: scanState.completed,
        total: scanState.total,
        results: scanState.results,
        filters: scanState.filters
    }});
    
    for (let i = 0; i < targetLinks.length; i++) {
        if (scanState.aborted) {
            break;
        }
        
        const link = targetLinks[i];
        
        let result;
        if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
            result = await testLink(link.url);
        } else if (link.url.startsWith('blob:') || link.url.startsWith('data:')) {
            try {
                const res = await fetch(link.url);
                result = {
                    url: link.url,
                    status: res.status || '200',
                    ok: res.ok,
                    statusText: res.ok ? 'Valid Local Resource' : 'Failed to retrieve'
                };
            } catch (e) {
                result = {
                    url: link.url,
                    status: 'Failed',
                    ok: false,
                    statusText: e.message || 'Fetch Failed'
                };
            }
        } else if (link.url.startsWith('mailto:')) {
            const mail = link.url.substring(7);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = emailRegex.test(mail.split('?')[0]);
            result = {
                url: link.url,
                status: isValid ? 'Valid' : 'Invalid',
                ok: isValid,
                statusText: isValid ? 'Valid Email Address' : 'Invalid Email Format'
            };
        } else if (link.url.startsWith('tel:')) {
            const tel = link.url.substring(4);
            const telRegex = /^[+]?[0-9.\-\s()]{3,25}$/;
            const isValid = telRegex.test(tel.split('?')[0]);
            result = {
                url: link.url,
                status: isValid ? 'Valid' : 'Invalid',
                ok: isValid,
                statusText: isValid ? 'Valid Telephone Number' : 'Invalid Phone Format'
            };
        } else {
            result = {
                url: link.url,
                status: 'Skipped',
                ok: true,
                statusText: 'Non-fetchable URL'
            };
        }
        
        result.tag = link.tag;
        result.category = link.category;
        result.type = link.type;
        
        if (scanState.aborted) {
            break;
        }
        
        scanState.results.push(result);
        scanState.completed++;
        
        // Save current progress to local storage
        await chrome.storage.local.set({ [storageKey]: {
            status: scanState.status,
            completed: scanState.completed,
            total: scanState.total,
            results: scanState.results,
            filters: scanState.filters
        }});
        
        // Send progress message
        chrome.runtime.sendMessage({
            type: "SCAN_PROGRESS",
            tabUrl: tabUrl,
            completed: scanState.completed,
            total: scanState.total,
            result: result
        }).catch(() => {
            // Ignore error if popup is closed
        });
        
        if (i < targetLinks.length - 1 && SCAN_DELAY_MS > 0 && !scanState.aborted) {
            await new Promise(resolve => setTimeout(resolve, SCAN_DELAY_MS));
        }
    }
    
    if (scanState.aborted) {
        scanState.status = 'stopped';
    } else {
        scanState.status = 'completed';
    }
    
    // Save final status to local storage
    await chrome.storage.local.set({ [storageKey]: {
        status: scanState.status,
        completed: scanState.completed,
        total: scanState.total,
        results: scanState.results,
        filters: scanState.filters
    }});
    
    // Send status update message
    chrome.runtime.sendMessage({
        type: "SCAN_STATUS_CHANGE",
        tabUrl: tabUrl,
        status: scanState.status,
        completed: scanState.completed,
        total: scanState.total,
        results: scanState.results
    }).catch(() => {
        // Ignore error if popup is closed
    });
    
    delete activeScans[tabUrl];
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "REQUEST_PAGE_INFO") {
        getPageInfo();
    } else if (msg.type === "START_SCAN") {
        runBackgroundScan(msg.tabUrl, msg.targetLinks, msg.filters);
        sendResponse({ success: true });
    } else if (msg.type === "STOP_SCAN") {
        if (activeScans[msg.tabUrl]) {
            activeScans[msg.tabUrl].aborted = true;
        }
        sendResponse({ success: true });
    } else if (msg.type === "GET_SCAN_STATUS") {
        const scan = activeScans[msg.tabUrl];
        if (scan) {
            sendResponse({
                status: 'running',
                completed: scan.completed,
                total: scan.total,
                results: scan.results,
                filters: scan.filters
            });
        } else {
            sendResponse({ status: 'idle' });
        }
    }
    return true;
});

async function wasUpdated () {
    // const randomDays = (Math.random() * 3) + 0.25;
    const randomDays = (Math.random() * 3) - 0.25;
    const futureDate = Date.now() + randomDays * 24 * 60 * 60 * 1000;
    await chrome.storage.local.set({ futureDate });
    await chrome.storage.local.remove('messageDisplayed');
    checkAndDecrement();
}

async function checkAndDecrement () {
    const currentTime = Date.now();
    const { futureDate } = await chrome.storage.local.get(['futureDate']);
    if (currentTime >= futureDate) {
        const { messageDisplayed } = await chrome.storage.local.get('messageDisplayed');
        if (!messageDisplayed) {
            chrome.storage.sync.get(['hideupdate'], function (result) {
                if (!result.hideupdate) {
                    chrome.tabs.create({ url: "https://www.omiod.com/meta-seo-inspector/?utm_source=MSI_app&utm_medium=update#changelog", active: true });
                }
            });
            await chrome.storage.local.set({ messageDisplayed: true });
        }
    }
}

checkAndDecrement();

// tab events

// on tab activated
chrome.tabs.onActivated.addListener(
    function (activeInfo) {
        console.log("BG onActivated", activeInfo);
        getPageInfo();
    }
);

// on tab updated
chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        // console.log("BG onUpdated", changeInfo, changeInfo.status, tab.url);
        if (changeInfo.status == "complete") {
            getPageInfo();
        }
    }
);

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        // handle a first install
    } else if (details.reason == "update") {
        wasUpdated()
    }
});