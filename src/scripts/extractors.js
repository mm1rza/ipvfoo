/*jshint esversion: 9 */

function getMeta (dotName, content, meta_name, tout) {
  // console.log("@getMeta page.opengraph", page.opengraph)
  var tout_verification = "";

  if (dotName != null) {
    // console.log("dotName", dotName)
    if (dotName.substring(0, 3) == "og:") {
      sections.opengraph.out += wrap(tout);
      // console.log("dotName", dotName)
      if (dotName == "og:title") page.opengraph.title = 1;
      if (dotName == "og:type") page.opengraph.type = 1;
      if (dotName == "og:url") page.opengraph.url = 1;
      if (dotName == "og:image") page.opengraph.image = 1;
      if (dotName == "og:description") page.opengraph.description = 1;
    } else if (dotName.substring(0, 3) == "fb:") {
      sections.opengraph.out += wrap(tout);
      if (dotName == "fb:app_id") page.opengraph.appid = 1;
    } else if (dotName.substring(0, 8) == "article:" || dotName.substring(0, 6) == "video:" || dotName.substring(0, 6) == "music:") {
      sections.opengraph.out += wrap(tout);
    } else if (dotName.substring(0, 8) == "twitter:") {
      sections.twitter.out += wrap(tout);
    } else if (dotName.substring(0, 3) == "al:") {
      sections.mobile.out += wrap(tout);
    } else if (dotName.startsWith("docsearch:")) {
      sections.cms.out += wrap(tout);
    } else if (dotName.startsWith("docusaurus_")) {
      sections.cms.out += wrap(tout);
    } else if (dotName.substring(0, 9) == "sailthru." || dotName.substring(0, 3) == "dc.") {
      sections.structureddata_other.out += wrap(tout);
    } else if (dotName in verifications) {
      tout_verification += wrap(`<span class='attr_name'>${meta_name}</span> (${verifications[dotName]}) <span class='content'>${content}</span>`);
    } else if (dotName.substring(0, 4) == "geo." || dotName == "icbm") {
      sections.geo.out += wrap(tout);
    } else if (["view-transition", "color-scheme", "theme-color", "format-detection", "apple-mobile-web-app-status-bar-style", "charset", "mssmarttagspreventparsing", "thumbnail"].indexOf(dotName) != -1 || dotName.substring(0, 14) == "msapplication-") {
      // console.log("dotName!", dotName);
      if (dotName.indexOf("theme-color") != -1) checklist["theme-color"] = true; // indexOf ?
      if (dotName == "thumbnail") {
        sections.presentation.out += wrap(tout + " " + show_inline_info("{{info_thumbnail}}"));
        sections.presentation.info++;
      } else {
        sections.presentation.out += wrap(tout, "oneline");
      }
    } else if (["keywords", "description", "robots", "googlebot"].indexOf(dotName) != -1) {
      if (dotName == "robots" && (content.includes("noindex") || content.includes("nofollow"))) {
        sections.common.out += wrap(tout + " " + show_inline_info("{{info_tobots}}"));
        sections.common.info++;
      } else {
        sections.common.out += wrap(tout, null, true);
      }
    } else if (["generator", "environment"].indexOf(dotName) != -1 || dotName.substring(0, 7) == "shopify") {
      sections.cms.out += wrap(tout);
    } else if (["csrf-param", "csrf-token", "csp-nonce", "xsrf_token", "csrftoken", "referrer"].indexOf(dotName) != -1) {
      sections.security.out += wrap(tout);
    } else if (["viewport", "handheldfriendly", "mobileoptimized", "apple-mobile-web-app-title", "apple-mobile-web-app-capable", "mobile-web-app-capable", "apple-itunes-app", "google-play-app"].indexOf(dotName) != -1) {
      // console.log("dotName!!!!", dotName);
      sections.mobile.out += wrap(tout, null, (dotName == "viewport"));
      if (dotName == "viewport") {
        page.checklist.viewport = true;
        var viewportData = getViewport(content);
        if (Object.keys(viewportData.invalidValues).length !== 0) {
          sections.mobile.out = show_warning("invalid values: " + obj2csv(viewportData.invalidValues)) + sections.mobile.out;
          sections.mobile.warnings++;
        }
        if (Object.keys(viewportData.unknownProperties).length !== 0) {
          sections.mobile.out = show_info("unknown properties: " + obj2csv(viewportData.unknownProperties)) + sections.mobile.out;
          sections.mobile.info++;
        }
        if (Object.keys(viewportData.outcome).length !== 0) {
          for (var outcomes = 0; outcomes < viewportData.outcome.length; outcomes++) {
            sections.mobile.out = show_warning(viewportData.outcome[outcomes]) + sections.mobile.out;
            sections.mobile.warnings++;
          }
        }
      }

      if (dotName == "apple-mobile-web-app-capable") {
        sections.mobile.out = show_info("{{info_applemobile}}") + sections.mobile.out;
        sections.mobile.info++;
      }

      if (dotName == "google-play-app") {
        sections.mobile.out += wrap(tout + " " + show_inline_info("{{info_googleplay}}"));
        sections.mobile.info++;
      }
    } else if (dotName == "x-ua-compatible") {
      sections.other.out += wrap(tout + " " + show_inline_info("{{info_xua}}"));
      sections.other.info++;
    } else if (dotName == "title") {
      sections.other.out += wrap(tout + " " + show_inline_info("{{info_title}}"));
      sections.other.info++;
    } else if (dotName == "pinterest-rich-pin") {
      sections.pinterest.out += wrap(tout);
    } else {
      if (tout) {
        sections.other.out += wrap(tout);
      }
    }
  }

  return {
    tout,
    tout_verification
  };
}

