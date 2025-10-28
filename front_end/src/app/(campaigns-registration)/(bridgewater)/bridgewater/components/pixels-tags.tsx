"use client";

import Script from "next/script";
import { FC, useEffect } from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

import {
  fbPixelTrackPage,
  fbPixelInit,
  lnkdnInitAndTrack,
  redditPixelInitAndTrack,
} from "../utils/pixel-apis";

export const FacebookPixelTag: FC<{ pixelID?: string }> = ({ pixelID }) => {
  const consent =
    typeof window !== "undefined"
      ? getAnalyticsCookieConsentGiven()
      : "undecided";

  useEffect(() => {
    if (consent !== "yes" || !pixelID) return;

    fbPixelInit(pixelID);
    fbPixelTrackPage();
  }, [consent, pixelID]);

  return (
    pixelID && (
      <Script id="facebook-pixel-tag">
        {`
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
    `}
      </Script>
    )
  );
};

export const LinkedInInsightTag: FC<{ partnerID?: string }> = ({
  partnerID,
}) => {
  const consent =
    typeof window !== "undefined"
      ? getAnalyticsCookieConsentGiven()
      : "undecided";

  useEffect(() => {
    if (consent !== "yes" || !partnerID) return;

    lnkdnInitAndTrack();
  }, [consent, partnerID]);

  return (
    <>
      {partnerID && (
        <>
          <Script id="linkedin-insight-tag-1">
            {`
              _linkedin_partner_id = "${partnerID}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            `}
          </Script>
          <Script id="linkedin-insight-tag-2">
            {`
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
            `}
          </Script>
        </>
      )}
    </>
  );
};

export const RedditPixelTag: FC<{ pixelID?: string }> = ({ pixelID }) => {
  const consent =
    typeof window !== "undefined"
      ? getAnalyticsCookieConsentGiven()
      : "undecided";

  useEffect(() => {
    if (consent !== "yes" || !pixelID) return;

    redditPixelInitAndTrack(pixelID);
  }, [consent, pixelID]);

  return (
    <>
      {pixelID && (
        <>
          <Script id="reddit-pixel-tag">
            {`
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
            `}
          </Script>
        </>
      )}
    </>
  );
};
