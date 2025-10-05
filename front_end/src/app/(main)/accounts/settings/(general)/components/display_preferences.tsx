"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import LanguagePreferences from "@/app/(main)/accounts/settings/(general)/components/language_preferences";
import ThemePreferences from "@/app/(main)/accounts/settings/(general)/components/theme_preferences";
import PreferencesSection from "@/app/(main)/accounts/settings/components/preferences_section";
import LoadingSpinner from "@/components/ui/loading_spiner";
import RadioButtonGroup, {
  RadioOption,
} from "@/components/ui/radio_button_group";
import { useServerAction } from "@/hooks/use_server_action";
import { CurrentUser, InterfaceType } from "@/types/users";

type Props = {
  user: CurrentUser;
};

const DisplayPreferences: FC<Props> = ({ user }) => {
  const t = useTranslations();

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
      <LanguagePreferences user={user} />
    </PreferencesSection>
  );
};

export default DisplayPreferences;