function extract_common () {

  // doctype

  sections.common.out += show_element(
    "doctype",
    page.doctype,
    null,
    (page.doctype == "" ? chrome.i18n.getMessage("notdefined") : ""),
    null,
    (page.doctype == "" ? chrome.i18n.getMessage("tip_no_doctype") : null),
    null,
    false
  );
  if (page.doctype == "") sections.common.warnings++;

  // lang

  sections.common.out += show_element(
    "html lang",
    page.lang,
    null,
    null,
    (page.lang == "" ? chrome.i18n.getMessage("no_lang") : ""),
    (page.lang == "" ? chrome.i18n.getMessage("tip_html_lang") : "")
  );
  if (page.lang == "") sections.common.info++;

  // content type

  sections.common.out += show_element(
    "content type",
    page.contenttype,
    null,
    null,
    "",
    ""
  );

  // canonical

  if (page.canonical == undefined) {
    sections.common.out += show_element(
      "canonical",
      "",
      null,
      chrome.i18n.getMessage("notdefined"),
      null,
      chrome.i18n.getMessage("tip_canonical_missing"), ["fix it", `https://www.omiod.com/meta-seo-inspector/meta-info.php?tag=canonical${utm_link}`]
    );
    sections.common.warnings++;
  } else {
    sections.common.out += show_element(
      "canonical",
      page.canonical,
      null,
      "",
      null,
      chrome.i18n.getMessage("tip_canonical_defined"), ["tip", `https://www.omiod.com/meta-seo-inspector/meta-info.php?tag=canonical${utm_link}`],
      true
    );

    console.log("page.checklist", page.checklist)

    if (page.checklist.canonical_outside_head) {
      sections.common.out = show_warning("{{canonicalnotinhead}}", "{{tip_bad_head_tag}}") + sections.common.out;
      sections.common.warnings++;
    }
    if (page.checklist.canonical_multiple) {
      sections.common.out = show_warning("{{canonicalmultiple}}", "{{tip_canonical_multiple}}") + sections.common.out;
      sections.common.warnings++;
    }
    if (page.checklist.hreflang_canonical_conflict) {
      sections.common.out = show_warning("{{hreflang_canonical_conflict}}", "{{tip_hreflang_canonical_conflict}}") + sections.common.out;
      sections.common.warnings++;
    }
    if (page.canonical && !page.canonical.startsWith("http://") && !page.canonical.startsWith("https://") && !page.canonical.startsWith("//")) {
      sections.common.out = show_warning("{{canonical_relative_url}}", "{{tip_canonical_relative_url}}") + sections.common.out;
      sections.common.warnings++;
    }
    if (!page.checklist.canonical_same_as_url) {
      sections.common.out = show_info(
        "{{canonicaldifferent}}",
        "{{tip_canonicaldifferent}}", ["fix it", `https://www.omiod.com/meta-seo-inspector/meta-info.php?tag=canonical${utm_link}`]
      ) + sections.common.out;
      sections.common.info++;
    }
  }

  // title

  if ($$("title").length > 0) {
    // console.log("****************** PAGE", page)
    page.title = $("title").innerText;
    // console.log("****************** PAGE TITLE", page.title)
    if (page.title?.length > 0) {
      page.title = decodeHtml(page.title.trim());
      var titleLen = page.title.length;

      sections.common.out += show_element(
        "{{headtitle}}",
        page.title,
        titleLen + " {{characters}}",
        null,
        null,
        null,
        null,
        true
      );

      if (titleLen > 65) {
        sections.common.out = show_info("{{titletoolong}}", "{{tip_titletoolong}}") + sections.common.out;
        sections.common.info++;
      }
      if ($$("head title").length == 0) { // check tag position
        sections.common.out = show_warning("{{titlenotinhead}}", "{{tip_bad_head_tag}}") + sections.common.out;
        sections.common.warnings++;
      }
    } else {
      page.title = "";
      sections.common.out = show_warning("{{headtitleempty}}", "{{tip_headtitleempty}}") + sections.common.out;
      sections.common.warnings++;
    }

  } else {
    // sections.common.out = 
    show_warning(
      "{{missingheadtitle}}",
      "{{tip_missingheadtitle}}",
      ["fix it", `https://www.omiod.com/meta-seo-inspector/meta-info.php?tag=title&utm_source=MSI_app${utm_link}`],
      "common"
    )// + sections.common.out;
    // sections.common.warnings++;
  }

  //

}

function extract_hreflang () {
  var list = $$("link[hreflang]");
  if (list.length === 0) return;

  var currentUrlNorm = window.location.href.replace(/\/+$/, '').toLowerCase();
  var canonicalRaw = page.canonical || "";
  var canonicalNorm = "";
  if (canonicalRaw) {
    try {
      canonicalNorm = new URL(canonicalRaw, window.location.href).href.replace(/\/+$/, '').toLowerCase();
    } catch (e) {
      canonicalNorm = canonicalRaw.trim().replace(/\/+$/, '').toLowerCase();
    }
  }

  var hreflangs = [];
  var seenCodes = {};
  var duplicateCodes = [];
  var syntaxErrors = [];
  var hasSelf = false;
  var hasXDefault = false;
  var hasRelative = false;
  var hasOutsideHead = false;

  for (var i = 0; i < list.length; i++) {
    var el = list[i];
    var code = (el.getAttribute("hreflang") || "").trim();
    var rawHref = el.getAttribute("href") || "";
    var inHead = (el.closest("head") !== null) || (el.parentElement && el.parentElement.tagName.toLowerCase() === "head");

    if (!inHead) hasOutsideHead = true;

    var absoluteHref = "";
    try {
      absoluteHref = new URL(rawHref, window.location.href).href;
    } catch (e) {
      absoluteHref = rawHref;
    }

    var isRelative = rawHref && !rawHref.startsWith("http://") && !rawHref.startsWith("https://") && !rawHref.startsWith("//");
    if (isRelative) hasRelative = true;

    var normHref = absoluteHref.replace(/\/+$/, '').toLowerCase();

    // Check code syntax
    var codeCheck = isValidHreflangCode(code);
    if (!codeCheck.valid) {
      var msg = code + (codeCheck.suggestion ? ` (suggest: ${codeCheck.suggestion})` : "");
      if (!syntaxErrors.includes(msg)) syntaxErrors.push(msg);
    }

    // Check duplicates
    var lowerCode = code.toLowerCase();
    if (seenCodes[lowerCode]) {
      if (!duplicateCodes.includes(code)) duplicateCodes.push(code);
    } else {
      seenCodes[lowerCode] = true;
    }

    var isSelf = (normHref === currentUrlNorm);
    if (isSelf) {
      hasSelf = true;
    }

    if (lowerCode === "x-default") {
      hasXDefault = true;
    }

    hreflangs.push({
      code: code,
      rawHref: rawHref,
      absoluteHref: absoluteHref,
      isRelative: isRelative,
      isSelf: isSelf,
      inHead: inHead,
      isValid: codeCheck.valid
    });
  }

  page.hreflang = hreflangs;
  sections.hreflang.count = hreflangs.length;

  // Cross-validation with Canonical
  if (canonicalNorm && hreflangs.length > 0) {
    var matchingCanonicalEntry = hreflangs.find(function (h) {
      var hNorm = h.absoluteHref.replace(/\/+$/, '').toLowerCase();
      return hNorm === canonicalNorm;
    });

    if (matchingCanonicalEntry && !matchingCanonicalEntry.isSelf) {
      page.checklist.hreflang_canonical_conflict = true;
      sections.hreflang.out += show_warning("{{hreflang_canonical_conflict}}: " + matchingCanonicalEntry.code + ` (${matchingCanonicalEntry.rawHref})`, "{{tip_hreflang_canonical_conflict}}", "", "hreflang");
    }
  }

  if (!hasSelf) {
    sections.hreflang.out += show_warning("{{hreflang_missing_self}}", "{{tip_hreflang_missing_self}}", "", "hreflang");
  }

  if (!hasXDefault && hreflangs.length > 1) {
    sections.hreflang.out += show_info("{{hreflang_missing_xdefault}}", "{{tip_hreflang_missing_xdefault}}", "", "hreflang");
  }

  if (hasRelative) {
    sections.hreflang.out += show_warning("{{hreflang_relative_url}}", "{{tip_hreflang_relative_url}}", "", "hreflang");
  }

  if (hasOutsideHead) {
    sections.hreflang.out += show_warning("{{hreflang_outside_head}}", "{{tip_bad_head_tag}}", "", "hreflang");
  }

  if (syntaxErrors.length > 0) {
    sections.hreflang.out += show_warning("{{hreflang_invalid_syntax}}: " + syntaxErrors.join(", "), "{{tip_hreflang_invalid_syntax}}", "", "hreflang");
  }

  if (duplicateCodes.length > 0) {
    sections.hreflang.out += show_warning("{{hreflang_duplicate_code}}: " + duplicateCodes.join(", "), "{{tip_hreflang_duplicate_code}}", "", "hreflang");
  }

  // Render Table
  var rows = [];
  for (var j = 0; j < hreflangs.length; j++) {
    var h = hreflangs[j];
    var badges = [];
    if (h.isSelf) {
      badges.push("<span class='badge bg-success'>{{hreflang_self}}</span>");
    }
    if (canonicalNorm && h.absoluteHref.replace(/\/+$/, '').toLowerCase() === canonicalNorm) {
      badges.push("<span class='badge bg-info'>{{hreflang_canonical}}</span>");
    }
    if (h.code.toLowerCase() === "x-default") {
      badges.push("<span class='badge bg-secondary'>x-default</span>");
    }
    if (!h.isValid) {
      badges.push("<span class='badge bg-danger'>invalid code</span>");
    }
    if (h.isRelative) {
      badges.push("<span class='badge bg-warning text-dark'>relative</span>");
    }

    var codeClass = h.isValid ? "attr_name" : "attr_name text-danger";

    rows.push(`
      <tr>
        <td style="white-space:nowrap;"><span class="${codeClass}">${escapeHtml(h.code)}</span></td>
        <td class="content" style="word-break:break-all;">
          <a href="${escapeHtml(h.absoluteHref)}" target="_blank" class="cont_link"><span>${escapeHtml(h.rawHref)}</span></a>
        </td>
        <td style="white-space:nowrap;">${badges.join(" ")}</td>
      </tr>
    `);
  }

  sections.hreflang.out += `
    <div class='ad_seo_item'>
      <table cellspacing=0 class='table'>
        <tr>
          <th style="width:15%;">LANG</th>
          <th style="width:60%;">URL</th>
          <th style="width:25%;">FLAGS</th>
        </tr>
        ${rows.join("")}
      </table>
    </div>
  `;
}

