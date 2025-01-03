"use client";

import Script from "next/script";
import { FC, useEffect } from "react";
import { fbPixelTrackPage, fbPixelInit, lnkdnInitAndTrack } from "./pixel-apis";
import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

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
      <Script>
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
          <Script>
            {`
              _linkedin_partner_id = "${partnerID}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            `}
          </Script>
          <Script>
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
