"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { useAuth } from "@/contexts/auth_context";
import { UserProfile } from "@/types/users";
import { isPathEqual } from "@/utils/navigation";

type Props = {
  profile: UserProfile;
};

const ProfileMenu: FC<Props> = ({
  profile: { id, comments_count, posts_authored_count },
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const pathname = usePathname();
  const isCurrentUser = user?.id === id;

  const tabsOptions: GroupButton<string>[] = [
    {
      value: "overview",
      label: t("overview"),
      href: `/accounts/profile/${id}/`,
    },
    {
      value: "trackRecord",
      label: t("trackRecord"),
      href: `/accounts/profile/${id}/track-record/`,
    },
    {
      value: "medals",
      label: t("medals"),
      href: `/accounts/profile/${id}/medals/`,
    },
    ...(!!comments_count
      ? [
          {
            value: "comments",
            label: t("comments"),
            href: `/accounts/profile/${id}/comments/`,
          },
        ]
      : []),
    ...(!!posts_authored_count
      ? [
          {
            value: "questions",
            label: t("questions"),
            href: `/accounts/profile/${id}/questions/`,
          },
        ]
      : []),
    ...(isCurrentUser
      ? [
          {
            value: "privateNotes",
            label: t("privateNotes"),
            href: `/accounts/profile/${id}/private-notes/`,
          },
        ]
      : []),
  ];
  const currentPage =
    tabsOptions.find(({ href }) => isPathEqual(pathname, href ?? ""))?.value ??
    "general";

  return (
    <div className="flex flex-col gap-3">
      <ButtonGroup
        value={currentPage}
        buttons={tabsOptions}
        onChange={() => {}}
        variant="tertiary"
        className="text-nowrap"
      />
    </div>
  );
};

export default ProfileMenu;
