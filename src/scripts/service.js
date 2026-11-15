/*jshint esversion: 9 */
/* global console, window, document, chrome, warnings, sections */
"use strict";

/* DO NOT COPY TO V3 */

var $ = document.querySelector.bind(document); // single
var $$ = document.querySelectorAll.bind(document); // array
var fromId = document.getElementById.bind(document); // single
var fromClass = document.getElementsByClassName.bind(document); // array
var fromTag = document.getElementsByTagName.bind(document); // array

String.prototype.bool = function () {
    return (/^true$/i).test(this);
};

function html (id, text) {
    fromId(id).innerHTML = text;
}

function favlnk (url, txt) {
    return "<div class='ad_seo_item'><img src='http://www.google.com/s2/favicons?domain=" + url + "' class='inlineFavicon'> <a href='" + url + "' class='cont_link' target='_blank'><span>" + txt + "</span></a></div>";
}

function injectCSS (file) { /* obsolete */
    var link = document.createElement("link");
    link.href = chrome.extension.getURL(file);
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);

}

function show_element (name, value, count, warning, info, tip, link, do_copy = false) {
    var tmp = `<div class='ad_seo_item values_list'><span class='attr_name'>${name}</span> <span class="content cc5">${escapeHtml(value)}</span>`;
    if (do_copy) tmp += "<button class='ccopy focus-ripple' data-action='copy' data-bs-toggle='tooltip' data-bs-title='copy to clipboard' data-tippy-delay='[500,0]'></button>";
    if (count) tmp += " <span class='item_count'>(" + count + ")</span>";
    if (warning) tmp += show_inline_warning(warning);
    if (info) tmp += show_inline_info(info);
    if (tip || link) {
        if (link) {
            tmp += `<a class='tip' data-bs-toggle="tooltip" data-bs-title="${tip}" href='${link[1]}' >${link[0]}</a>`;
        } else {
            tmp += show_tip(tip);
        }
    }

    tmp += "</div>";
    return tmp;
}

function wrap (text, cssclass, do_copy = false) {
    if (!cssclass) cssclass = "";
    // return "<div class='ad_seo_item values_list " + cssclass + "'>" + text + (do_copy ? "<button class='ccopy focus-ripple rip' data-action='copy' data-bs-toggle='tooltip' data-bs-title='copy to clipboard' data-tippy-delay='[500,0]'></button>" : "") + "</div>";
    return "<div class='ad_seo_item values_list " + cssclass + "'>" + text + "</div>";
}

function show_item (name, cnt, warning) {
    return "<span class='item'>" + name + "</span> <span class='item_count" + (warning != false ? " warning" : "") + "'>(" + cnt + ")</span> ";
}

function show_tip (txt) {
    return `<span class="tip" data-bs-toggle="tooltip" data-bs-title="${txt}">TIP</span>`;
}

function show_info (txt, tip = "", link = "", section = "") {
    var out = "<div class='ad_seo_item values_list'><div class='ad_seo_item_inner'><div class='info'><span>{{info}}</span> " + txt + "</div></div>";
    if (tip || link) {
        if (link) {
            out += `<a class='tip' data-bs-toggle='tooltip' data-bs-title="${tip}" href='${link[1]}' >${link[0]}</a>`;
        } else {
            out += `<span class='tip' data-bs-toggle='tooltip' data-bs-title="${tip}">TIP</span>`;
        }
    }
    out += "</div>";

    // console.log("-----------------------------", txt);
    if (section) {
        // console.log("===========================");
        sections[section].info_list.push(out);
    }

    return out;
}

function show_warning (txt, tip = "", link = "", section = "") {
    warnings++;
    var out = "<div class='ad_seo_item values_list'><div class='ad_seo_item_inner'><div class='warning'><span>{{warning}}</span> " + txt + "</div></div>";
    if (tip || link) {
        if (link) {
            out += `<a class='tip' data-bs-toggle='tooltip' data-bs-title="${tip}" href='${link[1]}' >${link[0]}</a>`;
        } else {
            out += `<span class='tip' data-bs-toggle='tooltip' data-bs-title="${tip}">TIP</span>`;
        }
    }
    out += "</div>";

    // console.log("-----------------------------", txt);
    if (section) {
        // console.log("===========================");
        sections[section].warnings_list.push(out);  // + "xxx"
        sections[section].warnings++
    }

    return out;
}

