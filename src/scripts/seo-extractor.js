"use strict";

var old_console_log = console.log;
var old_console_dir = console.dir;
console.log = function () { };
console.dir = function () { };
chrome.storage.sync.get(['debugmode'], function (result) {
  if (!result.debugmode) {
    console.log = function () { };
    console.dir = function () { };
  } else {
    console.log = old_console_log;
    console.dir = old_console_dir;
  }
});

// MV3

// called from background or tab
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    // console.log("MSI3 content - received message", request)
    if (request.action == "pageInfo") {
      var pageData = getPageData(request);
      sendResponse(pageData);
    }
    if (request.action == "getLinks") {
      var links = [];
      var seen = new Set();
      
      function getLinkClassification(url) {
        if (!url || url.trim() === "") {
          return { type: "non-link", absoluteUrl: "" };
        }
        url = url.trim();
        if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("javascript:") || url.startsWith("sms:") || url.startsWith("#")) {
          return { type: "non-link", absoluteUrl: url };
        }
        if (url.startsWith("data:") || url.startsWith("blob:")) {
          return { type: "non-link", absoluteUrl: url };
        }
        try {
          var absoluteUrl = new URL(url, window.location.href).href;
          var pageOrigin = window.location.origin;
          var parsed = new URL(absoluteUrl);
          if (parsed.origin === pageOrigin) {
            return { type: "internal", absoluteUrl: absoluteUrl };
          } else {
            return { type: "external", absoluteUrl: absoluteUrl };
          }
        } catch (e) {
          return { type: "non-link", absoluteUrl: url };
        }
      }

      function addLink(url, tag, category) {
        if (!url) return;
        var classification = getLinkClassification(url);
        var key = classification.absoluteUrl;
        if (!seen.has(key)) {
          seen.add(key);
          links.push({
            url: classification.absoluteUrl,
            original: url,
            tag: tag,
            category: category,
            type: classification.type
          });
        }
      }

      // 1. Navigation
      var anchors = document.querySelectorAll("a, area");
      for (var i = 0; i < anchors.length; i++) {
        var href = anchors[i].getAttribute("href");
        if (href) addLink(href, anchors[i].tagName.toLowerCase(), "navigation");
      }

      // 2. Assets & Layout
      var imgs = document.querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) {
        var src = imgs[i].getAttribute("src");
        if (src) addLink(src, "img", "assets");
      }
      var scripts = document.querySelectorAll("script");
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute("src");
        if (src) addLink(src, "script", "assets");
      }
      var relLinks = document.querySelectorAll("link");
      for (var i = 0; i < relLinks.length; i++) {
        var rel = (relLinks[i].getAttribute("rel") || "").toLowerCase();
        var href = relLinks[i].getAttribute("href");
        if (href) {
          if (rel.includes("stylesheet")) {
            addLink(href, "link [stylesheet]", "assets");
          } else if (rel.includes("icon") || rel.includes("apple-touch-icon")) {
            addLink(href, "link [icon]", "assets");
          }
        }
      }
      var iframes = document.querySelectorAll("iframe");
      for (var i = 0; i < iframes.length; i++) {
        var src = iframes[i].getAttribute("src");
        if (src) addLink(src, "iframe", "assets");
      }
      var media = document.querySelectorAll("source, video, audio");
      for (var i = 0; i < media.length; i++) {
        var src = media[i].getAttribute("src");
        if (src) addLink(src, media[i].tagName.toLowerCase(), "assets");
      }
      if (typeof getBgImgs === "function") {
        try {
          var bgImgs = getBgImgs(document);
          for (var i = 0; i < bgImgs.length; i++) {
            addLink(bgImgs[i], "css-background", "assets");
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 3. SEO Metadata
      for (var i = 0; i < relLinks.length; i++) {
        var rel = (relLinks[i].getAttribute("rel") || "").toLowerCase();
        var href = relLinks[i].getAttribute("href");
        if (href && (rel === "canonical" || rel === "alternate" || rel === "next" || rel === "prev")) {
          addLink(href, "link [rel=" + rel + "]", "seo");
        }
      }
      var metas = document.querySelectorAll("meta");
      for (var i = 0; i < metas.length; i++) {
        var property = (metas[i].getAttribute("property") || "").toLowerCase();
        var name = (metas[i].getAttribute("name") || "").toLowerCase();
        var content = metas[i].getAttribute("content");
        if (content && (content.startsWith("http://") || content.startsWith("https://") || content.startsWith("/") || content.startsWith("./") || content.startsWith("../"))) {
          if (property === "og:url" || property === "og:image" || property === "og:video") {
            addLink(content, "meta [property=" + property + "]", "seo");
          } else if (name === "twitter:url" || name === "twitter:image") {
            addLink(content, "meta [name=" + name + "]", "seo");
          }
        }
      }

      sendResponse({ links: links });
    }
    if (request.action == "showElement") {
      let id = request.value;
      if (elements[id]) {
        // console.dir(elements[id]);
        elements[id].scrollIntoView({ behavior: "smooth", block: "center" });

        var alreadySelected = document.querySelector(".MSI_show_element");
        if (alreadySelected) alreadySelected.classList.remove("MSI_show_element");
        elements[id].classList.add("MSI_show_element");

      } else {
        console.log("element not found");
      }
    }
  }
);

