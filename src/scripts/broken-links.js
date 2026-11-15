/*jshint esversion: 11 */
"use strict";

function checkHostPermissions (callback) {
    chrome.permissions.contains({
        origins: ["http://*/*", "https://*/*"]
    }, function (result) {
        const notice = document.getElementById('permission-notice');
        if (result) {
            if (notice) notice.classList.add('d-none');
        } else {
            if (notice) notice.classList.remove('d-none');
        }
        if (callback) callback(result);
    });
}

async function testLink (url) {
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

const SCAN_DELAY_MS = 200;

function updateLinkCounters () {
    const links = window.pageLinks || [];

    // Count per category (all links of that category)
    const countNavigation = links.filter(l => l.category === 'navigation').length;
    const countAssets = links.filter(l => l.category === 'assets').length;
    const countSEO = links.filter(l => l.category === 'seo').length;

    const navBadge = document.getElementById('cnt-cat-navigation');
    const assetsBadge = document.getElementById('cnt-cat-assets');
    const seoBadge = document.getElementById('cnt-cat-seo');

    if (navBadge) navBadge.innerText = countNavigation;
    if (assetsBadge) assetsBadge.innerText = countAssets;
    if (seoBadge) seoBadge.innerText = countSEO;

    // Get checked categories
    const isNavChecked = document.getElementById('chk-cat-navigation')?.checked ?? true;
    const isAssetsChecked = document.getElementById('chk-cat-assets')?.checked ?? true;
    const isSEOChecked = document.getElementById('chk-cat-seo')?.checked ?? true;

    // Filter links by active categories
    const activeLinks = links.filter(l => {
        if (l.category === 'navigation') return isNavChecked;
        if (l.category === 'assets') return isAssetsChecked;
        if (l.category === 'seo') return isSEOChecked;
        return false;
    });

    // Count scopes of active categories
    const scopeAll = activeLinks.length;
    const scopeInternal = activeLinks.filter(l => l.type === 'internal').length;
    const scopeExternal = activeLinks.filter(l => l.type === 'external').length;

    const allBadge = document.getElementById('cnt-scope-all');
    const internalBadge = document.getElementById('cnt-scope-internal');
    const externalBadge = document.getElementById('cnt-scope-external');

    if (allBadge) allBadge.innerText = scopeAll;
    if (internalBadge) internalBadge.innerText = scopeInternal;
    if (externalBadge) externalBadge.innerText = scopeExternal;

    // Get active scope
    const scopeRadio = document.querySelector('input[name="rad-scope"]:checked');
    const selectedScope = scopeRadio ? scopeRadio.value : 'all';

    let finalCount = 0;
    if (selectedScope === 'all') {
        finalCount = scopeAll;
    } else if (selectedScope === 'internal') {
        finalCount = scopeInternal;
    } else if (selectedScope === 'external') {
        finalCount = scopeExternal;
    }

    const counter = document.getElementById('broken-links-count');
    if (counter) counter.innerText = finalCount;

    return activeLinks.filter(l => {
        if (selectedScope === 'all') return true;
        return l.type === selectedScope;
    });
}

function downloadCSV () {
    if (!window.scanResults || window.scanResults.length === 0) return;

    let csv = 'URL,Category,Tag,Type,Status,Result\n';
    window.scanResults.forEach(r => {
        const row = [
            r.url,
            r.category,
            r.tag,
            r.type,
            r.status,
            r.statusText
        ].map(val => '"' + String(val).replace(/"/g, '""') + '"').join(',');
        csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'broken_links_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadJSON () {
    if (!window.scanResults || window.scanResults.length === 0) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.scanResults, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "broken_links_report.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function appendResultToTable (result) {
    const brokenResultsBody = document.getElementById('broken-links-results-body');
    const workingResultsBody = document.getElementById('working-links-results-body');
    const brokenCountSpan = document.getElementById('broken-links-results-count');
    const workingCountSpan = document.getElementById('working-links-results-count');

    const targetBody = result.ok ? workingResultsBody : brokenResultsBody;
    const targetCountSpan = result.ok ? workingCountSpan : brokenCountSpan;

    if (targetBody) {
        const row = document.createElement('tr');

        const urlTd = document.createElement('td');
        urlTd.className = 'text-break';
        const a = document.createElement('a');
        a.href = result.url;
        a.target = '_blank';
        a.innerText = result.url;
        urlTd.appendChild(a);

        const typeTd = document.createElement('td');
        const linkType = result.type || 'unknown';
        const isInternal = linkType === 'internal';
        typeTd.innerHTML = `<span class="badge ${isInternal ? 'bg-info text-dark' : 'bg-warning text-dark'} text-capitalize">${linkType}</span>`;

        const catTd = document.createElement('td');
        catTd.innerHTML = `<span class="badge bg-secondary text-capitalize">${result.category}</span> <small class="text-muted">${result.tag}</small>`;

        const statusTd = document.createElement('td');
        statusTd.style.textAlign = 'center';
        const badge = document.createElement('span');
        badge.className = `badge ${result.ok ? 'bg-success' : 'bg-danger'}`;
        badge.innerText = result.status;
        statusTd.appendChild(badge);

        const resultTd = document.createElement('td');
        resultTd.innerText = result.statusText;
        resultTd.className = result.ok ? 'text-success' : 'text-danger font-monospace';

        row.appendChild(urlTd);
        row.appendChild(typeTd);
        row.appendChild(catTd);
        row.appendChild(statusTd);
        row.appendChild(resultTd);
        targetBody.appendChild(row);

        // Update count label
        if (targetCountSpan) {
            const currentVal = parseInt(targetCountSpan.innerText, 10) || 0;
            targetCountSpan.innerText = String(currentVal + 1);
        }

        const tableResp = targetBody.closest('.table-responsive');
        if (tableResp) tableResp.scrollTop = tableResp.scrollHeight;
    }
}

function showScanSummary (aborted = false) {
    const summaryDiv = document.getElementById('broken-links-summary');
    const brokenCount = window.scanResults.filter(r => !r.ok).length;
    const workingCount = window.scanResults.length - brokenCount;

    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <div class="alert ${brokenCount > 0 ? 'alert-danger' : 'alert-success'} d-flex justify-content-between align-items-center mb-0" role="alert">
                <div>
                    <h5 class="alert-heading mb-1 fw-bold">${aborted ? 'Scan Interrupted' : 'Scan Results Summary'}</h5>
                    <p class="mb-0">Links checked: <strong>${window.scanResults.length}</strong> | Working: <strong class="text-success">${workingCount}</strong> | Broken: <strong class="text-danger">${brokenCount}</strong></p>
                </div>
            </div>
        `;
        summaryDiv.classList.remove('d-none');
    }
}

function restoreScanResults (tabUrl) {
    if (!tabUrl) return;

    chrome.runtime.sendMessage({ type: "GET_SCAN_STATUS", tabUrl: tabUrl }, function (response) {
        const isRunning = response && response.status === 'running';

        if (isRunning) {
            // Restore from active background scan state
            window.scanResults = response.results || [];

            // Restore checkbox/radio state if saved
            if (response.filters) {
                restoreFilterUI(response.filters);
            }

            updateLinkCounters();
            setupRunningUI(response.completed, response.total);

            // Populate results tables
            clearResultTables();
            window.scanResults.forEach(res => appendResultToTable(res));

        } else {
            // Restore from local storage (past completed/stopped scan)
            const key = `scan_results_${tabUrl}`;
            chrome.storage.local.get([key], function (result) {
                if (result && result[key]) {
                    const data = result[key];
                    window.scanResults = data.results || [];

                    if (data.filters) {
                        restoreFilterUI(data.filters);
                    }

                    updateLinkCounters();

                    // Populate results tables
                    clearResultTables();
                    window.scanResults.forEach(res => appendResultToTable(res));

                    const isStopped = data.status === 'stopped';
                    showScanSummary(isStopped);

                    const exportContainer = document.getElementById('export-container');
                    if (exportContainer && window.scanResults.length > 0) {
                        exportContainer.classList.remove('d-none');
                    }
                }
            });
        }
    });
}

function restoreFilterUI (filters) {
    const chkNav = document.getElementById('chk-cat-navigation');
    const chkAssets = document.getElementById('chk-cat-assets');
    const chkSEO = document.getElementById('chk-cat-seo');
    if (chkNav && filters.nav !== undefined) chkNav.checked = filters.nav;
    if (chkAssets && filters.assets !== undefined) chkAssets.checked = filters.assets;
    if (chkSEO && filters.seo !== undefined) chkSEO.checked = filters.seo;

    const rad = document.getElementById(`rad-scope-${filters.scope}`);
    if (rad) rad.checked = true;
}

/*******************************************************************************
 * Helper to Clear Result Tables
 ******************************************************************************/
function clearResultTables () {
    const brokenResultsBody = document.getElementById('broken-links-results-body');
    const workingResultsBody = document.getElementById('working-links-results-body');
    const brokenCountSpan = document.getElementById('broken-links-results-count');
    const workingCountSpan = document.getElementById('working-links-results-count');
    const resultsContainer = document.getElementById('broken-links-results-container');

    if (brokenResultsBody) brokenResultsBody.innerHTML = '';
    if (workingResultsBody) workingResultsBody.innerHTML = '';
    if (brokenCountSpan) brokenCountSpan.innerText = '0';
    if (workingCountSpan) workingCountSpan.innerText = '0';
    if (resultsContainer) resultsContainer.classList.remove('d-none');
}

/*******************************************************************************
 * Helper to Setup Running UI State
 ******************************************************************************/
function setupRunningUI (completed, total) {
    const btn = document.getElementById('btn-start-scan');
    const stopBtn = document.getElementById('btn-stop-scan');
    const progressContainer = document.getElementById('scan-progress-container');
    const progressBar = document.getElementById('scan-progress-bar');
    const statusDiv = document.getElementById('scan-status');
    const summaryDiv = document.getElementById('broken-links-summary');
    const exportContainer = document.getElementById('export-container');

    if (btn) btn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (progressContainer) progressContainer.classList.remove('d-none');
    if (summaryDiv) summaryDiv.classList.add('d-none');
    if (exportContainer) exportContainer.classList.add('d-none');

    if (progressBar) {
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        progressBar.style.width = `${pct}%`;
        progressBar.innerText = `${pct}%`;
    }
    if (statusDiv) statusDiv.innerText = `Scanning: checking link ${completed} of ${total}...`;
}

function startBrokenLinksScan () {
    const targetLinks = updateLinkCounters();
    if (targetLinks.length === 0) {
        alert("No links matched the selected criteria to scan.");
        return;
    }

    chrome.permissions.request({
        origins: ["http://*/*", "https://*/*"]
    }, function (granted) {
        checkHostPermissions();
        if (!granted) {
            alert("Permissions are required to check external links.");
            return;
        }

        const chkNav = document.getElementById('chk-cat-navigation');
        const chkAssets = document.getElementById('chk-cat-assets');
        const chkSEO = document.getElementById('chk-cat-seo');
        const scopeRadio = document.querySelector('input[name="rad-scope"]:checked');

        const filters = {
            nav: chkNav ? chkNav.checked : true,
            assets: chkAssets ? chkAssets.checked : true,
            seo: chkSEO ? chkSEO.checked : true,
            scope: scopeRadio ? scopeRadio.value : 'all'
        };

        window.scanResults = [];
        clearResultTables();
        setupRunningUI(0, targetLinks.length);

        chrome.runtime.sendMessage({
            type: "START_SCAN",
            tabUrl: window.currentTabUrl,
            targetLinks: targetLinks,
            filters: filters
        });
    });
}

function stopBrokenLinksScan () {
    const stopBtn = document.getElementById('btn-stop-scan');
    if (stopBtn) stopBtn.disabled = true;

    chrome.runtime.sendMessage({
        type: "STOP_SCAN",
        tabUrl: window.currentTabUrl
    });
}

// Listener for background scan progress & status changes
chrome.runtime.onMessage.addListener((msg) => {
    if (!window.currentTabUrl || msg.tabUrl !== window.currentTabUrl) return;

    if (msg.type === "SCAN_PROGRESS") {
        window.scanResults.push(msg.result);
        appendResultToTable(msg.result);

        const progressBar = document.getElementById('scan-progress-bar');
        const statusDiv = document.getElementById('scan-status');
        if (progressBar) {
            const pct = Math.round((msg.completed / msg.total) * 100);
            progressBar.style.width = `${pct}%`;
            progressBar.innerText = `${pct}%`;
        }
        if (statusDiv) {
            statusDiv.innerText = `Scanning: checking link ${msg.completed} of ${msg.total}...`;
        }
    } else if (msg.type === "SCAN_STATUS_CHANGE") {
        window.scanResults = msg.results || [];

        const btn = document.getElementById('btn-start-scan');
        const stopBtn = document.getElementById('btn-stop-scan');
        const progressContainer = document.getElementById('scan-progress-container');
        const statusDiv = document.getElementById('scan-status');
        const exportContainer = document.getElementById('export-container');

        if (btn) btn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (progressContainer) progressContainer.classList.add('d-none');

        if (statusDiv) {
            if (msg.status === 'stopped') {
                statusDiv.innerText = 'Scan stopped by user.';
            } else {
                statusDiv.innerText = 'Scan complete!';
            }
        }

        showScanSummary(msg.status === 'stopped');

        if (exportContainer && window.scanResults.length > 0) {
            exportContainer.classList.remove('d-none');
        }
    }
});