function extract_links () {

  var tmp;
  var list = $$("link");

  for (var i = 0; i < list.length; i++) {

    var rel = list[i].rel.toLowerCase();
    if (rel != "") {
      var title = list[i].title;
      var href = list[i].href;
      var hreflang = list[i].hreflang;

      if (rel.includes("alternate") && hreflang != "") {
        continue;
      }
      var as = list[i].as;
      var sizes = list[i].sizes;
      var type = list[i].type;
      var fetchpriority = list[i].fetchPriority;
      // console.log(rel,as);

      tmp = "<span class='attr_name'>" + rel + "</span> ";

      if (as != "") tmp += ` (as ${as}) `;
      if (title != "") tmp += ` (${title}) `;
      if (hreflang != "") tmp += ` (hreflang=${hreflang}) `;
      if (sizes != "") tmp += ` (sizes=${sizes}) `;
      if (type != "") tmp += ` (type=${type}) `;
      if (fetchpriority != "") tmp += ` (fetchpriority=${fetchpriority}) `;

      if (href.substr(0, 4) == "http") {
        tmp += `<a href='${href}' target='_blank' class='cont_link'><span>`;
        if (href.match(/^.+\.(jpe?g|bmp|png|gif|svg|webp)$/i)) tmp += `<img src='${href}'>`;
        tmp += href + "</span></a>";
      } else {
        tmp += href;
      }

      const validRelValues = ["dns-prefetch", "preload", "preconnect", "prefetch", "preconnect dns-prefetch", "dns-prefetch preconnect"];
      if (validRelValues.includes(rel)) {
        sections.rhints.out += wrap(tmp, "oneline");
        sections.rhints.count = 1;
      } else if (rel == "wlwmanifest" || rel == "edituri") {
        sections.cms.out += wrap(tmp, "oneline");
      } else if (rel == "canonical") {
        if (page.canonical != undefined) {
          page.checklist.canonical_multiple = true
        }
        page.canonical = list[i].getAttribute("href");

        if ($$("head link[rel=canonical]").length == 0) { // check tag position in head
          page.checklist.canonical_outside_head = true;
        }

        const url_alt = location.href.replace(/\/+$/, '');  // handles the fact that with or without enddinf slahs the urls are the same, and location.href always puts a slash at the end of folders
        if (page.canonical == location.href || page.canonical == url_alt) {
          page.checklist.canonical_same_as_url = true;
        }

      } else if (["apple-touch-icon-precomposed", "icon", "apple-touch-icon", "shortcut icon", "apple-touch-startup-image", "mask-icon", "image_src"].indexOf(rel) != -1 || rel.substr(0, 14) == "msapplication-") {
        sections.presentation.out += wrap("&lt;link&gt; " + tmp, "oneline");
        if (rel == "apple-touch-icon") page.checklist['apple-touch-icon'] = true;
        if (rel == "apple-touch-icon-precomposed") page.checklist['apple-touch-icon-precomposed'] = true;
      } else if (rel == "shortlink") {
        sections.links.out += wrap(tmp + show_inline_info("shortlink is ignored by Google (2017)"), "oneline");
        sections.links.info++;
      } else {
        sections.links.out += wrap(tmp, "oneline");
      }

    }
  }
}

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

function extract_bgimages () {
  var images = getBgImgs(document);
  images = [...new Set(images)];  // remove dupes

  for (var i = 0; i < images.length; i++) {
    sections.bgimages.out += "<div class='ad_seo_item'>";
    sections.bgimages.out += `<div class="thumbcontainer svgouter"><img src="${images[i]}" loading="lazy" class="thumbnail"></img></div>`;
    sections.bgimages.out += "<a class='item' href='" + images[i] + "'>";
    if (images[i].length > 80) {
      sections.bgimages.out += images[i].substring(0, 64) + " ...";
    } else {
      sections.bgimages.out += images[i];
    }
    sections.bgimages.out += "</a></div>";
    sections.bgimages.count++;

  }
}