// from MSI

function clean_sections () {
  return {
    "common": {
      "warnings": 0,
      "info": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "hreflang": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "head": {
      "warnings": 0,
      "info": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "opengraph": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "twitter": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "pinterest": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "headers": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "externalr": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "internalr": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "videos": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "html": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "security": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "geo": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "social": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": [],
      "isContainer": true
    },
    "largeimages": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "images": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "bgimages": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "media": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": [],
      "isContainer": true
    },
    "markup": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": [],
      "isContainer": true
    },
    "html5report": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "mobile": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "svg": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "presentation": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "cms": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "links": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "rhints": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "structureddata": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": [],
      "isContainer": true
    },
    "structureddata_jsonld": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "structureddata_microdata": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "structureddata_other": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "anchors": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "forms": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "iframes": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "localstorage": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "jsondata": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "obsolete": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "verification": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    },
    "other": {
      "warnings": 0,
      "info": 0,
      "count": 0,
      "out": "",
      "warnings_list": [],
      "info_list": []
    }

  };
}

var elements = {};
var page = {};
var sections = {};
var warnings = 0;
var traverse_out = [];
var traverse_html = "";
var traverse_minlevel = null;
var jout = {};

var checklist = { // TODO move in "page"
  'theme_color': false
};

console.log("debug is active");
//

