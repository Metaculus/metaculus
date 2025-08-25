"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import LoadingSpinner from "@/components/ui/loading_spiner";
import RadioButtonGroup, {
  RadioOption,
} from "@/components/ui/radio_button_group";
import { useAuth } from "@/contexts/auth_context";
import useAppTheme from "@/hooks/use_app_theme";
import useMounted from "@/hooks/use_mounted";
import { AppTheme } from "@/types/theme";

const ThemePreferences: FC = () => {
  const t = useTranslations();
  const { themeChoice, setTheme, isSyncing } = useAppTheme();
  const { user } = useAuth();
  const mounted = useMounted();

  const currentTheme = useMemo(() => {
    if (user?.app_theme) return user.app_theme;
    if (mounted && Object.values(AppTheme).includes(themeChoice as AppTheme))
      return themeChoice;

    return AppTheme.System;
  }, [user?.app_theme, themeChoice, mounted]);

  const themeTypeOptions: RadioOption<AppTheme>[] = [
    {
      value: AppTheme.System,
      label: t("settingsThemeSystemDefault"),
    },
    {
      value: AppTheme.Light,
      label: t("settingsThemeLightMode"),
    },
    {
      value: AppTheme.Dark,
      label: t("settingsThemeDarkMode"),
    },
  ];

  return (
    <div>
      <div className="flex gap-2.5 text-gray-500 dark:text-gray-500-dark">
        <span>{t("settingsThemeSelection")}</span>
        {isSyncing && <LoadingSpinner size="1x" />}
      </div>
      <RadioButtonGroup
        value={currentTheme}
        name="app_theme"
        options={themeTypeOptions}
        onChange={(value) => !isSyncing && setTheme(value)}
        className="mt-2.5"
      />
    </div>
  );
};

export default ThemePreferences;
