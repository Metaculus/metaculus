"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { FC, useEffect, useState } from "react";

import Button from "@/components/ui/button";
import { safeLocalStorage } from "@/utils/core/storage";

import CookiesModal from "./cookies_modal";

type ConsentGiven = "yes" | "no" | "undecided";

const STORAGE_KEY = "analytic_cookies_consent";

const CookiesBanner: FC = () => {
  const t = useTranslations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState<ConsentGiven | null>(null);
  const router = useRouter();
  const [analyticsCheckboxValue, setAnalyticsCheckboxValue] =
    useState<boolean>(true);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  useEffect(() => {
    setConsentGiven(getAnalyticsCookieConsentGiven());
  }, []);

  useEffect(() => {
    if (consentGiven !== null) {
      posthog.set_config({
        persistence: consentGiven === "yes" ? "localStorage+cookie" : "memory",
      });

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: consentGiven === "yes" ? "granted" : "denied",
        });
      }
    }
  }, [consentGiven]);

  const submitBanner = (necessaryOnly?: boolean) => {
    const consentValue = necessaryOnly
      ? "no"
      : analyticsCheckboxValue
        ? "yes"
        : "no";
    safeLocalStorage.setItem(STORAGE_KEY, consentValue);
    setConsentGiven(consentValue);
    router.refresh();
  };

  if (consentGiven !== "undecided") {
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
              onClick={() => submitBanner(true)}
            >
              {t("necessaryOnly")}
            </Button>
            <Button onClick={openModal}>{t("customize")}</Button>
          </div>
          <Button
            className="whitespace-nowrap"
            variant="primary"
            onClick={() => submitBanner()}
          >
            {t("acceptAndClose")}
          </Button>
        </div>
      </div>

      <CookiesModal
        isOpen={isModalOpen}
        onClose={closeModal}
        analyticsValue={analyticsCheckboxValue}
        onAnalyticsValueChange={setAnalyticsCheckboxValue}
        onSubmit={submitBanner}
      />
    </div>
  );
};

export function getAnalyticsCookieConsentGiven(): ConsentGiven {
  const consentGiven = safeLocalStorage.getItem(STORAGE_KEY);

  return consentGiven ? (consentGiven as ConsentGiven) : "undecided";
}

export default CookiesBanner;
