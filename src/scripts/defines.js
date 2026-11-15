var video_extensions = ["mp3", "webm"];
var image_extensions = ["gif", "jpg", "jpeg", "png", "webp", "bmp"];
var other_protocols = ["mailto:", "tel:", "ftp:", "javascript:"];

var verifications = {
  "verify-v1": "old Google",
  "google-site-verification": "Google",
  "360-site-verification": "360",
  "majestic-site-verification": "Majestic",
  "sogou_site_verification": "Sogou",
  "y_key": "Yahoo",
  "msvalidate.01": "Bing",
  "alexaverifyid": "Alexa",
  "wot-verification": "WOT",
  "baidu-site-verification": "Baidu",
  "yandex-verification": "Yandex",
  "ahrefs-site-verification": "Ahrefs",
  "p:domain_verify": "Pinterest",
  "bitly-verification": "Bitly",
  "botify-site-verification": "Botify",
  "facebook-domain-verification": "Facebook",
  "fo-verify": "FlexOffers"
};

var utm_link = "&utm_source=MSI_app&utm_medium=info_link";

function isValidHreflangCode (code) {
  if (!code || typeof code !== "string") {
    return { valid: false, reason: "empty" };
  }
  var trimmed = code.trim();
  if (trimmed === "x-default") {
    return { valid: true };
  }
  if (trimmed.includes("_")) {
    return { valid: false, reason: "underscore", suggestion: trimmed.replace(/_/g, "-") };
  }
  if (trimmed.toLowerCase() === "en-uk") {
    return { valid: false, reason: "invalid_country_uk", suggestion: "en-GB" };
  }
  var bcp47Regex = /^[a-z]{2,3}(?:-[A-Za-z]{4})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/;
  if (!bcp47Regex.test(trimmed)) {
    var lower = trimmed.toLowerCase();
    var parts = lower.split("-");
    if (parts.length === 2 && parts[0].length >= 2 && parts[0].length <= 3 && (parts[1].length === 2 || parts[1].length === 3)) {
      var fixed = parts[0] + "-" + parts[1].toUpperCase();
      if (fixed !== trimmed) {
        return { valid: false, reason: "casing", suggestion: fixed };
      }
    }
    return { valid: false, reason: "format" };
  }
  return { valid: true };
}