function extract_images () {
  var images = $$("img");
  var images_list = "";
  var images_count = 0;
  var images_no_alt = 0;
  var images_no_title = 0;
  var images_no_loading = 0;
  var images_no_widhei = 0;
  var images_lazy_and_above = 0;

  var larges_tmp = [];

  for (var i = 0; i < images.length; i++) {
    var image = get_image_info(images[i]);

    if (image.mp >= 2) {
      var u = url2domain(image.src);
      if (u && !larges_tmp.includes(image.src)) {
        sections.largeimages.out += "<div class='ad_seo_item'>";
        sections.largeimages.out += `<div class="thumbcontainer svgouter"><img src="${image.originalsrc}" class="thumbnail"></img></div>`;
        sections.largeimages.out += `<a class='item' href='${image.src}' target='_blank'>${u.url}</a> ${image.w}x${image.h} - ${image.mp}MP - ${image.ratio_name}`;
        sections.largeimages.out += "</div>";
        sections.largeimages.count++;
        larges_tmp.push(image.src);
      }
    }

    images_list += `
      <tr>
        <td style="vertical-align: middle; width:64px;">
          <div class="thumbcontainer svgouter">
            <img src="${image.originalsrc}" class="thumbnail">
          </div>
        </td>
        <td style='width:25%;'>
          <div><a class='cont_link' href='${image.src}'><span>${image.src}</span></a></div>
          ${image.srcset ? `SRCSET: available<br>` : ""}
          ${image.sizes ? `SIZES: ${image.sizes}` : ""}
        </td>
        <td>
          <span class='nowrap' style='padding:0'>
            <table class='table inner' style='border-collapse: collapse; margin:0;'>
              <tr>
                <th>REAL</th>
                <td style='white-space:nowrap'>${image.w}x${image.h}${(image.mp >= 1 ? ` (${image.mp}MP)` : "")}</td>
              </tr>
              <tr ${(image.width == "" || image.height == "" ? " class='bg_warning' " : "")}>
                <th>HTML</th>
                <td style='white-space:nowrap'>${image.width || "- "}x${image.height || " -"}</td>
              </tr>
            </table>
          </span>
        </td>
    `;
    images_list += (image.loading != "auto" ? `<td>${image.loading}</td>` : "<td class='bg_info' title='LOADING missing'></td>");
    images_list += (image.fetchpriority ? `<td>${image.fetchpriority}</td>` : "<td></td>");
    images_list += (image.alt != undefined ? `<td>${image.alt}</td>` : "<td class='bg_warning' title='ALT missing'></td>");
    images_list += (image.title ? `<td>${image.title}</td>` : "<td class='bg_info' title='TITLE missing'></td>");
    images_list += "</tr>";

    images_count++;
    if (image.alt == undefined) images_no_alt++;
    if (image.width == "" || image.height == "") images_no_widhei++;
    if (!image.title) images_no_title++;
    if (image.loading == "auto") images_no_loading++;
    if (image.loading == "lazy" && image.abovethefold) images_lazy_and_above++;

  }

  if (images_list != "") {

    if (images_no_alt) {
      // sections.images.out +=
      show_warning(
        images_no_alt + ` {{missingaltp1}} ${images_count}) {{missingaltp2}}`,
        "{{missingaltp2_tip}}",
        "",
        "images"
      );
      // sections.images.warnings++;
    }
    if (images_no_title) {
      sections.images.out += show_info(images_no_title + ` {{missingtitlep1}} ${images_count}) {{missingtitlep2}}`, "{{missingtitlep1_tip}}");
      sections.images.info++;
    }
    if (images_no_loading) {
      sections.images.out += show_info(images_no_loading + ` {{missingloadingp1}} ${images_count}) {{missingloadingp2}}`, "{{missingloadingp2_tip}}");
      sections.images.info++;
    }
    if (images_no_widhei) {
      sections.images.out += show_warning(images_no_widhei + ` {{missingwidhei1}} ${images_count}) {{missingwidhei2}}`, "{{missingwidhei2_tip}}");
      sections.images.warnings++;
    }
    if (images_lazy_and_above) {
      sections.images.out += show_info(images_lazy_and_above + ` {{lazyabove1}} ${images_count}) {{lazyabove2}}`, "{{lazyabove_tip}}");
      sections.images.info++;
    }

    sections.images.out += "<div class='ad_seo_item'><table cellspacing=0 class='table'><tr><th></th><th>SRC</th><th>SIZE</th><th>LOADING</th><th>FETCH PR.</th><th>ALT</th><th>TITLE</th></tr>" + images_list + "</table></div>";
    sections.images.count = 1;
  }
}

function extract_headers () {
  var html_h1 = $$("h1").length;
  if (html_h1 > 0) {
    if (html_h1 > 1) {
      show_warning(
        "{{toomanyh1}}<span class='item_count'>(" + html_h1 + " {{items}})</span>",
        "{{tip_toomanyh1}}",
        "",
        "headers"
      );
    } else {
      // 1 H1
      var h1_len = $$("h1")[0].innerText.length;
      if (h1_len < 20 || h1_len > 70) {
        show_warning(
          "{{h1optimalsize}}<span class='item_count'>(" + h1_len + " {{characters}})</span>",
          "{{tip_h1optimalsize}}",
          "",
          "headers"
        );
      }
    }
  } else {
    show_warning(
      "{{missingh1tag}}",
      "{{tip_missingh1tag}}",
      "",
      "headers"
    );
  }

  var html_headers = $$("h1,h2,h3,h4,h5,h6");
  var level = null;
  var hskip = false;
  for (var i = 0; i < html_headers.length; i++) {
    var new_level = parseInt(html_headers[i].tagName.substr(-1), 10);
    if (level != null) {
      hskip = (new_level - level > 1);
    }
    sections.headers.out += "<div class='ad_seo_item values_list' data-action='show_element' data-id='header" + i + "'><div class='noevents str_" + html_headers[i].tagName + "'><span class='attr_name" + (hskip ? " hskip" : "") + "'>" + html_headers[i].tagName.toLowerCase() + "</span> " + html_headers[i].textContent + " <span class='item_count'>(" + html_headers[i].textContent.trim().length + " {{characters}})</span>";
    elements[`header${i}`] = html_headers[i];

    if (html_headers[i].textContent.trim().length == 0) {
      sections.headers.out += " " + show_inline_info("{{empty}}");
      sections.headers.info++;
    }
    // NOTE innerText can be upercase if the CSS says so
    if (html_headers[i].innerText.trim().toLowerCase() != html_headers[i].textContent.trim().toLowerCase()) {
      // console.log("MAYBE HIDDEN")
      // console.dir(html_headers[i])
      sections.headers.out += " " + show_inline_info("{{tip_headercontenthidden}}", "", ["more", `https://www.omiod.com/meta-seo-inspector/seo-tips.php?header-content-hidden${utm_link}`]);  /////////////////////////////////////////////////////
      sections.headers.info++;
    }
    if (level == null && new_level > 1) {
      sections.headers.out += " " + show_inline_info("{{firstheadernoth1}}");
      sections.headers.info++;
    }
    if (hskip) {
      sections.headers.out += " " + show_inline_info("found h" + new_level + ", h" + (level + 1) + " expected");
      sections.headers.info++;
    }
    sections.headers.out += "</div></div>";

    level = new_level;
  }
  if (sections.headers.out != "") sections.headers.count = 1;
}

function _videoLink (src) {
  var out = "";
  var is_streaming = (url2domain(src).protocol == "blob:");

  out += `<a class='item' href='${src}'>${url2domain(src).url}</a>`;
  if (is_streaming) {
    out += " ({{streaming}})";
  } else {
    out += ` <a class='item' href='${src}' download='download'>DL</a>`;
  }
  out += "<br>";
  return out;
}

