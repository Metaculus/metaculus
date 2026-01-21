"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale, useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";
import { FC } from "react";

import { updateLanguagePreference } from "@/app/(main)/accounts/profile/actions";
import { APP_LANGUAGES } from "@/components/language_menu";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Select from "@/components/ui/select";
import { useServerAction } from "@/hooks/use_server_action";
import { CurrentUser } from "@/types/users";
import { logError } from "@/utils/core/errors";

type Props = {
  user: CurrentUser;
};

const LanguagePreferences: FC<Props> = ({ user }) => {
  const t = useTranslations();
  const currentLocale = useLocale();
  const posthog = usePostHog();

  const [updateLanguage, isPendingUpdateLanguage] = useServerAction(
    async (language: string) => {
      if (!isPendingUpdateLanguage) {
        const previousLanguage = user.language || currentLocale;

        // Track language change in PostHog
        posthog.capture("language_changed", {
          previous_language: previousLanguage,
          new_language: language,
        });

        // Update user property for language
        posthog.setPersonProperties({ language });

        updateLanguagePreference(language).catch(logError);
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
    <div>
      <div className="flex gap-2.5 text-gray-500 dark:text-gray-500-dark">
        <span>{t("settingsDefaultLanguage")}</span>
        {isPendingUpdateLanguage && <LoadingSpinner size="1x" />}
      </div>
      <div className="relative mt-2.5 inline-block">
        {/* Language icon overlay */}
        <div className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-lg font-bold">
          <span className="text-blue-800 dark:text-blue-800-dark">a</span>
          <span className="text-gray-400 dark:text-gray-400-dark">/</span>
          <span className="text-salmon-600 dark:text-salmon-600-dark">文</span>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-3 z-10 flex items-center">
          <FontAwesomeIcon
            size="2xs"
            icon={faChevronDown}
            className="block text-gray-500 dark:text-gray-500-dark"
          />
        </div>
        <Select
          className="w-full cursor-pointer appearance-none rounded border border-blue-400 bg-white py-4 pl-[56px] pr-8 text-base leading-5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-gray-900-dark dark:focus:border-blue-500-dark dark:focus:ring-blue-500-dark"
          style={{
            WebkitAppearance: "none",
            MozAppearance: "none",
          }}
          value={selectedLanguage}
          options={localeOptions}
          onChange={(e) => {
            void updateLanguage(e.target.value);
          }}
          disabled={isPendingUpdateLanguage}
        />
      </div>
    </div>
  );
};

export default LanguagePreferences;
