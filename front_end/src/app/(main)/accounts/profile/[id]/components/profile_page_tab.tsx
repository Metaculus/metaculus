"use client";

import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { ProfilePageMode } from "@/types/users";

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
  ];

  return (
    <ButtonGroup
      value={mode}
      buttons={managementModeButtons}
      onChange={() => {}}
      variant="tertiary"
      className={classNames(
        "hover:!dark:bg-blue-800 !bg-blue-100 !font-light capitalize !leading-5 !text-blue-900 hover:!bg-blue-200 dark:!border-blue-950 dark:!bg-blue-950 dark:!text-white"
      )}
      activeClassName={classNames(
        "!bg-blue-900 !text-white hover:!bg-blue-800 dark:!bg-blue-100 dark:!text-blue-900 dark:hover:!bg-blue-200"
      )}
    />
  );
};

export default ProfilePageTabs;
