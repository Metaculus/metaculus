import { useEffect } from "react";

import { CookiesSettings } from ".";

// These two functions abstract away the interation with
//  Cookiebot when that is available.
export function getCookiebotConsent(): CookiesSettings | null {
  if (typeof window === "undefined" || !window.Cookiebot?.hasResponse) {
    return null;
  }

  return {
    necessary: window.Cookiebot.consent.necessary,
    preferences: window.Cookiebot.consent.preferences,
    statistics: window.Cookiebot.consent.statistics,
    marketing: window.Cookiebot.consent.marketing,
  };
}

export function submitCookiebotConsent(settings: CookiesSettings) {
  if (typeof window === "undefined" || !window.Cookiebot?.submitCustomConsent) {
    return;
  }

  window.Cookiebot.submitCustomConsent(
    settings.preferences,
    settings.statistics,
    settings.marketing
  );
}

export function hideCookiebotBanner() {
  if (typeof window === "undefined" || !window.Cookiebot?.hide) {
    return;
  }

  window.Cookiebot.hide();
}

export function showCookiebotBanner() {
  if (typeof window === "undefined" || !window.Cookiebot?.show) {
    return;
  }

  window.Cookiebot.show();
}

export const useCookiebotBannerListenersHook = (
  onCookiebotConsentUpdated?: () => void
) => {
  useEffect(() => {
    window.CookiebotCallback_OnAccept = function () {
      onCookiebotConsentUpdated?.();
    };
    window.CookiebotCallback_OnDecline = function () {
      onCookiebotConsentUpdated?.();
    };
  }, []);
};
