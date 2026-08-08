"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import { ApiForecastingAccess as ApiForecastingAccessEnum } from "@/types/users";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { setApiForecastingAccessAction } from "../../actions";

type Props = {
  access: ApiForecastingAccessEnum;
};

const ApiForecastingAccess: FC<Props> = ({ access: initialAccess }) => {
  const t = useTranslations();
  const [access, setAccess] = useState<ApiForecastingAccessEnum>(initialAccess);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    sendAnalyticsEvent("apiForecastingConfirm");
    setIsLoading(true);
    try {
      const response = await setApiForecastingAccessAction(
        ApiForecastingAccessEnum.Enabled
      );
      if (response && "errors" in response && !!response.errors) {
        toast.error(t("apiForecastingAccessErrorToast"));
        return;
      }
      setAccess(ApiForecastingAccessEnum.Enabled);
      toast.success(t("apiForecastingAccessUpdatedToast"));
    } catch {
      toast.error(t("apiForecastingAccessErrorToast"));
    } finally {
      setIsLoading(false);
    }
  };

  // The section is only surfaced once a blocked API forecast moves the account
  // into the "pending" state; it stays hidden otherwise.
  if (access !== ApiForecastingAccessEnum.Pending) {
    return null;
  }

  return (
    <section
      id="api-forecasting-access"
      // Offset the anchor jump by the live TopChrome height (header + banner)
      // so the heading is not hidden behind the sticky chrome.
      style={{
        scrollMarginTop: "calc(var(--top-chrome-height, 8rem) + 1rem)",
      }}
    >
      <hr className="my-6 border-gray-400 dark:border-gray-400-dark" />
      <div className="mb-4 text-gray-500 dark:text-gray-500-dark">
        {t("apiForecastingAccessHeading")}
      </div>
      <div className="flex flex-col gap-4 text-sm">
        <p className="m-0">{t("apiForecastingAccessIntro")}</p>
        <p className="m-0">
          {t.rich("apiForecastingAccessBotNotice", {
            link: (chunks) => (
              <Link href="/accounts/settings/bots/#create">{chunks}</Link>
            ),
          })}
        </p>
        <Button
          variant="secondary"
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-fit"
        >
          {t("apiForecastingAccessEnableButton")}
        </Button>
      </div>
    </section>
  );
};

export default ApiForecastingAccess;