function getPageData (request) {

  // console.log("MS2 CS @getPageData request:", request);

  sections = clean_sections();

  var raw_url = url2domain(location.href);
  page = {
    'url': location.href,
    'host': raw_url.host,
    'protocol': raw_url.protocol,
    'opengraph': {
      'title': 0,
      'type': 0,
      'url': 0,
      'image': 0,
      'description': 0,
      'appid': 0
    },
    'checklist': {
      'apple-touch-icon': false,
      'apple-touch-icon-precomposed': false,
      'canonical_outside_head': false,
      'canonical_same_as_url': false,
      'canonical_multiple': false,
      'has_description': false
    },
    'hreflang': [],
    'features': {
      cms: {}
    }
  };

  if (document.doctype) {
    page.doctype = new XMLSerializer().serializeToString(document.doctype);
  } else {
    page.doctype = "";
  }

  page.contenttype = document.contentType;
  page.lang = document.documentElement.lang;

  var out = "";
  var outextra = "";
  var tout;
  var dotName;

  warnings = 0;

  var i;
  var tip_media_cnt = 0;

  var keys = 0;
  var desclen = 0;
  var tout_verification = "";

  extract_links();

  extract_hreflang();

  extract_common();

  extract_head();

  var list = $$("meta");

  for (i = 0; i < list.length; i++) {
    tout = "";
    var content;

    var meta_name = list[i].getAttribute("name");
    var meta_property = list[i].getAttribute("property");
    var meta_content = list[i].getAttribute("content");
    var meta_itemprop = list[i].getAttribute("itemprop");

    if (meta_name) meta_name = meta_name.toLowerCase();
    if (meta_property) meta_property = meta_property.toLowerCase();
    if (meta_content) meta_content = meta_content;
    if (meta_itemprop) meta_itemprop = meta_itemprop.toLowerCase();

    var contentNull;
    if (meta_content != null) {
      contentNull = false;
      meta_content = meta_content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else {
      contentNull = true;
      meta_content = "";
    }
    content = escapeHtml(meta_content).trim();

    if (meta_name != null) {
      tout += "<a href='http://www.omiod.com/meta-seo-inspector/meta-info.php?meta=" + meta_name + `${utm_link}&utm_term=` + meta_name + "' title='more about " + meta_name + "' target='_blank' class='attr_link'><span>" + meta_name + "</span></a>";
      tout += " <span class='content'>" + meta_content + "</span>";

      tout += "<button class='ccopy focus-ripple' data-action='copy' data-bs-toggle='tooltip' data-bs-title='copy to clipboard' data-tippy-delay='[500,0]'></button>"

      if (contentNull) {
        tout += show_inline_info("{{notdefined}}");
        if (list[i].getAttribute("value") != null) tout += show_inline_info("{{invalidvalue}}");
      } else {
        if (content == "") {
          tout += show_inline_info("{{empty}}");
        }
      }

      if (meta_name == "description" && !contentNull) {
        desclen = decodeHtml(meta_content).trim().length;

        if (desclen > 0) tout += " <span class='item_count'>(" + desclen + " {{characters}})</span>";
        if (desclen <= 50 && desclen > 0) {
          tout += show_inline_info("{{descriptiontooshort}}");
          sections.common.info++;
        }
        if (desclen == 0) {
          tout += show_inline_warning("{{missingdescription}}");
          sections.common.warnings++;
        }
        if (desclen > 170) {
          tout += show_inline_warning("{{descriptiontoolong}}", "Google SERP descriptions should be between 150 and 170 characters (2019)");
          sections.common.warnings++;
        }
        page.checklist.has_description = true;
      }

      if (meta_name == "keywords") {
        if (content.length > 0) {
          keys = content.split(',');
          tout += " <span class='item_count'>( " + keys.length + "&nbsp;{{items}} )</span>";
        } else {
          keys = "";
          tout += " <span class='item_count'>({{empty}})</span>";
        }
        tout += show_inline_info("{{keywordsuseless}}");
        sections.common.info++;
      }

      // not used
      if (meta_name == "robots") {
        page.robots = content;
      }

      if (meta_name == "geo.position" || meta_name == "geo.placename" || meta_name == "icbm") {
        tout += " <a href='https://maps.google.com/maps?q=" + content.replace(/;/g, ",") + "' class='cont_link'><img src='http://www.google.com/s2/favicons?domain=maps.google.com'></a>";
      }

    } else if (meta_property != null) {
      tout += "property <a href='http://www.omiod.com/meta-seo-inspector/meta-info.php?meta=" + meta_property + "&cont=" + content + "' title='more about " + meta_property + "' target='_blank' class='attr_link'><span>" + meta_property + "</span></a>";
      tout += " ";

      if (content != "") {
        if (content.substr(0, 4) == "http") {
          if (content.match(/^.+\.(jpe?g|bmp|png|gif|svg|webp)$/i)) {
            tout += "<img src='" + content + "' id='media_" + tip_media_cnt + "'>";
          }
          // tout += "<a href='" + content + "' target='_blank' class='cont_link' data-tipped-options=\"inline: 'media_" + tip_media_cnt + "'\" >";
          tout += `<a href='${content}' target='_blank' class='cont_link content'>`;
          tout += content + "</a>";
          tip_media_cnt++;
        } else {
          tout += `<span class="content">${content}</span>`;
        }

      } else {
        tout += "<span class='ad_seo_details'>" + show_inline_warning("{{empty}}") + "</span>";
      }

    } else if (meta_itemprop != null) {

      // console.warn("meta_itemprop != null");

    } else if (list[i].httpEquiv != "") {
      meta_name = "httpEquiv";
      tout += `<span class='attr_name'>${meta_name}</span> (${list[i].httpEquiv}) `;
      if (content != "") {
        tout += `<span class="content">${content}</span>`;
        if (content.toLowerCase().startsWith("ie=")) {
          tout += "<span class='ad_seo_details'>" + show_inline_info("{{httpequiv_info}}") + "</span>";
        }
      } else {
        tout += "<span class='ad_seo_details'>" + show_inline_warning("{{empty}}") + "</span>";
      }
    } else {
      // console.log("not addressed:", list[i]);
    }

    dotName = "";
    if (meta_name) dotName = meta_name;
    if (meta_property) dotName = meta_property;

    const tmp = getMeta(dotName, content, meta_name, tout)

    tout = tmp.tout
    tout_verification = tmp.tout_verification

  }

  if (!page.checklist.has_description) {
    // sections.common.out = 
    show_warning(
      "{{missingdescription}}",
      "Use this tag to provide a short description of the page. In some situations, this description is used in the snippet shown in search results.",
      ["fix it", `https://www.omiod.com/meta-seo-inspector/meta-info.php?meta=description${utm_link}`],
      "common"
    )// + sections.common.out;
    // sections.common.warnings++;
  }

  // END META

  // from msi
  var out = "";
  out += show_section("{{section_common}}", "common", sections.common.out);
  out += show_section("{{section_hreflang}}", "hreflang", sections.hreflang.out);
  out += show_section("{{section_head}}", "head", sections.head.out);

  // recap OPENGRAPH
  if (sections.opengraph.out != "") {
    if (page.opengraph.title + page.opengraph.type + page.opengraph.url + page.opengraph.image + page.opengraph.description < 5) {
      var tmp = "";
      if (page.opengraph.title == 0) tmp += " og:title ";
      if (page.opengraph.type == 0) tmp += " og:type ";
      if (page.opengraph.url == 0) tmp += " og:url ";
      if (page.opengraph.image == 0) tmp += " og:image ";
      if (page.opengraph.description == 0) tmp += " og:description ";
      tmp += " {{missing}}";
      // updated
      show_warning(
        tmp,
        "these elements could be needed for a proper preview in social sharing",
        ["fix it", `https://www.omiod.com/meta-seo-inspector/seo-tips.php?opengraph${utm_link}`],
        "opengraph"
      );
      // sections.opengraph.warnings++;
      // sections.opengraph.out = tmp + sections.opengraph.out;
    }
    sections.opengraph.count = 1;
  }

  // recap TWITTER
  if (sections.twitter.out != "") {
    sections.twitter.count = 1;
  }

  // recap PINTEREST
  if (sections.pinterest.out != "") {
    sections.pinterest.count = 1;
  }

  // SOCIAL
  sections.social.out += show_section("OPENGRAPH (FaceBook)", "opengraph", sections.opengraph.out);
  sections.social.out += show_section("TWITTER", "twitter", sections.twitter.out);
  sections.social.out += show_section("PINTEREST", "pinterest", sections.pinterest.out);
  sections.social.info = sections.twitter.info + sections.opengraph.info + sections.pinterest.info;
  sections.social.warnings = sections.twitter.warnings + sections.opengraph.warnings + sections.pinterest.warnings;
  sections.social.count = sections.twitter.count + sections.opengraph.count + sections.pinterest.count;
  out += show_section("SOCIAL", "social", sections.social.out);

  // SCHEMA GLOBAL

  // JSON/LD

  extract_jsonLD();
  sections.structureddata.out += show_section("JSON-LD", "structureddata_jsonld", sections.structureddata_jsonld.out);

  // MICRODATA

  extract_microdata();

  sections.structureddata.out += show_section("MICRODATA", "structureddata_microdata", sections.structureddata_microdata.out);

  // MICROFORMATS

  extract_microformats();

  // RDFa

  extract_rdfa();

  if (sections.structureddata.out != "") sections.structureddata.out = `<div class='ad_seo_item' style='padding-bottom:8px'>{{info_structured_data}}<br>
    &bull; <a href='https://validator.schema.org/#url=${window.location.href}' target='_blank'>Schema Markup Validator</a><br>
    &bull; <a href='https://search.google.com/test/rich-results?url=${window.location.href}' target='_blank'>Google Rich Results Test</a>
    </div>` + sections.structureddata.out;

  if (sections.structureddata_other.out != "") {
    sections.structureddata.out += show_section(chrome.i18n.getMessage("other").toUpperCase(), "structureddata_other", sections.structureddata_other.out); // lalala
    sections.structureddata_other.count++;
  }

  sections.structureddata.count = sections.structureddata_jsonld.count + sections.structureddata_microdata.count + sections.structureddata_other.count;

  // CLOSE SCHEMA.ORG

  extract_anchors();

  extract_forms();

  extract_iframes();

  // STRUCTURED
  out += show_section("{{section_structureddata}}", "structureddata", sections.structureddata.out);

  // GEO
  out += show_section("GEO", "geo", sections.geo.out);

  // MOBILE
  if (!page.checklist.viewport) {
    sections.mobile.out = show_info(
      "{{missingviewport}}", "{{tip_missingviewport}}", ["fix it", `https://www.omiod.com/meta-seo-inspector/meta-info.php?meta=viewport${utm_link}`]
    ) + sections.mobile.out;
    sections.mobile.info++;
  }
  out += show_section("MOBILE", "mobile", sections.mobile.out);

  extract_headers();

  // HTML ////////////////////////////////////////////

  // extract_images(); (omitted as requested: no img links)
  // extract_bgimages();

  if (request.mode == "full") {
    // only on popup opening 
    extract_externalr();
    extract_internalr();
    extract_video();
    extract_svg();
    extract_localstorage();
    extract_jsondata();
  }

  extract_html();

  extract_presentation();

  // GROUP MEDIA

  var media_out = "";
  // media_out += show_section("BACKGROUND IMAGES", "bgimages", sections.bgimages.out);
  // media_out += show_section("LARGE IMAGES", "largeimages", sections.largeimages.out);
  media_out += show_section("VIDEO AND AUDIO", "videos", sections.videos.out);
  sections.media.info = sections.videos.info;
  sections.media.warnings = sections.videos.warnings;
  sections.media.count = sections.videos.count;

  // GROUP MARKUP

  sections.markup.out += show_section("{{section_htmltags}}", "html", sections.html.out);
  sections.markup.out += show_section("HEADERS", "headers", sections.headers.out);
  sections.markup.out += show_section("{{section_anchors}}", "anchors", sections.anchors.out);
  // sections.markup.out += show_section("{{section_images}}", "images", sections.images.out); (omitted: no img links)
  sections.markup.out += show_section("FORMS", "forms", sections.forms.out);
  sections.markup.out += show_section("IFRAMES", "iframes", sections.iframes.out);
  sections.markup.out += show_section("OBSOLETE", "obsolete", sections.obsolete.out);
  sections.markup.out += show_section("{{section_htmlreport}}", "html5report", sections.html5report.out);
  sections.markup.info = sections.headers.info + sections.html.info + sections.html5report.info + sections.images.info + sections.anchors.info + sections.forms.info + sections.iframes.info;
  sections.markup.warnings = sections.headers.warnings + sections.html.warnings + sections.html5report.warnings + sections.images.warnings + sections.anchors.warnings + sections.forms.warnings + sections.iframes.warnings;
  sections.markup.count = sections.headers.count + sections.html.count + sections.html5report.count + sections.images.count + sections.anchors.count + sections.forms.count + sections.iframes.count;

  // LAST, FEATURES CHECK
  if ('woocommerce' in page.features.cms) {
    sections.cms.out += show_element("(internal resources)", "WooCommerce");
  }
  if ('magento' in page.features.cms) {
    sections.cms.out += show_element("(internal resources)", "Magento");
  }

  // SHOW ALL

  out += show_section("MARKUP", "markup", sections.markup.out);
  out += show_section("LINK", "links", sections.links.out);
  out += show_section("{{section_presentation}}", "presentation", sections.presentation.out);

  outextra += show_section("{{section_externalr}}", "externalr", sections.externalr.out);
  outextra += show_section("{{section_internalr}}", "internalr", sections.internalr.out);
  outextra += show_section("{{section_resourcehints}}", "rhints", sections.rhints.out);
  outextra += show_section("{{section_security}}", "security", sections.security.out);
  outextra += show_section("{{section_siteverification}}", "verification", tout_verification);
  outextra += show_section("CMS", "cms", sections.cms.out);
  outextra += show_section("{{section_inlinesvg}}", "svg", sections.svg.out);
  outextra += show_section("MEDIA", "media", media_out);
  outextra += show_section("{{section_localstorage}}", "localstorage", sections.localstorage.out);
  outextra += show_section("{{section_jsondata}}", "jsondata", sections.jsondata.out);
  outextra += show_section("{{section_othermetadata}}", "other", sections.other.out);

  // END

  out = out.replace(/\{\{(.+?)\}\}/g, function (match, contents, offset, input_string) {
    return (chrome.i18n.getMessage(contents) || "[*?*?*]");
  });

  outextra = outextra.replace(/\{\{(.+?)\}\}/g, function (match, contents, offset, input_string) {
    return (chrome.i18n.getMessage(contents) || "[*?*?*]");
  });

  out = out.replace(/\{\{(.+?)\}\}/g, function (match, contents, offset, input_string) {
    return (chrome.i18n.getMessage(contents) || "[*?*?*]");
  });

  outextra = outextra.replace(/\{\{(.+?)\}\}/g, function (match, contents, offset, input_string) {
    return (chrome.i18n.getMessage(contents) || "[*?*?*]");
  });

  return {
    out: out,
    outextra: outextra,
    warnings: warnings,
    page: page,
    sections: sections
  };
}