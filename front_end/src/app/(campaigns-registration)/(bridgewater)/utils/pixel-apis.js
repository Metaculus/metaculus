import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

import { PIXEL_CONSTANTS } from "./pixel-constants";

const fbPixelInstall = () => {
  if (window.fbq) return;

  function initializeFacebookPixel(f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }

  initializeFacebookPixel(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );
};

const linkedinPixelInstall = (partnerID) => {
  if (!partnerID) return;
  if (window._linkedin_data_partner_ids?.includes(partnerID)) return;

  window._linkedin_partner_id = partnerID;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(partnerID);

  if (window.lnkdInitAndTrackFn) return;

  window.lnkdInitAndTrackFn = function (l) {
    if (!l) {
      window.lintrk = function (a, b) {
        window.lintrk.q.push([a, b]);
      };
      window.lintrk.q = [];
    }
    var s = document.getElementsByTagName("script")[0];
    var b = document.createElement("script");
    b.type = "text/javascript";
    b.async = true;
    b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    s.parentNode.insertBefore(b, s);
  };
};

const redditPixelInstall = () => {
  if (window.rdt) return;

  !(function (w, d) {
    if (!w.rdt) {
      var p = (w.rdt = function () {
        p.sendEvent
          ? p.sendEvent.apply(p, arguments)
          : p.callQueue.push(arguments);
      });
      p.callQueue = [];
      var t = d.createElement("script");
      (t.src = "https://www.redditstatic.com/ads/pixel.js"), (t.async = !0);
      var s = d.getElementsByTagName("script")[0];
      s.parentNode.insertBefore(t, s);
    }
  })(window, document);
};

const googleTagInstall = (tagID) => {
  if (!tagID) return;
  if (window.gtag && document.getElementById("google-gtag-src")) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  const script1 = document.createElement("script");
  script1.id = "google-gtag-src";
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${tagID}`;
  script1.async = true;
  document.head.appendChild(script1);
};

export const fbPixelInit = (pixelID) => {
  // Facebook complains about being initialised multiple times, so we need to check if it's already been initialised
  if (!window.__fbPixelsInitialized) {
    window.__fbPixelsInitialized = {};
  }
  if (window.__fbPixelsInitialized[pixelID]) {
    return;
  }
  window.fbq("init", pixelID);
  window.__fbPixelsInitialized[pixelID] = true;
};

export const fbPixelTrackPage = () => {
  if (window.fbq) {
    window.fbq("track", "PageView");
  }
};

export const fbPixelTrackEvent = (name, options = {}) => {
  if (window.fbq) {
    window.fbq("trackCustom", name, options);
  }
};

export const fbPixelRevokeConsent = () => {
  window.fbq("consent", "revoke");
};

export const fbPixelGrantConsent = () => {
  window.fbq("consent", "grant");
};

// Google Tag
export const gtagPixelInit = (tagID) => {
  if (window.gtag && tagID) {
    window.gtag("config", tagID);
  }
};

const googleTrackConversion = (sendTo) => {
  if (window.gtag && sendTo) {
    window.gtag("event", "conversion", { send_to: sendTo });
  }
};

export const linkedinPixelInit = () => {
  if (window.lnkdInitAndTrackFn) {
    window.lnkdInitAndTrackFn(window.lintrk);
  }
};

export const linkedinPixelTrack = (conversion_id) => {
  if (window.lintrk) {
    window.lintrk("track", ...(conversion_id ? [{ conversion_id }] : []));
  }
};

// Reddit Pixel API
export const redditPixelInit = (pixelId) => {
  if (window.rdt) {
    window.rdt("init", pixelId);
  }
};

export const redditPixelTrack = (eventName = "PageVisit") => {
  if (window.rdt) {
    window.rdt("track", eventName);
  }
};

export const bwInitAndTrackRegistrationIfConsent = () => {
  const consent =
    typeof window !== "undefined"
      ? getAnalyticsCookieConsentGiven()
      : "undecided";

  if (consent !== "yes") return;

  // Save tot he local storage that the user has registed to this campaign
  window.localStorage.setItem("bw_registration_campaign", "true");

  // Facebook Pixel
  if (PIXEL_CONSTANTS.FACEBOOK) {
    fbPixelInstall();
    fbPixelInit(PIXEL_CONSTANTS.FACEBOOK);
    fbPixelTrackEvent("CompleteRegistration");
  }

  // Ensure Google tag is present and configured
  if (PIXEL_CONSTANTS.GOOGLE) {
    googleTagInstall(PIXEL_CONSTANTS.GOOGLE);
    gtagPixelInit(PIXEL_CONSTANTS.GOOGLE);
    googleTrackConversion(PIXEL_CONSTANTS.GOOGLE_REGISTRATION_CONVERSION_ID);
  }

  // Ensure LinkedIn Insight tag bootstrap is present
  if (PIXEL_CONSTANTS.LINKEDIN) {
    linkedinPixelInstall(PIXEL_CONSTANTS.LINKEDIN);
    linkedinPixelInit(PIXEL_CONSTANTS.LINKEDIN);
    linkedinPixelTrack(PIXEL_CONSTANTS.LINKEDIN_REGISTRATION_CONVERSION_ID);
  }

  // Ensure Reddit Pixel bootstrap script is present
  if (PIXEL_CONSTANTS.REDDIT) {
    redditPixelInstall();
    redditPixelInit(PIXEL_CONSTANTS.REDDIT);
    redditPixelTrack("SignUp");
  }
};

export const bwTrackPredictionIfConsent = () => {
  const consent =
    typeof window !== "undefined"
      ? getAnalyticsCookieConsentGiven()
      : "undecided";

  const hasRegistered = window.localStorage.getItem("bw_registration_campaign");
  if (consent !== "yes" || !hasRegistered) return;

  fbPixelTrackEvent("SubmitApplication");
  googleTrackConversion(PIXEL_CONSTANTS.GOOGLE_PREDICTION_CONVERSION_ID);
  linkedinPixelTrack(PIXEL_CONSTANTS.LINKEDIN_PREDICTION_CONVERSION_ID);
  redditPixelTrack("Lead");
};
