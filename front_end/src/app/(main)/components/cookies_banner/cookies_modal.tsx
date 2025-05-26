"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { CookiesSettings, useCookiesContext } from "@/contexts/cookies_context";
import { showCookiebotBanner } from "@/contexts/cookies_context/cookiebot";
import { usePublicSettings } from "@/contexts/public_settings_context";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cookiesSettings: CookiesSettings) => void;
};

const CookiesModal: FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const t = useTranslations();
  const { PUBLIC_COOKIEBOT_ID } = usePublicSettings();
  const { cookiesConsent, setIsBannerVisible } = useCookiesContext();

  const showMarketeingOption = false;
  const showPreferencesOption = false;

  const [cookiesUISettings, setCookiesUISettings] = useState<CookiesSettings>({
    ...(cookiesConsent || {
      necessary: true,
      preferences: false,
      statistics: false,
      marketing: false,
    }),
  });

  useEffect(() => {
    if (cookiesConsent) {
      setCookiesUISettings(cookiesConsent);
    }
  }, [cookiesConsent]);

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
            <Checkbox
              defaultChecked
              disabled
              label={t("necessaryCookies")}
              className="flex flex-nowrap"
            />
          </div>
          <div className="text-right text-gray-500 dark:text-gray-500-dark">
            {t("cannotBeUnchecked")}
          </div>
        </li>
        {showPreferencesOption && (
          <li className="flex flex-row items-center justify-between gap-3 px-3 py-2">
            <div className="flex flex-row items-center gap-1.5">
              <Checkbox
                label={t("preferences")}
                checked={cookiesUISettings.preferences}
                className="flex flex-nowrap"
                onChange={() =>
                  setCookiesUISettings({
                    ...cookiesUISettings,
                    preferences: !cookiesUISettings.preferences,
                  })
                }
              />
            </div>
            <div className="text-right text-gray-500 dark:text-gray-500-dark">
              {t("cookiesPreferencesDescription")}
            </div>
          </li>
        )}
        <li className="flex flex-row items-center justify-between gap-3 px-3 py-2">
          <div className="flex flex-row items-center gap-1.5">
            <Checkbox
              label={t("analytics")}
              className="flex flex-nowrap"
              checked={cookiesUISettings.statistics}
              onChange={() =>
                setCookiesUISettings({
                  ...cookiesUISettings,
                  statistics: !cookiesUISettings.statistics,
                })
              }
            />
          </div>
          <div className="text-right text-gray-500 dark:text-gray-500-dark">
            {t("helpsImprovePlatform")}
          </div>
        </li>
        {showMarketeingOption && (
          <li className="flex flex-row items-center justify-between gap-3 px-3 py-2">
            <div className="flex flex-row items-center gap-1.5">
              <Checkbox
                label={t("marketing")}
                className="flex flex-nowrap"
                checked={cookiesUISettings.marketing}
                onChange={() =>
                  setCookiesUISettings({
                    ...cookiesUISettings,
                    marketing: !cookiesUISettings.marketing,
                  })
                }
              />
            </div>
            <div className="text-right text-gray-500 dark:text-gray-500-dark">
              {t("cookiesMarketingDescription")}
            </div>
          </li>
        )}
      </ul>

      <div className="mt-5 w-full text-right">
        {!!PUBLIC_COOKIEBOT_ID && (
          <Button
            variant="primary"
            className="mr-2"
            onClick={() => {
              showCookiebotBanner();
              setIsBannerVisible(false);
              onClose();
            }}
          >
            Advanced Settings
          </Button>
        )}
        <Button variant="primary" onClick={() => onSubmit(cookiesUISettings)}>
          {t("saveSelected")}
        </Button>
      </div>
    </BaseModal>
  );
};

export default CookiesModal;