function escapeHtml (txt) {
    if (txt) {
        return txt
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    } else {
        return txt;
    }
}

function show_inline_warning (txt, tip = "", section = "") {
    // TODO use tip
    warnings++;
    let out = "<span class='warning'><span>{{warning}}</span> " + txt + "</span>";

    console.log("-----------------------------", txt);
    if (section) {
        console.log("===========================");
        sections[section].warnings_list.push(out);
    }

    return out
}

function show_inline_info (txt, tip = "", link = "", section = "") {
    var out = ` <span class='info'><span>{{info}}</span>${txt}</span>`;
    if (tip || link) {
        if (link) {
            out += `<a class='tip' data-bs-toggle='tooltip' data-bs-title="${tip}" href='${link[1]}' >${link[0]}</a>`;
        } else {
            out += `<span class='tip' data-bs-toggle='tooltip' data-bs-title="${tip}">TIP</span>`;
        }
    }

    // console.log("-----------------------------", txt);
    if (section) {
        // console.log("===========================");
        sections[section].info_list.push(out);
    }

    return out;
}

function url2domain (url) {
    // console.log("url2domain",url);
    if (url) {
        var u;
        if (url.baseVal != null) return url.baseVal; // is SVGAnimatedString
        try {
            u = new URL(url);
            u.url = (u.hostname == "" ? u.origin : u.hostname);
        } catch (e) {
            u = url;
        }
        return u;
    } else {
        return null;
    }
}

// JSON-LD

function traverse (x, l) {
    if (l == undefined) {
        l = 1;
        traverse_out = [];
        traverse_html = "";
        traverse_minlevel = null;
    }
    if (isArr(x)) {
        traverseArray(x, l + 1);
    } else if ((typeof x === 'object') && (x !== null)) {
        traverseObject(x, l + 1);
    }
    return [traverse_out, traverse_html]; // only needed for main call
}

function traverseArray (arr, l) {
    arr.forEach(function (x) {
        traverse(x, l);
    });
}

function traverseObject (obj, l) {
    if (obj["@type"]) {
        if (traverse_minlevel == null) traverse_minlevel = l;
        // console.log("T-OBJ", l - traverse_minlevel, obj);
        traverse_out.push({ "type": obj["@type"], "id": obj["@id"], "name": obj.name, "datePublished": obj.datePublished, "dateModified": obj.dateModified, "level": l - traverse_minlevel });
        traverse_html += `<div class="str_H${l - traverse_minlevel + 1}"> ${jld_entry(obj)}</div>`;
    }
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            traverse(obj[key], l);
        }
    }
}

function jld_entry (item) {
    var out = "";
    out += "<span class='item'>@type</span>: " + item["@type"] + " ";
    if (item.name != undefined) out += "<span class='item'>name</span>: " + item.name + " ";
    if (item["@type"] == "ImageObject") {
        out += `<a href='${item.url}' target='_blank'><img src='${item.url}' style='height:12px'>`
        if (item.width != undefined && item.height != undefined) {
            out += `(${item.width}x${item.height} ${get_ratio(item.width, item.height)})`
        } else {
            out += 'image'
        }
        out += "</a>"
        if (item.width == undefined || item.height == undefined) {
            out += show_inline_info("{{no_image_size}}")
            sections.structureddata_jsonld.info++;
        }

    }
    if (item.id != undefined) out += "<span class='item'>id</span>: " + item.id + " ";

    // if (item.url != undefined) out += "<span class='item'>url</span>: " + item.url + " ";
    if (item.urlTemplate != undefined) out += "<span class='item'>urlTemplate</span>: " + item.urlTemplate + " ";

    if (item.datePublished != undefined) out += "<span class='item'>datePublished</span>: " + item.datePublished + " ";
    if (item.dateModified != undefined) out += "<span class='item'>dateModified</span>: " + item.dateModified + " ";
    return out;
}

function get_ratio (x, y) {
    x = Number(x)
    y = Number(y)
    if (x == y) {
        return "square"
    } else if (x > y) {
        return "landscape"
    } else {
        return "portrait"
    }
}

