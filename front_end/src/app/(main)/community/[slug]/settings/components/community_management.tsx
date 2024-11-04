"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Button from "@/components/ui/button";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { Community, CommunitySettingsMode } from "@/types/projects";

type Props = {
  community: Community;
  mode: CommunitySettingsMode;
};

const CommunityManagement: FC<Props> = ({ community, mode }) => {
  const t = useTranslations();
  const router = useRouter();

  const managementModeButtons: GroupButton<CommunitySettingsMode>[] = [
    { label: t("questions"), value: CommunitySettingsMode.Questions },
    { label: t("settings"), value: CommunitySettingsMode.Settings },
  ];

  return (
    <div className="relative">
      <div className="flex items-center">
        <Button
          variant="text"
          className="mr-3 !p-0"
          href={`/community/${community.slug}`}
        >
          <FontAwesomeIcon
            className="text-blue-700/40 dark:text-blue-700-dark/40"
            icon={faArrowLeft}
            width={20}
            size="xl"
          />
        </Button>

        <h1 className="m-0 max-w-[250px] truncate text-xl font-medium text-blue-900 dark:text-blue-900-dark xs:max-w-full xs:text-2xl">
          {t("communityManagement")}
        </h1>
      </div>

      <div className="mt-6 flex flex-row text-xs font-medium md:text-sm">
        <ButtonGroup
          value={mode}
          buttons={managementModeButtons}
          onChange={(mode) =>
            router.push(`/community/${community.slug}/settings?mode=${mode}`)
          }
          variant="tertiary"
          className="capitalize"
        />
      </div>

      <hr className="text -mx-3 border-blue-500 dark:border-blue-600/50 xs:-mx-8" />
    </div>
  );
};

export default CommunityManagement;
