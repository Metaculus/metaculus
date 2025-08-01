"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import {
  updateLanguagePreference,
  updateProfileAction,
} from "@/app/(main)/accounts/profile/actions";
import ThemePreferences from "@/app/(main)/accounts/settings/(general)/components/theme_preferences";
import PreferencesSection from "@/app/(main)/accounts/settings/components/preferences_section";
import { APP_LANGUAGES } from "@/components/language_menu";
import LoadingSpinner from "@/components/ui/loading_spiner";
import RadioButtonGroup, {
  RadioOption,
} from "@/components/ui/radio_button_group";
import Select from "@/components/ui/select";
import { useServerAction } from "@/hooks/use_server_action";
import { CurrentUser, InterfaceType } from "@/types/users";
import { logError } from "@/utils/core/errors";

type Props = {
  user: CurrentUser;
};

const DisplayPreferences: FC<Props> = ({ user }) => {
  const t = useTranslations();
  const currentLocale = useLocale();

  const interfaceTypeOptions: RadioOption<InterfaceType>[] = [
    {
      value: InterfaceType.ConsumerView,
      label: t("consumerView"),
      description: t("consumerViewDescription"),
    },
    {
      value: InterfaceType.ForecasterView,
      label: t("forecasterView"),
      description: t("forecasterViewDescription"),
    },
  ];

  const [updateInterfaceType, isPendingUpdateInterfaceType] = useServerAction(
    async (interface_type: InterfaceType) => {
      if (!isPendingUpdateInterfaceType) {
        await updateProfileAction({
          interface_type,
        });
      }
    }
  );

  const [updateLanguage, isPendingUpdateLanguage] = useServerAction(
    async (language: string) => {
      if (!isPendingUpdateLanguage) {
        await updateLanguagePreference(language).catch(logError);
      }
    }
  );

  const localeOptions = APP_LANGUAGES.map((obj) => ({
    value: obj.locale,
    label: obj.name,
  }));

  // Use user's language preference, fallback to current locale if not set
  const selectedLanguage = user.language || currentLocale;

  return (
    <PreferencesSection title={t("settingsDisplay")}>
      <div>
        <div className="flex gap-2.5 text-gray-500 dark:text-gray-500-dark">
          <span>{t("settingsInterfaceType")}</span>
          {isPendingUpdateInterfaceType && <LoadingSpinner size="1x" />}
        </div>
        <RadioButtonGroup
          value={user.interface_type}
          name="interface_type"
          options={interfaceTypeOptions}
          onChange={updateInterfaceType}
          className="mt-2.5"
        />
      </div>
      <ThemePreferences />
      <div>
        <div className="flex gap-2.5 text-gray-500 dark:text-gray-500-dark">
          <span>{t("settingsDefaultLanguage")}</span>
          {isPendingUpdateLanguage && <LoadingSpinner size="1x" />}
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
            value={selectedLanguage}
            options={localeOptions}
            onChange={(e) => {
              void updateLanguage(e.target.value);
            }}
            disabled={isPendingUpdateLanguage}
          />
        </div>
      </div>
    </PreferencesSection>
  );
};

export default DisplayPreferences;
