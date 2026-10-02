"use client";

import { faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faCommentDots, faCopy } from "@fortawesome/free-regular-svg-icons";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useModal } from "@/contexts/modal_context";
import { useCopyUrl, useShareOnTwitterLink } from "@/hooks/share";

function PartnerCard() {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  return (
    <div className="flex flex-col items-center gap-4 rounded-md bg-blue-400 p-6 text-center dark:bg-blue-400-dark sm:p-8 lg:gap-6 xl:p-10">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-3 lg:gap-4">
          <FontAwesomeIcon
            icon={faCommentDots}
            className="text-xl text-blue-800 dark:text-blue-800-dark lg:text-[22px]"
          />
          <h3 className="m-0 text-base font-medium leading-7 text-blue-800 dark:text-blue-800-dark lg:text-lg">
            {t("globalHealthMonitorEngagementReachTitle")}
          </h3>
        </div>
        <p className="m-0 text-sm leading-5 text-blue-900 dark:text-blue-900-dark lg:text-base lg:leading-6">
          {t("globalHealthMonitorEngagementReachBody")}
        </p>
      </div>
      <div className="flex gap-2.5 lg:flex-col xl:flex-row">
        <Link
          href="/services"
          target="_blank"
          className="rounded bg-blue-200 px-3 py-1.5 text-sm text-blue-900 no-underline dark:bg-blue-200-dark dark:text-blue-900-dark"
        >
          {t("globalHealthMonitorEngagementViewServices")}
        </Link>
        <button
          onClick={() => setCurrentModal({ type: "contactUs" })}
          className="rounded bg-blue-200 px-3 py-1.5 text-sm text-blue-900 dark:bg-blue-200-dark dark:text-blue-900-dark"
        >
          {t("contactUs")}
        </button>
      </div>
    </div>
  );
}

function ShareCard() {
  const t = useTranslations();
  const copyUrl = useCopyUrl({
    includeHash: false,
    successMessage: t("globalHealthMonitorEngagementCopySuccess"),
    errorMessage: t("globalHealthMonitorEngagementCopyError"),
  });
  const shareOnTwitterLink = useShareOnTwitterLink(
    t("globalHealthMonitorEngagementTweetText"),
    { includeHash: false }
  );

  return (
    <div className="flex flex-col items-center gap-4 rounded-md bg-olive-300 p-6 text-center dark:bg-olive-400-dark sm:p-8 lg:gap-6 xl:p-10">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-3 lg:gap-4">
          <FontAwesomeIcon
            icon={faChartBar}
            className="text-xl text-olive-800 dark:text-olive-800-dark lg:text-[22px]"
          />
          <h3 className="m-0 text-base font-medium leading-7 text-olive-900 dark:text-olive-900-dark lg:text-lg">
            {t("globalHealthMonitorEngagementShareTitle")}
          </h3>
        </div>
        <p className="m-0 text-sm leading-5 text-olive-900 dark:text-olive-900-dark lg:text-base lg:leading-6">
          {t("globalHealthMonitorEngagementShareBody")}
        </p>
      </div>
      <div className="flex gap-2.5 text-sm text-olive-900 dark:text-olive-900-dark lg:flex-col xl:flex-row">
        <button
          onClick={copyUrl}
          className="flex items-center gap-2.5 rounded bg-olive-100 px-3 py-1.5 dark:bg-olive-100-dark"
        >
          <FontAwesomeIcon icon={faCopy} />
          <span>{t("copyLink")}</span>
        </button>
        <a
          href={shareOnTwitterLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded bg-olive-100 px-3 py-1.5 text-olive-900 no-underline dark:bg-olive-100-dark dark:text-olive-900-dark"
        >
          <FontAwesomeIcon icon={faXTwitter} />
          <span>{t("globalHealthMonitorEngagementShareOnX")}</span>
        </a>
      </div>
    </div>
  );
}

export function EngagementSection() {
  return (
    <section
      id="engagement"
      className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8 print:hidden"
    >
      <PartnerCard />
      <ShareCard />
    </section>
  );
}
