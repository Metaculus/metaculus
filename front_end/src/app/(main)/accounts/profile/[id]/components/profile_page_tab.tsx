"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { useAuth } from "@/contexts/auth_context";
import { ProfilePageMode, UserProfile } from "@/types/users";

type Props = {
  mode: ProfilePageMode;
  profile: UserProfile;
};
const ProfilePageTabs: FC<Props> = ({ mode, profile }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const id = profile.id;
  const isCurrentUser = user?.id === id;

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
  ];

  if (!!profile.comments_count) {
    managementModeButtons.push({
      label: t("comments"),
      value: ProfilePageMode.Comments,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.Comments}`,
    });
  }

  if (!!profile.posts_authored_count) {
    managementModeButtons.push({
      label: t("questions"),
      value: ProfilePageMode.Questions,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.Questions}`,
    });
  }

  if (isCurrentUser) {
    managementModeButtons.push({
      label: t("privateNotes"),
      value: ProfilePageMode.PrivateNotes,
      href: `/accounts/profile/${id}?mode=${ProfilePageMode.PrivateNotes}`,
    });
  }

  return (
    <ButtonGroup
      value={mode}
      buttons={managementModeButtons}
      onChange={() => {}}
      variant="tertiary"
      className="text-nowrap"
    />
  );
};

export default ProfilePageTabs;