function extract_video () {
  // console.log("MS2 CS @extract_video")
  var tout = "";

  var html_video = $$("video");
  if (html_video.length > 0) {
    tout = "";
    for (var i = 0; i < html_video.length; i++) {
      var src_out = "";
      var src = html_video[i].src;
      if (src) {
        src_out += _videoLink(src);
      } else {
        var sources = html_video[i].children;
        for (var s = 0; s < sources.length; s++) {
          if (sources[s].src) {
            src = sources[s].src;
            src_out += _videoLink(src);
          }
        }
      }
      tout += "<tr><td>";
      tout += src_out;

      let vid_hms = "-"
      if (html_video[i].duration) {
        if (isFinite(html_video[i].duration)) {
          vid_hms = new Date(html_video[i].duration * 1000).toISOString().substr(11, 8);
        }
      }
      // console.log("vid_hms", vid_hms)
      tout += "</td><td class='nowrap'>" + html_video[i].videoWidth + "x" + html_video[i].videoHeight + "</td><td>" + vid_hms + "</td><td class='nowrap'>x" + html_video[i].playbackRate + "</td><td class='nowrap'>" + html_video[i].muted + "</td><td class='nowrap'>" + html_video[i].loop + "</td><td class='nowrap'>" + html_video[i].controls + "</td><td class='nowrap'>" + html_video[i].autoplay + "</td></tr>";
    }

    if (tout != "") {
      sections.videos.out += "<div class='ad_seo_item'><table cellspacing=0 class='table'><tr><th>URL</th><th>SIZE</th><th>DURATION</th><th>SPEED</th><th>MUTED</th><th>LOOP</th><th>CONTROLS</th><th>AUTOPLAY</th></tr>" + tout + "</table></div>";
      sections.videos.count++;
    }
  } else {
    // no video tag
  }

  // VIDEO LINK /////////////////////////////////////////////

  var extensions = ["mp3", "mp4", "webm"];
  var html_a = $$("a");
  // console.log("html_a", html_a)
  if (html_a.length > 0) {
    tout = "";
    for (let i = 0; i < html_a.length; i++) {
      var href = html_a[i].href;
      if (href.baseVal != null) href = href.baseVal; // is SVGAnimatedString
      var ext = href.slice((href.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase(); // https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504
      if (extensions.includes(ext)) {
        tout += "link <a class='item' href='" + href + "'>" + url2domain(href).url + "</a> " + ext + "<br>";
        sections.videos.count++;
      }
    }
    if (tout != "") sections.videos.out += "<div class='ad_seo_item'>" + tout + "</div>";
  } else {
    // no video link
  }
}

function extract_forms () {
  var forms = $$("form");
  if (forms.length > 0) {
    var forms_list = "";
    for (var i = 0; i < forms.length; i++) {
      var action = forms[i].action;
      var method = forms[i].method;
      var fieldsnum = forms[i].length;
      forms_list += "<tr><td>" + action + "</td><td>" + method + "</td><td>" + fieldsnum + "</td></tr>";
    }
    sections.forms.out += "<table cellspacing=0 class='table'><tr><th><div class='tabletitle'>ACTION</div></th><th><div class='tabletitle'>METHOD</div></th><th><div class='tabletitle'>FIELDS</div></th></tr>" + forms_list + "</table>";
    sections.forms.count = 1;
  }
}

function extract_iframes () {
  var iframes = document.querySelectorAll("iframe");
  if (iframes.length > 0) {
    var iframes_list = "";
    for (var i = 0; i < iframes.length; i++) {
      iframes_list += `
        <tr>
          <td>
            <a href="${iframes[i].src}" class="cont_link" target="_blank"><span>${iframes[i].src}</span></a>
          </td>
          <td>${iframes[i].width}</td>
          <td>${iframes[i].height}</td>
          <td>${iframes[i].loading}</td>
          <td>${iframes[i].allowFullscreen}</td>
        </tr>
      `;
    }
    sections.iframes.out += `
      <table cellspacing=0 class='table'>
        <tr>
          <th><div class='tabletitle'>SRC</div></th>
          <th><div class='tabletitle'>WIDTH</div></th>
          <th><div class='tabletitle'>HEIGHT</div></th>
          <th><div class='tabletitle'>LOADING</div></th>
          <th><div class='tabletitle'>ALLOWFULLSCREEN</div></th>
        </tr>
        ${iframes_list}
      </table>
      `;
    sections.iframes.count = 1;
  }
}

function extract_html () {

  // OVERVIEW

  var wout = "";
  sections.html.out += "<div class='ad_seo_item values_list'>";

  function checkAndShow (tagName) {
    var count = $$(tagName).length;
    if (count > 0) {
      sections.html.out += show_item(`&lt;${tagName}&gt;`, count, false) + "<br>";
    } else {
      if (tagName == "html") {
        wout += show_warning(`missing${tagName}tag`);
        sections.html.warnings++;
      }
    }
  }

  // Usage of the helper function
  checkAndShow("html");
  checkAndShow("img");
  checkAndShow("iframe");
  checkAndShow("canvas");
  checkAndShow("table");
  checkAndShow("form");

  sections.html.out += "</div>";
  sections.html.out = wout + sections.html.out;
  sections.html.count = 1;

  // OBSOLETE TAGS

  var obsolete_tags = $$("acronym,applet,basefont,big,center,dir,font,frame,frameset,strike,tt,isindex,listing,xmp,noembed,plaintext,blink,marquee,s,spacer,u");
  var obsolete_tags_num = obsolete_tags.length;
  if (obsolete_tags_num > 0) {
    var tags = {};

    for (var i = 0; i < obsolete_tags_num; i++) {
      ot = obsolete_tags[i].nodeName;
      if (tags[ot] == undefined) {
        tags[ot] = {
          cnt: 0
        };
      }
      tags[ot].cnt = tags[ot].cnt + 1;
    }
    sections.obsolete.out += "<div class='ad_seo_item values_list'>";
    for (const property in tags) {
      sections.obsolete.out += show_item(`&lt;${property.toLowerCase()}&gt;`, tags[property].cnt, false) + "<br>";
    }
    sections.obsolete.out += "</div>";
  }


  // REPORT

  var html5_tags = $$("article,aside,audio,bdi,canvas,command,datalist,details,figcaption,figure,footer,header,hgroup,keygen,main,mark,meter,nav,output,progress,rp,rt,ruby,section,source,summary,time,track,video").length;

  var html5_score;
  sections.html5report.out += "<div class='ad_seo_item'>{{doctypeis}} ";
  if (page.doctype == "<!DOCTYPE html>") {
    sections.html5report.out += "HTML5,";
    html5_score = 3;
  } else {
    sections.html5report.out += "{{nothtml5}},";
    html5_score = 1;
  }
  if (html5_tags > 0) {
    sections.html5report.out += " {{html5tags}}";
    if (obsolete_tags_num > 0) {
      sections.html5report.out += ", {{html4tags}}.";
      html5_score += 1;
    } else {
      sections.html5report.out += " {{noobsoletetags}}.";
      html5_score += 2;
    }
  } else {
    sections.html5report.out += " {{nohtml5tags}}";
    if (obsolete_tags_num > 0) {
      sections.html5report.out += " {{html4tags}}.";
      html5_score -= 1;
    } else {
      sections.html5report.out += ", {{noobsoletetags}}.";
    }
  }

  // console.log("html5_score", html5_score)

  sections.html5report.out += "<br>";
  for (i = 1; i <= 5; i++) {
    if (i <= html5_score) {
      sections.html5report.out += "<span class='stars-good'>&starf;</span>";
    } else {
      sections.html5report.out += "<span class='stars-bad'>&starf;</span>";
    }
  }
  sections.html5report.out += "</div>";
  sections.html5report.count = 1;

}

function extract_anchors () {
  var anchors = $$("a");
  var out_anchors_videos = "";
  var anchors_list_internal = "";
  var anchors_list_external = "";
  var anchors_list_other = "";
  var anchors_list_internal_count = 0;
  var anchors_list_external_count = 0;
  var anchors_list_other_count = 0;
  var anchors_missing_text = 0;

  if (anchors.length > 0) {

    for (var i = 0; i < anchors.length; i++) {
      var anchor_item = "";
      var href = anchors[i].href;
      var url = url2domain(href);

      if (url) {

        if (href.baseVal != null) href = href.baseVal; // is SVGAnimatedString
        var ext = href.slice((href.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase(); // https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504

        if (video_extensions.includes(ext)) {
          // ???
          out_anchors_videos += "link <a class='item' href='" + href + "'>" + url2domain(href).url + "</a><br>";
          sections.videos.count++;
        }

        var anchor_rel = anchors[i].rel;

        var is_internal = (page.host == url.host);

        // if (page.protocol != url.protocol) {
        //   console.log("protocol mismatch");
        // }

        var has_image = (anchors[i].querySelectorAll("img, svg").length > 0);
        var anchor_text = escapeHtml(anchors[i].textContent.trim());
        var has_text = (anchor_text != "");
        var anchor_title = anchors[i].getAttribute('title');

        anchor_item = "<tr><td style='width:50%'><a class='cont_link' href='" + href + "'><span>" + href + "</span></a></td><td class='keepwords'>" + anchor_rel + "</td><td " + (!has_text && !has_image ? " class='bg_warning' title='missing text or image' " : "") + ">" + (has_text ? anchor_text : "") + "</td><td>" + (anchor_title ? anchor_title : "") + "</td><td class='nowrap'>" + (has_image ? "yes" : "") + "</td></tr>";

        if (!has_text && !has_image) {
          anchors_missing_text++;
        }

        if (is_internal) {
          anchors_list_internal += anchor_item;
          anchors_list_internal_count++;
        } else {
          if (other_protocols.includes(url.protocol)) {
            anchors_list_other += anchor_item;
            anchors_list_other_count++;
          } else {
            anchors_list_external += anchor_item;
            anchors_list_external_count++;
          }

        }
      }

    }

    if (anchors_missing_text) {
      // updated
      show_warning(
        anchors_missing_text + " links without anchor text or image",
        "The anchor text should be relevant to the page you're linking to.",
        "",
        "anchors"
      );
    }

    if (anchors_list_internal || anchors_list_external || anchors_list_other) {

      if (anchors_list_internal_count + anchors_list_external_count > 100) {
        sections.anchors.out += show_info("{{info_toomanyanchors}}", "{{tip_toomanyanchors}}", ["fix it", `https://www.omiod.com/meta-seo-inspector/seo-tips.php?too-many-anchors${utm_link}`]);
      }

      sections.anchors.out += "<div class='ad_seo_item'><span class='item'>{{internal}}</span>&nbsp;<span class='item_count'>(" + anchors_list_internal_count + ")</span> - <span class='item'>{{external}}</span>&nbsp;<span class='item_count'>(" + anchors_list_external_count + ")</span> - <span class='item'>{{other}}</span>&nbsp;<span class='item_count'>(" + anchors_list_other_count + ")</span></div>";

      sections.anchors.out += "<div class='ad_seo_item'><table cellspacing=0 width='100%' class='table'>";
      if (anchors_list_internal) {
        sections.anchors.out += "<tr><th><div class='tabletitle uc'>{{internal}}</div>URL</th><th>REL</th><th>TEXT</th><th>TITLE</th><th>IMG</th></tr>" + anchors_list_internal;
      }
      if (anchors_list_external) {
        sections.anchors.out += "<tr><th><div class='tabletitle uc'>{{external}}</div>URL</th><th>REL</th><th>TEXT</th><th>TITLE</th><th>IMG</th></tr>" + anchors_list_external;
      }
      if (anchors_list_other) {
        sections.anchors.out += "<tr><th><div class='tabletitle uc'>{{other}}</div>URL</th><th>REL</th><th>TEXT</th><th>TITLE</th><th>IMG</th></tr>" + anchors_list_other;
      }
      sections.anchors.out += "</table></div>";
    } else {
      sections.anchors.out += show_info("No linked pages are found", "This page is a dead end for bots and crawlers.");
      sections.anchors.info++;
    }
    sections.anchors.count = 1;


  } else {
    // no anchors
  }

}

function just_domain (url) {
  if (url == undefined) return "";
  var domainParts = url.split('.');
  while (domainParts.length > 2) {
    domainParts.shift();
  }
  return domainParts.join('.');
}

function extract_internalr () {
  var list = $$("script[src]");
  var info = "";
  var cnt = 0;

  for (var i = 0; i < list.length; i++) {
    if (list[i].src != undefined) {

      var src = list[i].src.toLowerCase();
      var srcd = src.split('/')[2];
      var domain = just_domain(srcd);
      var pagedomain = just_domain(page.host);

      if (domain == pagedomain) {
        sections.internalr.out += `<tr><td style='width:100%'><a href='${src}' target='_blank'>${src}</a></td>`;
        sections.internalr.out += "</tr>";
        cnt++;
        if (src.indexOf("/plugins/woocommerce/") != -1) {
          page.features.cms.woocommerce = true;
        }
        if (src.indexOf("/magento/") != -1) {
          page.features.cms.magento = true;
        }
      }
    }
  }

  if (cnt > 8) {
    info += show_inline_info("{{info_intresources_limit}}", "{{tip_intresources_limit}}");
  }

  if (sections.internalr.out) {
    sections.internalr.out = `
      <div class='ad_seo_item'>
        ${cnt} {{${cnt > 1 ? 'items' : 'item'}}} ${info}
      </div>
      <div class='ad_seo_item'><table class='flat'>${sections.internalr.out}</table></div>
    `;
  }

}

function extract_externalr () {
  // console.log("@extract_externalr");
  var scripts = 0;
  var ll = {};
  var list = $$("script[src^=http]");

  for (var i = 0; i < list.length; i++) {
    if (list[i].src != undefined) {

      var src = list[i].src.toLowerCase();
      var srcd = src.split('/')[2];

      if (srcd != page.host) {
        if (ll[srcd] == undefined) {
          var srv = url2service(srcd, just_domain(page.host));
          ll[srcd] = {
            cnt: 0,
            type: (srv.type ? srv.type.toUpperCase() : ""),
            more: srv.more
          };
        }
        ll[srcd].cnt = ll[srcd].cnt + 1;

        scripts++;
      } else {
        // console.log ("internal", srcd);
      }
    }
  }

  function compare (a, b) {
    if (a.type < b.type) {
      return -1;
    }
    if (a.type > b.type) {
      return 1;
    }
    return 0;
  }

  if (scripts > 0) {

    var lll = [];
    for (i in ll) {
      lll.push({
        domain: i,
        cnt: ll[i].cnt,
        type: ll[i].type,
        more: ll[i].more
      });
    }

    sections.externalr.out += "<div class='ad_seo_item'><table class='flat'>";

    lll.sort(compare);
    var cnt = 0;
    for (r = 0; r < lll.length; r++) {

      if (lll[r].type != "INTERNAL") {
        sections.externalr.out += `<tr ${r > 0 && lll[r].type != lll[r - 1].type ? " class='trseparator'" : ""}><td style='width:40%'><img class='favicon' src='http://www.google.com/s2/favicons?domain=${lll[r].domain}'><span class='attr_name'>${lll[r].domain}</span>`;
        sections.externalr.out += "</td>";
        sections.externalr.out += "<td>";
        if (lll[r].cnt > 1) sections.externalr.out += "<span class='item_count'>(" + lll[r].cnt + ")</span>";
        sections.externalr.out += "<td>";

        sections.externalr.out += "<td><b style='display:inline-block; font-size:85%; width:8em'>";
        sections.externalr.out += lll[r].type || "<span class='item_count'>n.a.</span>";
        sections.externalr.out += "</b>";
        sections.externalr.out += "</td>";

        sections.externalr.out += "<td>";
        if (lll[r].more) {
          sections.externalr.out += " <span class='small-text'>" + lll[r].more + "</span>";
        }
        sections.externalr.out += "</td>";
        sections.externalr.out += "</tr>";

        if (lll[r].type == "CMS") {
          sections.cms.out += show_element(lll[r].domain, lll[r].more);
        }
        cnt++;
      }

    }
    sections.externalr.out += "</table></div>";
    sections.externalr.count = 1;

    sections.externalr.out = `
      <div class='ad_seo_item'>
        ${cnt} {{${cnt > 1 ? 'items' : 'item'}}}
      </div>${sections.externalr.out}
    `;
  }

}

function extract_microdata () {
  var tout = "";
  var ll = [];
  var list = $$("[itemprop],[itemprop-reverse]");
  for (var i = 0; i < list.length; i++) {

    var prop_name;
    for (var attrs = 0; attrs < list[i].attributes.length; attrs++) {
      prop_name = list[i].attributes[attrs].name;
      if (prop_name == "itemprop" || prop_name == "itemtype" || prop_name == "itemprop-reverse") {
        prop_name += ":" + list[i].attributes[attrs].value;
        if (ll[prop_name] == undefined) ll[prop_name] = 0;
        ll[prop_name] = ll[prop_name] + 1;
      }
    }
  }
  for (i in ll) {
    tout += "<span class='item'>" + i + "</span>&nbsp;<span class='item_count'>(" + ll[i] + ")</span><br>";
  }

  if (tout != "") {
    sections.structureddata_microdata.out = "<div class='ad_seo_item values_list'>" + tout + "</div>";
    sections.structureddata_microdata.count = 1;
  }
}

function extract_presentation () {
  if (!checklist["theme-color"]) {
    sections.presentation.out = show_info("{{info_missingthemecolor}}", "{{tip_missingthemecolor}}") + sections.presentation.out;
    sections.presentation.info++;
  }
  if (!page.checklist["apple-touch-icon"] && !page.checklist["apple-touch-icon-precomposed"]) {
    sections.presentation.out = show_info("{{info_appletouch}}", "{{tip_appletouch}}") + sections.presentation.out;
    sections.presentation.info++;
  }
}

function extract_jsonLD () {
  var jtout = [];
  list = $$('script[type="application/ld+json"]');

  for (i = 0; i < list.length; i++) {
    sections.structureddata_jsonld.out += "<div class='ad_seo_item values_list flex-direction-column'>";
    var jtmp;
    try {
      var rawjson = list[i].innerHTML.replace(/(\r\n|\n|\r)/gm, "");
      jtmp = JSON.parse(rawjson);
      var jld = traverse(jtmp);
      var jlhtml = jld[1];
      if (jlhtml == "") {
        sections.structureddata_jsonld.out += `<p>{{empty}}</p>`
      } else {
        sections.structureddata_jsonld.out += jlhtml;
      }


    } catch (e) {
      sections.structureddata_jsonld.out += "found, but couldn't get @type<br>";
      jtout.push({ 'type': 'unknown' });
    }

    sections.structureddata_jsonld.out += "</div>";
    sections.structureddata_jsonld.count = 1;
  }
  jout.jsonld = jtout;
}

function extract_microformats () {
  var mf_hreview = $$(".hreview").length;
  var mf_hcard = $$(".fn").length;
  var mf_hcalendar = $$(".dtstart").length;
  mf_hcalendar += $$(".vcalendar").length;
  var mf_vcard_o = $$(".vcard");
  var mf_vcard = mf_vcard_o.length;
  var mf_vevent = $$(".vevent").length;
  var mf_xfolkentry = $$(".xfolkentry").length;
  var mf_tot = mf_hreview + mf_hcard + mf_hcalendar + mf_vcard + mf_vevent + mf_xfolkentry;

  tout = "";
  if (mf_tot > 0) {
    tout += "<div class='ad_seo_item'>";
    if (mf_hreview > 0) tout += "<span class='item'>hReview</span> <span class='item_count'>(" + mf_hreview + ")</span> ";
    if (mf_hcard > 0) tout += "<span class='item'>hCard(fn)</span> <span class='item_count'>(" + mf_hcard + ")</span> ";
    if (mf_hcalendar > 0) tout += "<span class='item'>hCalandar</span> <span class='item_count'>(" + mf_hcalendar + ")</span> ";
    if (mf_vcard > 0) {
      tout += "<span class='item'>vCard</span> <span class='item_count'>(" + mf_vcard + ")</span> ";
    }
    if (mf_vevent > 0) tout += "<span class='item'>vEvent</span> <span class='item_count'>(" + mf_vevent + ")</span> ";
    if (mf_xfolkentry > 0) tout += "<span class='item'>xFolk</span> <span class='item_count'>(" + mf_xfolkentry + ")</span> ";
    tout += "</div>";
  }
  if (tout != "") {
    sections.structureddata.out += show_section("MICROFORMAT", "structureddata-micro", tout);
  }
}

function extract_jsondata () {
  console.log("@extract_jsondata")

  var scripts = document.querySelectorAll('script[type="application/json"],script[type="application/ld+json"]');
  if (scripts.length > 0) {
    let out = "";
    scripts.forEach(function (script, idx) {
      // console.log("script id", script.id)
      if (script.id) {
        out += `script ${idx} id:${script.id}<br>`
      } else {
        out += `script ${idx} no id<br>`
      }
      try {
        let json = JSON.parse(script.textContent || script.innerHTML);
        // Escape HTML in the JSON string output
        function escapeHtml (str) {
          return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        }
        let jsonStr = JSON.stringify(json, null, 2);
        out += `<div class='ad_seo_item'><pre>${escapeHtml(jsonStr)}</pre></div>`;
      } catch (e) {
        out += `<div class='ad_seo_item'><span class='bg_warning'>Invalid JSON in script #${idx + 1}</span>${script.textContent || script.innerHTML}</div>`;
      }
    });
    sections.jsondata.out = out;
    sections.jsondata.count = scripts.length;
  }

}

function extract_localstorage () {

  let keys = Object.keys(localStorage);
  let out = "";
  let cnt = 0

  // Loop through keys and display values
  keys.forEach(function (key) {
    var value = localStorage.getItem(key);
    let l = value.length
    if (l > 1024) {
      value = value.substring(0, 1024) + ` ... ${l} bytes`;
    }
    cnt++
    out += `
      <tr>
        <td class='attr_name' style='width:25%'>${key}</td>
        <td class='small-text'>${value}</td>
      </tr>
    `;
  });

  if (cnt > 0) {
    sections.localstorage.out = "<div class='ad_seo_item'><table class='flat'>";
    sections.localstorage.out += out;
    sections.localstorage.out += "</table></div>";
    sections.localstorage.count = 1;

    sections.localstorage.out = `
      <div class='ad_seo_item'>
        ${cnt} {{${cnt > 1 ? 'items' : 'item'}}}
      </div>${sections.localstorage.out}
    `;
  }
}

function extract_rdfa () {
  var rdf_review = $$("[typeof~='v:review'],[typeof~='v:Review']").length;
  var rdf_summary = $$("[property~='v:summary'],[property~='v:Summary']").length;
  var rdf_itemrev = $$("[property~='v:itemreviewed'],[property~='v:Itemreviewed']").length;
  var rdf_tot = rdf_review + rdf_summary + rdf_itemrev;

  tout = "";
  if (rdf_tot > 0) {
    tout += "<div class='ad_seo_item'>";
    if (rdf_review > 0) tout += "<span class='item'>review</span> <span class='item_count'>(" + rdf_review + ")</span> ";
    if (rdf_summary > 0) tout += "<span class='item'>summary</span> <span class='item_count'>(" + rdf_summary + ")</span> ";
    if (rdf_itemrev > 0) tout += "<span class='item'>item reviewed</span> <span class='item_count'>(" + rdf_itemrev + ")</span> ";
    tout += "</div>";
  }
  if (tout != "") {
    sections.structureddata.out += "<div class='container' data-section='structureddata-rdfa2'>";
    sections.structureddata.out += "<div class='ad_seo_title' data-toggle='structureddata-rdfa2'>RDFa</div>" + tout;
    sections.structureddata.out += "</div>";
  }
}

function _domain_link (urlobj, fullurl, empty = "") {
  if (urlobj) {
    if (fullurl != "") {
      return `<a class='cont_link' href='${fullurl}'><span>${urlobj.url}</span></a>`
    } else {
      return `${urlobj.url}`
    }
  } else {
    return empty
  }
}

function _tag_info (tag) {
  // console.dir(tag)
  switch (tag.tagName) {
    case 'META':
      if (tag.attributes.charset) {
        return { priority: 100, type: "charset" }
      } else if (tag.name == "viewport") {
        return { priority: 100, type: "viewport" }
      } else if (tag.httpEquiv) {
        return { priority: 100, type: "httpEquiv" }
      } else {
        let name
        if (tag.name) {
          name = tag.name
        } else if (tag.attributes.property) {
          name = `propery ${tag.attributes.property.nodeValue}`
        } else if (tag.attributes.itemprop) {
          name = `itemprop ${tag.attributes.itemprop.nodeValue}`
        }
        return { priority: 5, type: name }
      }
      break
    case "LINK": {
      let urlobj = url2domain(tag.href)
      if (tag.rel == "preconnect") {
        return { priority: 90, type: `preconnect ${_domain_link(urlobj, "")}` }
      } else if (tag.rel == "stylesheet") {
        return { priority: 40, type: `stylesheet ${_domain_link(urlobj, tag.href)}` }
      } else if (tag.rel == "preload") {
        return { priority: 30, type: `preload ${_domain_link(urlobj, tag.href)}` }
      } else {
        return { priority: 5, type: `${tag.rel} ${_domain_link(urlobj, tag.href)}` }
      }
      break
    }
    case "BASE":
      let urlobj = url2domain(tag.href)
      return { priority: 90, type: `${_domain_link(urlobj, tag.href)}` }
      break
    case "SCRIPT": {
      let urlobj = url2domain(tag.src)
      if (tag.attributes.async) {
        return { priority: 70, type: `async ${_domain_link(urlobj, tag.src, " (inline)")}` }
      } else if (tag.attributes.defer) {
        return { priority: 25, type: `defer ${_domain_link(urlobj, tag.src, " (inline)")}` }
      } else {
        return { priority: 50, type: `sync ${_domain_link(urlobj, tag.src, " (inline)")}` }
      }
      break
    }
    case "STYLE":
      let out = ""
      for (var i = 0, atts = tag.attributes; i < atts.length; i++) {
        if (atts[i].nodeValue) {
          out += atts[i].nodeValue + " ";
        } else {
          out += atts[i].nodeName + " ";
        }
      }
      return { priority: 40, type: out }   // same as stylesheet
      break
    case "TITLE":
      return { priority: 95, type: "" }
      break
    case "TEMPLATE":
    case "NOSCRIPT":
      return { priority: 10, type: "" }
      break
    default:
      return { priority: 0, type: "" }
  }

}

function extract_head () {
  const head = document.querySelector("head")
  const headChildren = Array.from(head.children);
  let rows = ""
  let priority = 999
  for (tag of headChildren) {
    let taginfo = _tag_info(tag)
    if (taginfo.priority !== 5) {
      let info = ""
      if (taginfo.priority !== 1 && priority < taginfo.priority) {
        if (taginfo.priority >= 90) {
          info += show_inline_info("{{info_headtag_above_primary}}", "{{tip_headtag_above_primary}}")
          sections.head.info++;
        } else {
          info += show_inline_info("{{info_headtag_above_secondary}}", "{{tip_headtag_above_secondary}}")
          sections.head.info++;
        }
      }
      if (taginfo.priority === 0) {
        info += show_inline_info("{{info_headtag_wrongtype}}")
        sections.head.info++;
      }
      rows += `
        <tr>
          <td style='width:10%; word-break: normal;'>${tag.tagName}</td>
          <td style='width:33%'>${taginfo.type}</td>
          <td style='width:10%;'>${taginfo.priority !== 1 ? taginfo.priority : "-"}</td>
          <td style=''>${info}</td>
        </tr>
      `
      priority = taginfo.priority
    }
  }

  if (rows) {
    sections.head.out = `
      <div class='ad_seo_item'>
        <table cellspacing=0 class='table'>
        <tr><th>TAG</th><th>CONTENT</th><th>PRIORITY</th><th></th></tr>
        ${rows}
        </table>
      </div>
    `
  }

}