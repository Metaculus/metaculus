"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { ProfilePageMode, UserProfile } from "@/types/users";

type Props = {
  mode: ProfilePageMode;
  profile: UserProfile;
};
const ProfilePageTabs: FC<Props> = ({ mode, profile }) => {
  const t = useTranslations();
  const id = profile.id;
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

  if (!!profile.posts_authored_count) {
    managementModeButtons.push({
      label: t("questions"),
      value: ProfilePageMode.Questions,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.Questions}`,
    });
  }

  return (
    <ButtonGroup
      value={mode}
      buttons={managementModeButtons}
      onChange={() => {}}
      variant="tertiary"
    />
  );
};

export default ProfilePageTabs;
