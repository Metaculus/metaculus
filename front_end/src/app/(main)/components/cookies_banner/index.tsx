"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { FC, useEffect, useState } from "react";

import Button from "@/components/ui/button";
import { safeLocalStorage } from "@/utils/core/storage";

import CookiesModal from "./cookies_modal";

const STORAGE_KEY = "all_cookies_consent";

export type CookiesSettings = {
  necessary: boolean;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
};

const CookiesBanner: FC = () => {
  const t = useTranslations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState<
    CookiesSettings | null | "loadingConsent"
  >("loadingConsent");
  const router = useRouter();

  const [cookiesUISettings, setCookiesUISettings] = useState<CookiesSettings>({
    necessary: true,
    preferences: true,
    statistics: true,
    marketing: true,
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    setTimeout(() => {
      // Give time to Cookiebot to initialize, if using that
      const consent = getCookiesConset();
      setConsentGiven(consent);
      console.log("Elis -- CookiesBanner:  setting consent given", consent);
    }, 2000);
  }, []);

  useEffect(() => {
    if (consentGiven !== "loadingConsent") {
      posthog.set_config({
        persistence: consentGiven?.statistics
          ? "localStorage+cookie"
          : "memory",
      });

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: consentGiven?.statistics ? "granted" : "denied",
        });
      }
    }
  }, [consentGiven]);

  const submitBanner = (settings?: CookiesSettings) => {
    const settingsToSubmit = settings || cookiesUISettings;

    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSubmit));

    // if Cookiebot is available, submit it there too
    if (window.Cookiebot && window.Cookiebot.submitCustomConsent) {
      window.Cookiebot?.submitCustomConsent(
        settingsToSubmit.preferences,
        settingsToSubmit.statistics,
        settingsToSubmit.marketing
      );
    }
    setConsentGiven(settingsToSubmit);
    router.refresh();
  };

  if (consentGiven !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 z-[49] flex w-screen justify-center gap-8 border-t border-t-blue-500/50 bg-gradient-to-b from-white/65 to-white p-4 shadow-md backdrop-blur-sm dark:border-t-blue-700/50 dark:from-blue-900/65 dark:to-blue-900 md:p-6">
      <div className="flex w-full max-w-[1076px] flex-col justify-between gap-3 md:flex-row">
        <div className="flex flex-col gap-1.5">
          <h3 className="m-0 text-base font-normal leading-6 text-blue-900 dark:text-blue-900-dark md:text-lg md:leading-7">
            {t("cookiesTitle")}
          </h3>
          <p className="m-0 text-xs text-gray-700 dark:text-gray-700-dark md:text-sm">
            {t.rich("cookiesSubtitle", {
              link: (chunks) => (
                <Link
                  href={"/privacy-policy"}
                  className="text-blue-700 dark:text-blue-700-dark"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 xs:flex-row xs:items-center">
          <div className="flex gap-2">
            <Button
              className="whitespace-nowrap"
              onClick={() =>
                submitBanner({
                  necessary: true,
                  preferences: false,
                  statistics: false,
                  marketing: false,
                })
              }
            >
              {t("necessaryOnly")}
            </Button>
            <Button onClick={openModal}>{t("customize")}</Button>
          </div>
          <Button
            className="whitespace-nowrap"
            variant="primary"
            onClick={() =>
              submitBanner({
                necessary: true,
                preferences: true,
                statistics: true,
                marketing: true,
              })
            }
          >
            {t("acceptAndClose")}
          </Button>
        </div>
      </div>

      <CookiesModal
        isOpen={isModalOpen}
        onClose={closeModal}
        cookiesSettingsValue={cookiesUISettings}
        onCookiesSettingsChange={setCookiesUISettings}
        onSubmit={() => submitBanner()}
      />
    </div>
  );
};

export function getCookiesConset(): CookiesSettings | null {
  const val = safeLocalStorage.getItem(STORAGE_KEY);
  const localConsent = val ? JSON.parse(val) : null;

  console.log(
    "Elis -- getCookiesConset1: ",
    localConsent,
    window.Cookiebot?.hasResponse
  );

  // if Cookiebot is not available, use the local consent
  if (!window.Cookiebot?.hasResponse) {
    return localConsent;
  }

  console.log("Elis -- getCookiesConset2: ", window.Cookiebot.consent);

  return {
    necessary: window.Cookiebot.consent.necessary,
    preferences: window.Cookiebot.consent.preferences,
    statistics: window.Cookiebot.consent.statistics,
    marketing: window.Cookiebot.consent.marketing,
  };
}

export function getCookiesConsentStatistics(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const consent = getCookiesConset();
  return !!consent?.statistics;
}

export default CookiesBanner;
