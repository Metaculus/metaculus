"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  analyticsValue: boolean;
  onAnalyticsValueChange: (value: boolean) => void;
  onSubmit: () => void;
};

const CookiesModal: FC<Props> = ({
  isOpen,
  onClose,
  analyticsValue,
  onAnalyticsValueChange,
  onSubmit,
}) => {
  const t = useTranslations();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} label={t("cookiePreferences")}>
      <p className="text-base leading-6">
        {t("cookieServices")}
        <br />
        {t.rich("learnMoreFromPrivacyPolicy", {
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

      <ul className="w-full rounded border border-gray-300 dark:border-gray-300-dark">
        <li className="flex flex-row items-center justify-between gap-3 border-b border-gray-300 px-3 py-2 dark:border-gray-300-dark">
          <div className="flex flex-row items-center gap-1.5">
            <Checkbox defaultChecked disabled label={t("necessaryCookies")} />
          </div>
          <div className="text-right text-gray-500 dark:text-gray-500-dark">
            {t("cannotBeUnchecked")}
          </div>
        </li>
        <li className="flex flex-row items-center justify-between gap-3 px-3 py-2">
          <div className="flex flex-row items-center gap-1.5">
            <Checkbox
              label={t("analytics")}
              checked={analyticsValue}
              onChange={onAnalyticsValueChange}
            />
          </div>
          <div className="text-right text-gray-500 dark:text-gray-500-dark">
            {t("helpsImprovePlatform")}
          </div>
        </li>
      </ul>

      <div className="mt-5 w-full text-right" onClick={onSubmit}>
        <Button variant="primary">{t("saveSelected")}</Button>
      </div>
    </BaseModal>
  );
};

export default CookiesModal;
