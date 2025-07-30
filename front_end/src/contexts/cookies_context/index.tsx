"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { safeLocalStorage } from "@/utils/core/storage";

import {
  getCookiebotConsent,
  useCookiebotBannerListenersHook,
  submitCookiebotConsent,
  isCookiebotAvailable,
} from "./cookiebot";

const STORAGE_KEY = "all_cookies_consent";

// Simple cookie utility function
function setCookie(name: string, value: string, days: number = 365) {
  if (typeof window === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export type CookiesSettings = {
  necessary: boolean;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
};

type CookiesContextType = {
  cookiesConsent: CookiesSettings | null;
  submitCookieConsent: (settings: CookiesSettings) => void;
  isModalOpen: boolean;
  isBannerVisible: boolean;
  setIsBannerVisible: (visible: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
};

const CookiesContext = createContext<CookiesContextType | undefined>(undefined);

export const useCookiesContext = () => {
  const context = useContext(CookiesContext);
  if (context === undefined) {
    throw new Error("useCookiesContext must be used within a CookiesProvider");
  }
  return context;
};

function updateAnalyticsForConsent(cookiesConsent: CookiesSettings | null) {
  posthog.set_config({
    persistence: cookiesConsent?.statistics ? "localStorage+cookie" : "memory",
  });

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("consent", "update", {
      analytics_storage: cookiesConsent?.statistics ? "granted" : "denied",
    });
  }
}
export function getSavedCookiesConsent(): CookiesSettings | null {
  if (typeof window === "undefined") {
    return null;
  }

  const val = safeLocalStorage.getItem(STORAGE_KEY);
  const localConsent = val ? JSON.parse(val) : null;

  // If we have a Cookiebot consent, we use that, otherwise we use the local storage.
  // We instantiate the app sometimes without Cookiebot, so we need to use the local storage.
  return getCookiebotConsent() || localConsent;
}

export function getCookiesConsentStatistics(): boolean {
  const consent = getSavedCookiesConsent();
  return !!consent?.statistics;
}

function CookiesProvider({ children }: { children: ReactNode }) {
  const [cookiesConsent, setConsentGiven] = useState<CookiesSettings | null>(
    null
  );
  const router = useRouter();
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useCookiebotBannerListenersHook((newConsent) => {
    if (newConsent) {
      onCookiesConsentUpdated(newConsent);
    }
  });

  useEffect(() => {
    setTimeout(() => {
      // We do this to give Cookiebot time to initialize, as we cannot read the consent right away
      // During that time our banner is hidden
      const consent = getSavedCookiesConsent();
      setConsentGiven(consent);

      if (!consent) {
        // Make the banner visible if we don't have consent and we've given Cookiebot time to initialize
        setIsBannerVisible(true);
      }
    }, 1500);
  }, []);

  const onCookiesConsentUpdated = (newConsent: CookiesSettings | null) => {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
    setCookie(STORAGE_KEY, JSON.stringify(newConsent));

    closeModal();
    setConsentGiven(newConsent);
    updateAnalyticsForConsent(newConsent);
    setIsBannerVisible(false);
    router.refresh();
  };

  const submitCookieConsent = (newConsent: CookiesSettings) => {
    // If Cookiebot is available, we don't need to call onCookiesConsentUpdated, as it gets
    // called by the useCookiebotBannerListenersHook hook.
    if (isCookiebotAvailable()) {
      submitCookiebotConsent(newConsent);
    } else {
      onCookiesConsentUpdated(newConsent);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const contextValue: CookiesContextType = {
    cookiesConsent,
    submitCookieConsent,
    isBannerVisible,
    setIsBannerVisible,
    isModalOpen,
    openModal,
    closeModal,
  };

  return (
    <CookiesContext.Provider value={contextValue}>
      {children}
    </CookiesContext.Provider>
  );
}

export default CookiesProvider;
