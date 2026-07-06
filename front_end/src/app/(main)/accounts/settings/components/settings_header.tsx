"use client";

import {
  faBell,
  faGear,
  faRobot,
  faUser,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { useAuth } from "@/contexts/auth_context";
import { isPathEqual } from "@/utils/navigation";

const SettingsHeader: FC = ({}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const pathname = usePathname();
  const tabsOptions: GroupButton<string>[] = [
    {
      value: "general",
      label: <TabItem icon={faGear} label={t("settingsGeneral")} />,
      href: "/accounts/settings/",
    },
    {
      value: "notifications",
      label: <TabItem icon={faBell} label={t("settingsNotifications")} />,
      href: "/accounts/settings/notifications/",
    },
    ...(!user?.is_bot
      ? [
          {
            value: "bots",
            label: <TabItem icon={faRobot} label={t("myForecastingBots")} />,
            href: "/accounts/settings/bots/",
          },
        ]
      : []),
    {
      value: "account",
      label: <TabItem icon={faUser} label={t("settingsAccount")} />,
      href: "/accounts/settings/account/",
    },
  ];
  const currentPage =
    tabsOptions.find(({ href }) => isPathEqual(pathname, href ?? ""))?.value ??
    "general";

  return (
    <div className="flex flex-col gap-3">
      <h1 className="m-0 text-blue-800 dark:text-blue-800-dark">
        {t("settings")}
      </h1>
      <div className="text-sm text-gray-600 dark:text-gray-600-dark">
        {t("settingsDescription")}
      </div>
      <div className="-ml-4 w-[calc(100%+32px)] overflow-scroll px-4 no-scrollbar sm:ml-0 sm:w-full sm:px-0">
        <ButtonGroup
          value={currentPage}
          buttons={tabsOptions}
          onChange={() => {}}
          variant="tertiary"
          containerClassName="w-max"
        />
      </div>
    </div>
  );
};

const TabItem: FC<{ icon: IconDefinition; label: string }> = ({
  icon,
  label,
}) => {
  return (
    <div className="flex gap-2">
      <FontAwesomeIcon icon={icon} />
      <span>{label}</span>
    </div>
  );
};

export default SettingsHeader;
