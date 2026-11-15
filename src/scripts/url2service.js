/* COPY TO V3 */

function url2service (domain, pagehost) {
    var knowns = {
        "code.jquery.com": { type: "dev tools", more: "jQuery CDN" },
        "cdn.weglot.com": { type: "dev tools", more: "site translations" },

        "stats.wp.com": { type: "analytics", more: "Wordpress analytics" },
        "sp.analytics.yahoo.com": { type: "analytics", more: "Yahoo analytics" },
        "analytics.twitter.com": { type: "analytics", more: "Twitter analytics" },

        "optanon.blob.core.windows.net": { type: "privacy", more: "GDPR tool by Microsoft" },

        "instafeed.nfcube.com": { type: "e-commerce", more: "Shopify Instagram feed" },
        "nsg.symantec.com": { type: "e-commerce", more: "Norton Shopping Guarantee" },

        "accounts.google.com": { type: "widgets", more: "Google digital identity" },
        "cse.google.com": { type: "widgets", more: "Google digital identity" },
        "smartlock.google.com": { type: "dev tools", more: "Google login service" },
        "maps.google.com": { type: "dev tools", more: "maps tools by Google" },

        "ajax.googleapis.com": { type: "dev tools", more: "Google" },
        "apis.google.com": { type: "dev tools", more: "Google" },
        "pay.google.com": { type: "e-commerce", more: "Google payments" },
        "adservice.google.com": { type: "advertising", more: "Google Ads" },
        "adservice.google.it": { type: "advertising", more: "Google Ads" },
        "news.google.com": { type: "advertising", more: "Google news network" },

        "bat.bing.com": { type: "advertising", more: "Bing lead tracking" },

        "magento-recs-sdk.adobe.net": { type: "CMS", more: "Magento" },

    };

    var short_knowns = {
        // CDN
        "afcdn.com": { type: "cdn" },
        "akamai.net": { type: "cdn", more: "Akamai CDN service" },
        "akamaihd.net": { type: "cdn", more: "Akamai CDN service" },
        "akamaized.net": { type: "cdn", more: "Akamai CDN service" },
        "amazonaws.com": { type: "cdn", more: "Amazon AWS CDN" },
        "ampproject.org": { type: "cdn", more: "AMP CDN service" },
        "aspnetcdn.com": { type: "cdn", more: "Microsoft CDN service" },
        "azureedge.net": { type: "cdn", more: "Microsoft Azure CDN service" },
        "azurewebsites.net": { type: "cdn", more: "Microsoft Azure CDN service" },
        "bootstrapcdn.com": { type: "cdn", more: "Boostrap CDN" },
        "cbsistatic.com": { type: "cdn", more: "CBS Interactive CDN service" },
        "cdnjquery.com": { type: "cdn", more: "jQuery CDN service" },
        "cloudflare.com": { type: "cdn", more: "Cloudflare CDN service" },
        "fastly.net": { type: "cdn", more: "CDN service" },
        "gstatic.com": { type: "cdn", more: "Google CDN service" },
        "h-cdn.com": { type: "cdn", more: "CDN service" },
        "hearstapps.com": { type: "cdn" },
        "hsappstatic.net": { type: "cdn", more: "HubSpot CDN service" },
        "hubspot.net": { type: "cdn", more: "HubSpot CDN service" },
        "kinstacdn.com": { type: "cdn", more: "Premium CDN service for Worpress" },
        "licdn.com": { type: "cdn", more: "LinkedIn CDN service" },
        "mdpcdn.com": { type: "cdn" },
        "cloudfront.net": { type: "cdn", more: "Amazon CDN service" },
        "media-amazon.com": { type: "cdn", more: "Amazon CDN service" },
        "ssl-images-amazon.com": { type: "cdn", more: "Amazon CDN service" },
        "msecnd.net": { type: "cdn", more: "Microsoft CDN service" },
        "netdna-ssl.com": { type: "cdn" },
        "phncdn.com": { type: "cdn", more: "CDN service" },
        "queue-it.net": { type: "cdn", more: "CDN service" },
        "rawgit.com": { type: "cdn", more: "defunct CDN service" },
        "sfdcstatic.com": { type: "cdn", more: "SalesForce CDN service" },
        "unpkg.com": { type: "cdn" },
        "vimeocdn.com": { type: "cdn", more: "Vimeo CDN service" },
        "wordpress.com": { type: "cdn", more: "Wordpress CDN service" },
        "yimg.com": { type: "cdn", more: "Yahoo CDN service" },
        "ytimg.com": { type: "cdn", more: "YouTube CDN service" },
        "zdassets.com": { type: "cdn", more: "Zendesk CDN service" },
        "hs-scripts.com": { type: "cdn", more: "HubSpot CDN service" },
        "website-files.com": { type: "cdn", more: "" },
        "myshopify.com": { type: "cdn", more: "Shopify CDN" },
        "polyfill-fastly.io": { type: "cdn", more: "CDN" },

        "datadoghq-browser-agent.com": { type: "cdn", more: "Security CDN" },


        // Fonts
        "fontawesome.com": { type: "cdn", more: "fonts CDN" },
        "myfonts.net": { type: "cdn", more: "fonts CDN" },
        "typekit.net": { type: "cdn", more: "fonts CDN by Adobe" },
        "fonts.net": { type: "cdn", more: "fonts CDN by Monotype" },


        // widgets
        "addons.business": { type: "widgets", more: "Shopify widgets" },
        "hsforms.net": { type: "widgets", more: "HubSpot forms" },
        "hubspotfeedback.com": { type: "widgets", more: "HubSpot tools" },

        "apple-mapkit.com": { type: "dev tools", more: "map tools by Apple" },

        "attn.tv": { type: "widgets", more: "Personalised mobile messaging platform" },

        "boldchat.com": { type: "widgets", more: "chat" },
        "crisp.chat": { type: "widgets", more: "customer chat" },
        "gs-chat.com": { type: "widgets", more: "chat" },
        "inq.com": { type: "widgets", more: "chat" },
        "intercom.io": { type: "widgets", more: "chat" },
        "livechatinc.com": { type: "widgets", more: "chat" },
        "salesforceliveagent.com": { type: "widgets", more: "Salesforce chat" },
        "tawk.to": { type: "widgets", more: "chat" },
        "freshchat.com": { type: "widgets", more: "chat by Freshworks" },

        "disqus.com": { type: "widgets", more: "Social comments" },
        "disquscdn.com": { type: "widgets", more: "Social comments" },
        "flipboard.com": { type: "widgets", more: "A newsreader aggregator and digital magazine tool" },
        "hextom.com": { type: "widgets", more: "Shopify widgets" },
        "hulkapps.com": { type: "widgets", more: "Shopify widgets" },
        "kiwishopapps.com": { type: "widgets", more: "Shopify widgets" },
        "zooomyapps.com": { type: "widgets", more: "Shopify widgets" },
        "kiwisizing.com": { type: "widgets", more: "Size picker for Shopify" },
        "lucidapps.nz": { type: "widgets", more: "Shopify widgets" },
        "pushowl.com": { type: "widgets", more: "Push notification for Shopify" },
        "shopiapps.in": { type: "widgets", more: "Shopify widgets" },
        "trustpilot.com": { type: "widgets", more: "reviews widget" },
        "judge.me": { type: "widgets", more: "reviews widget for Shopify" },
        "yappaapp.com": { type: "widgets", more: "Audio & Video conversational tool" },

        "okendo.io": { type: "widgets", more: "reviews widget mainly for Shopify" },

        "chimpstatic.com": { type: "widgets", more: "email marketing" },
        "convead.io": { type: "widgets", more: "email marketing" },
        "jilt.com": { type: "widgets", more: "email marketing" },
        "klaviyo.com": { type: "widgets", more: "email marketing" },
        "mailchimpapp.com": { type: "widgets", more: "email marketing" },
        "mailmunch.co": { type: "widgets", more: "email marketing" },
        "opmnstr.com": { type: "widgets", more: "email marketing by OptinMonster" },
        "optinmonster.com": { type: "widgets", more: "email marketing by OptinMonster" },
        "optmnstr.com": { type: "widgets", more: "email marketing by OptinMonster" },
        "socialshopwave.com": { type: "widgets", more: "email marketing" },
        "soundestlink.com": { type: "widgets", more: "Omnisend email marketing" },

        "refiner.io": { type: "dev tools", more: "survey services" },
        "satismeter.com": { type: "widgets", more: "survey services" },
        "typeform.com": { type: "dev tools", more: "survey services" },

        "elfsight.com": { type: "dev tools", more: "e-commerce widgets" },

        "accessibly.app": { type: "dev tools", more: "Accessibility widgets" },


        // dev
        "antiadblocksystems.com": { type: "dev tools", more: "Anti Ad-block service" },
        "appspot.com": { type: "dev tools", more: "Google Cloud Services" },
        "googleapis.com": { type: "dev tools", more: "Google API services" },
        "gravatar.com": { type: "dev tools", more: "Globally Recognized Avatar by Automattic" },
        "herokuapp.com": { type: "dev tools", more: "Platform as a service" },
        "ipdata.co": { type: "dev tools", more: "Geolocation and Proxy Detection" },
        "jsdelivr.net": { type: "dev tools", more: "Javascript CDN service" },
        "localizejs.com": { type: "dev tools", more: "Translation services" },
        "parsely.com": { type: "dev tools", more: "Form manager" },
        "polyfill.io": { type: "dev tools", more: "Javascript CDN service" },
        "trackjs.com": { type: "dev tools", more: "Easily Find and Reproduce JavaScript Errors" },
        "visualwebsiteoptimizer.com": { type: "dev tools", more: "A/B testing" },
        "wonderpush.com": { type: "dev tools", more: "push notifications" },
        "monetate.net": { type: "dev tools", more: "Kibo Commerce solutions" },
        "typicalteeth.com": { type: "dev tools", more: "Controls access to copyrighted content in accordance with the DMCA" },
        "acidpigs.com": { type: "dev tools", more: "Controls access to copyrighted content in accordance with the DMCA by Admiral" },
        "bugherd.com": { type: "dev tools", more: "Bug tracking tool & visual feedback by Splitrock Studio" },






        // multimedia
        "brightcove.net": { type: "dev tools", more: "video player" },
        "cnevids.com": { type: "dev tools", more: "Condé Nast Entertainment Videos" },
        "jwpcdn.com": { type: "dev tools", more: "JW Video Player" },
        "jwplatform.com": { type: "dev tools", more: "JW Video Player" },
        "jwplayer.com": { type: "dev tools", more: "JW Video Player" },
        "vimeo.com": { type: "dev tools", more: "Vimeo video player" },
        "wistia.com": { type: "dev tools", more: "Wistia B2B video hosting platform" },
        "wistia.net": { type: "dev tools", more: "Wistia B2B video hosting platform" },
        "youtube.com": { type: "dev tools", more: "YouTube video player" },
        "zencdn.net": { type: "dev tools", more: "video player" },
        "dailymotion.com": { type: "dev tools", more: "video player" },





        // monitor
        "appdynamics.com": { type: "dev tools", more: "perfrmance monitor" },
        "sentry-cdn.com": { type: "dev tools", more: "real-time crash reporting by Functional Software" },
        "userzoom.com": { type: "dev tools", more: "UX research tool by UserZoom" },




        // privacy       
        "cookiebot.com": { type: "privacy" },
        "cookielaw.org": { type: "privacy", more: "cookie manager" },
        "cookiepro.com": { type: "privacy", more: "GDPR tool" },
        "onetrust.com": { type: "privacy", more: "OneTrust GDPR tool" },
        "opta.net": { type: "privacy", more: "GDPR tool" },
        "privacy-center.org": { type: "privacy", more: "by Didomi" },
        "trustarc.com": { type: "privacy" },
        "pmc.com": { type: "privacy", more: "IAB CCPA Compliance Framework" },
        "cookiefirst.com": { type: "privacy", more: "GDPR tool" },
        "privacymanager.io": { type: "privacy", more: "by LiveRamp" },
        "cdn-cookieyes.com": { type: "privacy", more: "by CookieYes" },


        // Analytics
        "chartbeat.com": { type: "analytics", more: "Content intelligence platform for publishers" },
        "clicktale.net": { type: "analytics" },
        "cloudflareinsights.com": { type: "analytics", more: "Cloudflare" },
        "condenastdigital.com": { type: "analytics", more: "Condé Nast Digital" },
        "crazyegg.com": { type: "analytics", more: "heatmaps" },
        "go-mpulse.net": { type: "analytics", more: "Real User Monitoring by Akamai" },
        "google-analytics.com": { type: "analytics", more: "Google Analytics" },
        "googletagmanager.com": { type: "analytics", more: "Google GTM" },
        "googletagservices.com": { type: "analytics", more: "Google GTM" },
        "googleoptimize.com": { type: "analytics", more: "Google A/B testing" },
        "histats.com": { type: "analytics" },
        "hs-analytics.net": { type: "analytics", more: "HubSpot" },
        "hsadspixel.net": { type: "analytics", more: "HubSpot analytics" },
        "inspectlet.com": { type: "analytics", more: "Inspectel" },
        "jst.ai": { type: "analytics", more: "Artificial Intelligence by Accenture" },
        "meetrics.net": { type: "analytics" },
        "memoinsights.com": { type: "analytics", more: "Memo analytics" },
        "mxpnl.com": { type: "analytics", more: "Mixpanel" },
        "nr-data.net": { type: "analytics", more: "New Relic" },
        "omtrdc.net": { type: "analytics", more: "Omniture, Adobe Analytics" },
        "pingdom.net": { type: "analytics", more: "site performances" },
        "quantcount.com": { type: "analytics", more: "New Relic" },
        "quantserve.com": { type: "analytics", more: "Quantcast" },
        "realytics.io": { type: "analytics", more: "TV analytics tool" },
        "requestmetrics.com": { type: "analytics", more: "Analytics by TrackJS" },
        "scorecardresearch.com": { type: "analytics", more: "Comscore" },
        "simpleanalyticscdn.com": { type: "analytics", more: "privacy-based analytics by Simple Analytics" },
        "sitelabweb.com": { type: "analytics" },
        "speedcurve.com": { type: "analytics", more: "site performances" },
        "tiqcdn.com": { type: "analytics", more: "Tealium analytics" },
        "medallia.com": { type: "analytics", more: "Customer feedback platform and analytics" },
        "shopgram.app": { type: "analytics", more: "Shopify analytics" },
        "yandex.ru": { type: "analytics", more: "Yandex analytics" },
        "tvsquared.com": { type: "analytics", more: "TVSquared by Innovid" },
        "dotmetrics.net": { type: "analytics", more: "By Ipsos" },
        "zi-scripts.com": { type: "analytics", more: "By ZoomInfo" },





        // advertising                
        "2mdn.net": { type: "advertising", more: "Google Doubleclick" },
        "ad-delivery.net": { type: "advertising" },
        "ad.gt": { type: "advertising", more: "crossplatform Ad server" },
        "adform.net": { type: "advertising" },
        "adlightning.com": { type: "advertising", more: "Optimizing revenue and performance" },
        "admantx.com": { type: "advertising" },
        "ads-twitter.com": { type: "advertising" },
        "adsafeprotected.com": { type: "advertising" },
        "adsninja.ca": { type: "advertising" },
        "advertising.com": { type: "advertising", more: "Verizon advertising" },
        "amazon-adsystem.com": { type: "advertising", more: "advertising by Amazon" },
        "aniview.com": { type: "advertising", more: "Aniview - Video Advertising and Monetization Solutions" },
        "associates-amazon.com": { type: "advertising", more: "advertising by Amazon" },
        "bizographics.com": { type: "advertising", more: "by Linkedin" },
        "bizrate.com": { type: "advertising", more: "by Connexity" },
        "blogherads.com": { type: "advertising", more: "" },
        "clicktripz.com": { type: "advertising" },
        "districtm.ca": { type: "advertising", more: "" },
        "doubleclick.net": { type: "advertising", more: "Google Doubleclick" },
        "exoclick.com": { type: "advertising" },
        "googleadservices.com": { type: "advertising", more: "Google Ads" },
        "googlesyndication.com": { type: "advertising", more: "Google Ads" },
        "gowatchit.com": { type: "advertising", more: "Video advertising" },
        "gumgum.com": { type: "advertising" },
        "hs-banner.com": { type: "advertising", more: "HubSpot advertising" },
        "indexww.com": { type: "advertising", more: "Ad server" },
        "iprom.net": { type: "advertising" },
        "ipromcloud.com": { type: "advertising" },
        "marketo.com": { type: "advertising" },
        "media.net": { type: "advertising", more: "Dubai Media company" },
        "mediavoice.com": { type: "advertising", more: "Ad server" },
        "moatads.com": { type: "advertising", more: "advertising" },
        "myfinance.com": { type: "advertising", more: "Monetization platform" },
        "narrativ.com": { type: "advertising", more: "E-commerce recommendations" },
        "outbrain.com": { type: "advertising" },
        "peerius.com": { type: "advertising", more: "by Optimizely" },
        "postrelease.com": { type: "advertising", more: "Scalable and automated native advertising platform" },
        "rebel.ai": { type: "advertising" },
        "rubiconproject.com": { type: "advertising", more: "Rubicon Project" },
        "scroll.com": { type: "advertising" },
        "selectablemedia.com": { type: "advertising", more: "Digital content in exchange for interacting with brand advertisements" },
        "skimresources.com": { type: "advertising", more: "content monetization platform" },
        "teads.tv": { type: "advertising", more: "by Teads Advertising" },
        "timeinc.com": { type: "advertising", more: "by Meredith" },
        "trafficjunky.net": { type: "advertising", more: "advertising on adult sites" },
        "videoplayerhub.com": { type: "advertising" },
        "viglink.com": { type: "advertising", more: "E-commerce recommendations" },
        "adthrive.com": { type: "advertising", more: "by CafeMedia" },
        "profitwell.com": { type: "advertising", more: "by Paddle" },
        "concert.io": { type: "advertising", more: "by Voxmedia" },





        // lead tracking
        "absorbingband.com": { type: "marketing", more: "Lead tracking ?" },
        "abtasty.com": { type: "marketing", more: "AB Tasty lead tracking" },
        "acsbapp.com": { type: "marketing", more: "marketing tools by acessiBe" },
        "adroll.com": { type: "marketing", more: "Lead tracking" },
        "afterpay.com": { type: "marketing", more: "Lead generator by Clearpay" },
        "automizely.com": { type: "marketing", more: "by Aftership" },
        "bant.io": { type: "marketing", more: "B2B lead tracking" },
        "bazaarvoice.com": { type: "marketing", more: "Lead tracking" },
        "beemray.com": { type: "marketing", more: "Lead tracking" },
        "bizible.com": { type: "marketing", more: "Lead tracking" },
        "bkrtx.com": { type: "marketing", more: "BlueKai by Oracle" },
        "bluecore.com": { type: "marketing" },
        "boomtrain.com": { type: "marketing", more: "Data-Driven Marketing Powered by Artificial Intelligenc" },
        "bounceexchange.com": { type: "marketing", more: "Lead tracking by Wunderkind" },
        "brainlead.it": { type: "marketing", more: "Markeing automation by Shimubi" },
        "branch.io": { type: "marketing", more: "Lead tracking" },
        "brandmetrics.com": { type: "marketing", more: "Lead tracking" },
        "ccmbg.com": { type: "marketing" },
        "chargebee.com": { type: "marketing", more: "Lead tracking" },
        "chilipiper.com": { type: "marketing", more: "Lead tracking" },
        "clarity.ms": { type: "marketing", more: "Microsoft Lead tracking" },
        "clearbit.com": { type: "marketing", more: "Lead tracking" },
        "clearbitjs.com": { type: "marketing", more: "Lead tracking" },
        "consensu.org": { type: "marketing", more: "Quantcast lead tracking" },
        "cpx.to": { type: "marketing", more: "Lead tracking with obfuscated ownership" },
        "criteo.com": { type: "marketing", more: "Lead tracking by Criteo" },
        "criteo.net": { type: "marketing", more: "Lead tracking by Criteo" },
        "crwdcntrl.net": { type: "marketing", more: "Lotame lead tracking" },
        "custora.com": { type: "marketing", more: "'We help people use data to serve the customer'" },
        "cxense.com": { type: "marketing", more: "Lead tracking" },
        "decibelinsight.net": { type: "marketing", more: "Lead tracking by Decibel" },
        "demandbase.com": { type: "marketing", more: "Lead tracking" },
        "demdex.net": { type: "marketing", more: "Lead tracking by Adobe" },
        "driftt.com": { type: "marketing", more: "Lead tracking" },
        "dwin1.com": { type: "marketing", more: "AWIN affiliate marketing" },
        "dynamicyield.com": { type: "marketing", more: "Lead tracking" },
        "effectivemeasure.net": { type: "marketing", more: "Lead tracking" },
        "engagio.com": { type: "marketing", more: "Lead tracking" },
        "ensighten.com": { type: "marketing", more: "marketing security" },
        "exelator.com": { type: "marketing", more: "Lead tracking by Nielsen" },
        "fastly-insights.com": { type: "marketing", more: "Lead tracking" },
        "force.com": { type: "marketing", more: "CRM" },
        "forter.com": { type: "marketing", more: "lead tracking" },
        "fqtag.com": { type: "marketing", more: "Lead tracking by Forensiq" },
        "fullstory.com": { type: "marketing", more: "Lead tracking" },
        "gannett-cdn.com": { type: "marketing", more: "marketing CDN" },
        "gannettdigital.com": { type: "marketing", more: "marketing" },
        "getelevar.com": { type: "marketing", more: "Elevar lead tracking" },
        "gigya.com": { type: "marketing", more: "Lead tracking" },
        "goadservices.com": { type: "marketing", more: "Lead tracking" },
        "gosquared.com": { type: "marketing", more: "Lead tracking" },
        "growsurf.com": { type: "marketing", more: "referal campaigns" },
        "heapanalytics.com": { type: "marketing", more: "Lead tracking" },
        "hellobar.com": { type: "marketing", more: "Lead tracking" },
        "hotjar.com": { type: "marketing", more: "Lead tracking" },
        "hscollectedforms.net": { type: "marketing", more: "Lead tracking by HubSpot" },
        "hsleadflows.net": { type: "marketing", more: "Lead tracking by HubSpot" },
        "hubspot.com": { type: "marketing", more: "Lead tracking" },
        "id5-sync.com": { type: "marketing", more: "ID6 identity provider by Eyeota" },
        "imrworldwide.com": { type: "marketing", more: "Nielsen Lead tracking" },
        "js-sec.indexww.com": { type: "marketing", more: "Optimax Media Delivery" },
        "kampyle.com": { type: "marketing", more: "Lead tracking" },
        "klevu.com": { type: "marketing", more: "Lead tracking, AI-powered discovery suite" },
        "klick2contact.com": { type: "marketing", more: "marketing services by Eckoh" },
        "kochava.com": { type: "marketing", more: "Lead tracking" },
        "krxd.net": { type: "marketing", more: "by Salesforce" },
        "liadm.com": { type: "marketing", more: "by LiveIntent" },
        "linksynergy.com": { type: "marketing", more: "Rakuten affiliate marketing" },
        "luckyorange.com": { type: "marketing", more: "Lead tracking" },
        "madkudu.com": { type: "marketing", more: "Lead tracking" },
        "madwiremedia.com": { type: "marketing", more: "Lead tracking" },
        "mailerlite.com": { type: "marketing", more: "marketing tools" },
        "memo.co": { type: "marketing", more: "Lead tracking" },
        "ml314.com": { type: "marketing", more: "Lead tracking by Bombora" },
        "needle.com": { type: "marketing", more: "Online Customer Service by ThirdChannel" },
        "newrelic.com": { type: "marketing", more: "Lead tracking by New Relic" },
        "onesignal.com": { type: "marketing", more: "Lead tracking" },
        "optimizely.com": { type: "marketing", more: "Lead tracking" },
        "optmstr.com": { type: "marketing", more: "Lead generator by OptinMonster" },
        "pardot.com": { type: "marketing", more: "Lead tracking by Salesforce" },
        "permutive.app": { type: "marketing", more: "Lead tracking" },
        "permutive.com": { type: "marketing", more: "Lead tracking" },
        "privy.com": { type: "marketing", more: "lead tracking" },
        "qualtrics.com": { type: "marketing", more: "Lead tracking" },
        "r8commerce.com": { type: "marketing", more: "Lead tracking" },
        "riskified.com": { type: "marketing", more: "Lead tracking" },
        "routeapp.io": { type: "marketing", more: "customer experience tracking" },
        "s-onetag.com": { type: "marketing", more: "Lead tracking" },
        "sail-horizon.com": { type: "marketing", more: "Sailthru marketing automation" },
        "salecycle.com": { type: "marketing", more: "Lead generator" },
        "salesforce.com": { type: "marketing", more: "CRM" },
        "salesloft.com": { type: "marketing", more: "Lead tracking" },
        "scarabresearch.com": { type: "marketing", more: "Lead tracking" },
        "shop.pe": { type: "marketing", more: "AddShoppers by SafeOpt" },
        "smg.com": { type: "marketing", more: "Lead tracking by Service Managment Group" },
        "smile.io": { type: "marketing", more: "customer tracking" },
        "spot.im": { type: "marketing", more: "Lead tracking" },
        "starapps.studio": { type: "marketing", more: "Lead generator by Xper Softwares" },
        "taboola.com": { type: "marketing" },
        "tagcommander.com": { type: "marketing", more: "Lead tracking" },
        "tealiumiq.com": { type: "marketing", more: "Lead tracking" },
        "theadex.com": { type: "marketing" },
        "tinypass.com": { type: "marketing", more: "Lead tracking by piano.io" },
        "treasuredata.com": { type: "marketing", more: "Lead tracking" },
        "trstplse.com": { type: "marketing", more: "TrustPulse" },
        "turn.com": { type: "marketing", more: "Amobee lead tracking" },
        "upsellit.com": { type: "marketing", more: "Lead tracking by USI Technologies" },
        "usemessages.com": { type: "marketing", more: "Lead tracking by HubSpot" },
        "user.com": { type: "marketing", more: "Lead tracking" },
        "visitor-track.com": { type: "marketing", more: "Lead tracking" },
        "xg4ken.com": { type: "marketing", more: "by Kenshoo" },
        "yieldify.com": { type: "marketing", more: "Lead tracking" },
        "yotpo.com": { type: "marketing", more: "Lead tracking" },
        "zqtk.net": { type: "marketing", more: "comScore lead tracking" },
        "cloudsponge.com": { type: "marketing", more: "e-commerce tools" },
        "urbanairship.com": { type: "marketing", more: "'Mobile app experiences tailored to your customers'" },
        "mutinycdn.com": { type: "marketing", more: "'increase website conversions'" },
        "segment.com": { type: "analytics", more: "Lead tracking" },
        "tapfiliate.com": { type: "analytics", more: "Lead tracking by Admitad" },
        "amplitude.com": { type: "analytics", more: "Lead tracking by Amplitude" },
        "lenmit.com": { type: "analytics", more: "Lead tracking by Admitad" },
        "qualified.com": { type: "analytics", more: "Lead tracking for Salesforce" },
        "onthe.io": { type: "analytics", more: "Lead tracking" },
        "zephr.com": { type: "analytics", more: "Lead tracking by Zuora" },
        "yottaa.com": { type: "analytics", more: "Lead tracking" },
        "sitewit.com": { type: "analytics", more: "Lead tracking" },
        "km0trk.com": { type: "analytics", more: "Performance tracking" },









        // social
        "addthis.com": { type: "social", more: "Addthis social tool by Oracle" },
        "addthisedge.com": { type: "social", more: "Add this social tool by Oracle" },
        "addtoany.com": { type: "social", more: "social tools" },
        "facebook.net": { type: "social", more: "Facebook widgets" },
        "instagram.com": { type: "social", more: "Instagram" },
        "linkedin.com": { type: "social", more: "LinkedIn CDN service" },
        "pinimg.com": { type: "social", more: "Pinterest" },
        "pinterest.com": { type: "social", more: "Pinterest" },
        "quora.com": { type: "social", more: "Quora" },
        "redditstatic.com": { type: "social", more: "Reddit CDN service" },
        "sc-static.net": { type: "social", more: "Snapchat" },
        "sharethis.com": { type: "social", more: "social tools" },
        "snapchat.com": { type: "social", more: "Snapchat analytics" },
        "tiktok.com": { type: "social", more: "TikTok analytics" },
        "twitter.com": { type: "social", more: "Twitter" },
        "vk.com": { type: "social", more: "VK" },




        // e-commerce
        "affirm.com": { type: "e-commerce", more: "payments" },
        "curalate.com": { type: "e-commerce", more: "Sell via social channels" },
        "evidon.com": { type: "e-commerce", more: "security by Crownpeak (ex Evidon)" },
        "goaffpro.com": { type: "e-commerce", more: "affiliate marketing" },
        "paypal.com": { type: "e-commerce", more: "payments" },
        "rakuten.com": { type: "e-commerce", more: "e-commerce cashback" },
        "rise-ai.com": { type: "e-commerce", more: "e-commerce gift card" },
        "scalapay.com": { type: "e-commerce", more: "payment processor" },
        "stripe.com": { type: "e-commerce", more: "on-line payments" },
        "trustedsite.com": { type: "e-commerce", more: "security" },
        "zonos.com": { type: "e-commerce", more: "e-commerce tools" },
        "quadpay.com": { type: "e-commerce", more: "payment processor" },
        "boldapps.net": { type: "e-commerce", more: "payment processor" },
        "klarnaservices.com": { type: "e-commerce", more: "payment processor" },
        "squarecdn.com": { type: "e-commerce", more: "payment processor" },






        // CMS
        "adobedtm.com": { type: "CMS", more: "Adobe Experience Manager" },
        "bigcommerce.com": { type: "CMS", more: "BigCommerce" },
        "bitrix.info": { type: "CMS", more: "1C-Bitrix online store" },
        "cquotient.com": { type: "CMS", more: "e-commerce platform by SalesForce" },
        "getshogun.com": { type: "CMS", more: "Shopify CMS add-on" },
        "giftcheckout.co": { type: "CMS", more: "Shopify add-on" },
        "global-e.com": { type: "CMS", more: "Global-e e-commerce CMS" },
        "medium.com": { type: "CMS", more: "Medium" },
        "myshopapps.com": { type: "CMS", more: "Shopify add-on" },
        "parastorage.com": { type: "CMS", more: "Wix CDN service" },
        "powercommerce.co.uk": { type: "CMS", more: "Shopify add-on" },
        "shopify.com": { type: "CMS", more: "Shopify e-commerce" },
        "shopifycdn.com": { type: "CMS", more: "Shopify e-commerce" },
        "shopifycloud.com": { type: "CMS", more: "Shopify" },
        "squarespace.com": { type: "CMS", more: "Squarespace" },
        "webflow.com": { type: "CMS", more: "Webflow code-free CMS" },
        "wp.com": { type: "CMS", more: "Wordpress CDN service" },
        "yoox.biz": { type: "CMS", more: "Yoox" },
        "zenfolio.net": { type: "CMS", more: "Zenfolio" },
        "shopifyapps.com": { type: "CMS", more: "Shopify tools" },
        "tildacdn.com": { type: "CMS", more: "Tilda CMS" },


        "wisepops.net": { "type": "Marketing", "more": "Targeted Wisepops campaigns" },
        "nfcube.com": { "type": "cdn", "more": "CDN for Nfcube (Relentless Apps)" },
        "redirectify.app": { "type": "tools", "more": "monitors broken links" },
        "shop.app": { "type": "marketing", "more": "Shopify maerketing tools" },
        "posthog.com": { "type": "analytics", "more": "Analytics and GDPR" },
        "join-stories.com": { "type": "marketing", "more": "Stories integration." },
        "gorgias.chat": { "type": "widgets", "more": "Gorgias Chat" },
        "gorgias.help": { "type": "widgets", "more": "Gorgias Chat" },
        "9gtb.com": { "type": "widgets", "more": "CDN" }

    };


    if (knowns[domain]) {
        return knowns[domain];
    } else {
        domain = just_domain(domain);
        // console.log("**********", pagehost , domain);
        if (pagehost == domain) {
            return { type: "INTERNAL", more: "" };
        } else {
            if (short_knowns[domain]) {
                return short_knowns[domain];
            } else {
                return false;
            }
        }

    }

}