function isArr (o) {
    return Object.prototype.toString.call(o) === '[object Array]';
}

function get_image_info (o) {
    // console.dir(o);

    var imageTop = o.getBoundingClientRect().top + window.scrollY || 0;

    var i = {
        "src": o.src,
        "originalsrc": o.src,
        "w": o.naturalWidth,
        "h": o.naturalHeight,
        "ratio": o.naturalWidth / o.naturalHeight,
        "mp": (o.naturalWidth * o.naturalHeight / 1000000).toFixed(1),
        "alt": (o.attributes.alt != undefined ? o.attributes.alt.value : undefined),
        "width": (o.attributes.width ? o.attributes.width.value ? o.attributes.width.value : "" : ""),
        "height": (o.attributes.height ? o.attributes.height.value ? o.attributes.height.value : "" : ""),
        "title": o.title,
        "loading": o.loading,
        "abovethefold": imageTop < 800,
        "sizes": o.sizes,
        "srcset": o.srcset,
        "fetchpriority": o.fetchPriority
    };

    if (i.src.startsWith("data:")) i.src = i.src.substring(0, 64) + " [...]";

    if (i.ratio > 1) {
        i.ratio_name = "landscape orientation";
    } else if (i.ratio < 1) {
        i.ratio_name = "portrait orientation";
    } else {
        i.ratio_name = "square";
    }

    return i;
}

function obj2csv (o) {
    var out = [];
    for (var k in o) {
        if (o.hasOwnProperty(k)) {
            out.push(k + "=" + o[k]);
        }
    }
    return out.join(", ");
}

function getViewport (S) {

    function parseMetaViewPortContent (S) {
        S = S.toLowerCase();
        var c = {
            validProperties: {},
            unknownProperties: {},
            invalidValues: {},
            outcome: []
        };
        var i = 1;
        while (i <= S.length) {
            while (i <= S.length && RegExp(' |\x0A|\x09|\0d|,|;|=').test(S[i - 1])) {
                i++;
            }
            if (i <= S.length) {
                i = parseProperty(c, S, i);
            }
        }
        if (c.validProperties.width != "device-width") {
            c.outcome.push("{{info_viewportwidth}}");
        }
        if (c.validProperties["maximum-scale"]) {
            c.outcome.push("{{info_maximumscale}}");
        }
        if (c.validProperties["user-scalable"] != "yes" && c.validProperties["user-scalable"] != undefined) {
            c.outcome.push("{{info_userscalable}}");
        }
        return c;
    }

    var propertyNames = "width height initial-scale minimum-scale maximum-scale user-scalable shrink-to-fit viewport-fit".split(" ");

    function parseProperty (c, S, i) {
        var start = i;
        while (i <= S.length && !RegExp(' |\x0A|\x09|\0d|,|;|=').test(S[i - 1])) {
            i++;
        }
        if (i > S.length || RegExp(',|;').test(S[i - 1])) {
            return i;
        }
        var propertyName = S.slice(start - 1, i - 1);
        while (i <= S.length && !RegExp(',|;|=').test(S[i - 1])) {
            i++;
        }
        if (i > S.length || RegExp(',|;').test(S[i - 1])) {
            return i;
        }
        while (i <= S.length && RegExp(' |\x0A|\x09|\0d|=').test(S[i - 1])) {
            i++;
        }
        if (i > S.length || RegExp(',|;').test(S[i - 1])) {
            return i;
        }
        start = i;
        while (i <= S.length && !RegExp(' |\x0A|\x09|\0d|,|;|=').test(S[i - 1])) {
            i++;
        }
        var propertyValue = S.slice(start - 1, i - 1);
        setProperty(c, propertyName, propertyValue);
        return i;
    }

    function setProperty (c, name, value) {
        if (propertyNames.indexOf(name) >= 0) {
            var number = parseFloat(value);
            if (!isNaN(number)) {
                c.validProperties[name] = number;
                return;
            }
            var string = value.toLowerCase();

            if (string === "yes" || string === "no" || string === "device-width" || string === "device-height" || (name.toLowerCase() === 'viewport-fit' && (string === 'auto' || string === 'cover'))) {
                c.validProperties[name] = string;
                return;
            }
            c.validProperties[name] = null;
            c.invalidValues[name] = value;
        } else {
            c.unknownProperties[name] = value;
        }
    }

    return parseMetaViewPortContent(S);

}

