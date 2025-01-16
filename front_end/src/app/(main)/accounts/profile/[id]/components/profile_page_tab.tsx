"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { ProfilePageMode } from "@/types/users";
import cn from "@/utils/cn";

type Props = {
  mode: ProfilePageMode;
  id: number;
};
const ProfilePageTabs: FC<Props> = ({ mode, id }) => {
  const t = useTranslations();
  const managementModeButtons: GroupButton<ProfilePageMode>[] = [
    {
      label: t("overview"),
      value: ProfilePageMode.Overview,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.Overview}`,
    },
    {
      label: t("trackRecord"),
      value: ProfilePageMode.TrackRecord,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.TrackRecord}`,
    },
    {
      label: t("medals"),
      value: ProfilePageMode.Medals,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.Medals}`,
    },
    {
      label: t("comments"),
      value: ProfilePageMode.Comments,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.Comments}`,
    },
    {
      label: t("questions"),
      value: ProfilePageMode.Questions,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.Questions}`,
    },
  ];

  return (
    <ButtonGroup
      value={mode}
      buttons={managementModeButtons}
      onChange={() => {}}
      variant="tertiary"
      className={cn(
        "text-nowrap bg-blue-100 font-light capitalize leading-5 text-blue-900 hover:bg-blue-200 dark:border-blue-950 dark:bg-blue-950 dark:text-white hover:dark:bg-blue-800"
      )}
      activeClassName={cn(
        "bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200"
      )}
    />
  );
};

export default ProfilePageTabs;
