"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { setApiForecastingAccessAction } from "@/app/(main)/accounts/settings/actions";
import Button from "@/components/ui/button";
import { ApiForecastingAccess } from "@/types/users";
import { sendAnalyticsEvent } from "@/utils/analytics";

export const ApiForecastingBannerClient: FC = () => {
  const t = useTranslations();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    sendAnalyticsEvent("apiForecastingBannerDismiss");
    setIsDismissed(true);
    // Dismissing returns the account to "disabled"; the banner reappears only
    // if a future API forecast is blocked again. Restore it if the call fails.
    void setApiForecastingAccessAction(ApiForecastingAccess.Disabled).catch(
      () => {
        setIsDismissed(false);
      }
    );
  };

  return (
    <div className="relative flex w-full items-center justify-center gap-4 border-b border-t border-orange-400 bg-orange-50 px-10 py-2 text-sm leading-6 text-orange-900 dark:border-orange-400-dark dark:bg-orange-50-dark dark:text-orange-900-dark sm:px-12">
      <p className="m-0">
        {t.rich("apiForecastingBannerText", {
          bold: (chunks) => <strong className="font-bold">{chunks}</strong>,
          link: (chunks) => (
            <Link href="/accounts/settings/bots/#create">{chunks}</Link>
          ),
        })}
      </p>
      <Button
        href="/accounts/settings/account#api-forecasting-access"
        variant="tertiary"
        size="sm"
        className="shrink-0"
        onClick={() => sendAnalyticsEvent("apiForecastingBannerReview")}
      >
        {t("apiForecastingBannerCta")}
      </Button>
      <button
        type="button"
        aria-label={t("dismiss")}
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
};