function decodeHtml (html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function humanFileSize (size) {
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};

async function get_memory_stats () {
    const quota = await navigator.storage.estimate();
    return quota;
}

/* */

function copyItem (item) {
    // console.log("copyItem", item);
    if (item) {
        var range = document.createRange();
        range.selectNode(item);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
        return true;
    } else {
        return false;
    }
}

function downloadSVGasTextFile (markup) {
    const base64doc = btoa(unescape(encodeURIComponent(markup)));
    const a = document.createElement('a');
    const e = new MouseEvent('click');

    a.download = 'download.svg';
    a.href = 'data:text/html;base64,' + base64doc;
    a.dispatchEvent(e);
}

// extract gbimages form all document
function getBgImgs (doc) {
    const srcChecker = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i;
    return Array.from(
        Array.from(doc.querySelectorAll('*'))
            .reduce((collection, node) => {
                let prop = window.getComputedStyle(node, null)
                    .getPropertyValue('background-image');
                let match = srcChecker.exec(prop);
                if (match) {
                    collection.add(match[1]);
                }
                return collection;
            }, new Set())
    );
}

/* UI */

var intros = [
    "common",
    "othermetadata",
    "largeimages",
    "rhints",
    "externalr",
    "internalr",
    "structureddata",
    "cms",
    "headers",
    "svg"
];

function show_section (title, id, content) {
    // console.log("@show_section", title, id);
    // remove content when all *_tout is removed
    var out = "";
    if (content != "") {

        // inside title

        var badges = "";
        if (sections[id] !== undefined) {
            if (sections[id].count > 1) badges += " <span class='itemsCount' title='" + sections[id].count + " items inside'>(" + sections[id].count + " {{sections}})</span>";
            if (sections[id].warnings > 0) badges += " <span class='badge badge-warning'>" + sections[id].warnings + "</span>";
            if (sections[id].info > 0) badges += " <span class='badge badge-info'>" + sections[id].info + "</span>";
        }

        out = `
        <div>
            <button class="btn btn-secondary btn-sections collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${id}" data-bs-id="${id}">
                ${title}${badges}
            </button>
        </div>`;

        var intro_text, intro_block = "";

        if (intros.includes(id)) {
            intro_text = chrome.i18n.getMessage("intro_" + id).replace(/\n/g, "<br>");
            intro_block = `
            <div class="section_intro_outer">
                <svg class="icon" data-infotoggle='${id}' data-action="show_tip">
                    <use xlink:href="#ico-help" ></use>
                </svg>
                <p class='section_intro visible' id="tip_${id}">
                    <span>${intro_text}</span>
                    <em data-infotoggle='${id}' data-action="hide_tip">${chrome.i18n.getMessage("close")}</em>
                </p>
            </div>
            `;
        }

        // <p class='section_intro${(menu["toggle_" + id + "_info"] != "hide" ? " visible" : "")}'></p>
        // w:${sections[id].warnings_list.length}

        // console.log("++++++++++++++ id", id)
        // console.log("************** sections[id]", sections[id])

        let warning_out
        let info_out
        if (sections[id] !== undefined) {
            warning_out = sections[id].warnings_list.join("")
            info_out = sections[id].info_list.join("")
        } else {
            console.warn("MSI3 - no section:", id)
            warning_out = ""
            info_out = ""
        }

        out += `
        <div class="collapse" id="${id}" data-section="${id}">
            <div class="card card-body">
                ${intro_block}
                ${warning_out}
                ${info_out}
                ${content}
            </div>
        </div>`;

    }
    return out;
}

function storeMenu () {
    chrome.storage.sync.set({ "menu": menu }, function () { });
}

function storeTips () {
    chrome.storage.sync.set({ "tips": tips }, function () { });
}

function storeTab (id) {
    chrome.storage.sync.set({ "activetab": id }, function () { });
}

function storeUpdate (value) {
    chrome.storage.sync.set({ "hideupdate": value }, function () { });
}

// function getTF (name) {
//     return localStorage.getItem(name) == "true" ? true : false;
// }

// function setTF (name, value) {
//     localStorage.setItem(name, value);
// }
