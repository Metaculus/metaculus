"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import PreferencesSection from "@/app/(main)/accounts/settings2/components/preferences_section";
import { APP_LANGUAGES } from "@/components/language_menu";
import RadioButtonGroup from "@/components/ui/radio_button_group";
import Select from "@/components/ui/select";
import { CurrentUser } from "@/types/users";

type Props = {
  user: CurrentUser;
};

const DisplayPreferences: FC<Props> = ({}) => {
  const t = useTranslations();
  const [interfaceType, setInterfaceType] = useState<string>("consumerView");
  const interfaceTypeOptions = [
    {
      value: "consumerView",
      label: t("consumerView"),
      description: t("consumerViewDescription"),
    },
    {
      value: "forecasterView",
      label: t("forecasterView"),
      description: t("forecasterViewDescription"),
    },
  ];

  const [themeType, setThemeType] = useState<string>("default");
  const themeTypeOptions = [
    {
      value: "default",
      label: t("settingsThemeSystemDefault"),
    },
    {
      value: "light",
      label: t("settingsThemeLightMode"),
    },
    {
      value: "dark",
      label: t("settingsThemeDarkMode"),
    },
  ];

  const [locale, setLocale] = useState<string>("en");
  const localeOptions = APP_LANGUAGES.map((obj) => ({
    value: obj.locale,
    label: obj.name,
  }));

  return (
    <PreferencesSection title={t("settingsDisplay")}>
      <div>
        <div className="text-gray-500 dark:text-gray-500-dark">
          {t("settingsInterfaceType")}
        </div>
        <RadioButtonGroup
          value={interfaceType}
          name="representation"
          options={interfaceTypeOptions}
          onChange={setInterfaceType}
          className="mt-2.5"
        />
      </div>
      <div>
        <div className="text-gray-500 dark:text-gray-500-dark">
          {t("settingsThemeSelection")}
        </div>
        <RadioButtonGroup
          value={themeType}
          name="theme"
          options={themeTypeOptions}
          onChange={setThemeType}
          className="mt-2.5"
        />
      </div>
      <div>
        <div className="text-gray-500 dark:text-gray-500-dark">
          {t("settingsDefaultLanguage")}
        </div>
        <div className="relative mt-2.5 inline-block">
          {/* Language icon overlay */}
          <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-2">
            <span className="text-lg">
              <span className="text-blue-800 dark:text-blue-800-dark">a</span>
              <span className="text-gray-400 dark:text-gray-400-dark">/</span>
              <span className="text-salmon-600 dark:text-salmon-600-dark">
                文
              </span>
            </span>
          </div>
          <Select
            className="rounded border-blue-400 py-4 pl-[50px] leading-5 dark:border-blue-400-dark"
            value={locale}
            options={localeOptions}
            onChange={(e) => setLocale(e.target.value)}
          />
        </div>
      </div>
    </PreferencesSection>
  );
};

export default DisplayPreferences;
