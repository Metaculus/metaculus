"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { useCookiesContext } from "@/contexts/cookies_context";

import CookiesModal from "./cookies_modal";

const CookiesBanner: FC = () => {
  const t = useTranslations();
  const {
    saveCookiesConsent,
    isBannerVisible,
    isModalOpen,
    openModal,
    closeModal,
  } = useCookiesContext();

  return (
    <>
      {isBannerVisible && (
        <div className="fixed bottom-0 left-0 z-[100] flex w-screen justify-center gap-8 border-t border-t-blue-500/50 bg-gradient-to-b from-white/65 to-white p-4 shadow-md backdrop-blur-sm dark:border-t-blue-700/50 dark:from-blue-900/65 dark:to-blue-900 md:p-6">
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
                    saveCookiesConsent({
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
                  saveCookiesConsent({
                    necessary: true,
                    preferences: true,
                    statistics: true,
                    marketing: false,
                  })
                }
              >
                {t("acceptAndClose")}
              </Button>
            </div>
          </div>
        </div>
      )}
      <CookiesModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={saveCookiesConsent}
      />
    </>
  );
};

export default CookiesBanner;
