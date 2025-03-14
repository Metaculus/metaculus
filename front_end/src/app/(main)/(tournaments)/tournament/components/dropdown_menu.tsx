"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { Tournament } from "@/types/projects";
import cn from "@/utils/cn";

type Props = {
  tournament: Tournament;
  variant?: "image_overflow" | "default";
};

const TournamentDropdownMenu: FC<Props> = ({
  tournament,
  variant = "default",
}) => {
  const t = useTranslations();

  const { user } = useAuth();

  const menuItems: MenuItemProps[] = [];
  if (user?.is_superuser) {
    menuItems.push({
      id: "viewDjangoAdmin",
      name: t("viewInDjangoAdmin"),
      link: `/admin/projects/project/${tournament.id}/change/`,
      openNewTab: true,
    });
  }

  if (!menuItems.length) {
    return null;
  }

  return (
    <DropdownMenu items={menuItems} className="normal-case">
      <Button
        className={cn({
          "border-0 bg-black/50 hover:bg-black/30 dark:bg-black/50":
            variant === "image_overflow",
        })}
        presentationType="icon"
        variant="tertiary"
      >
        <FontAwesomeIcon
          icon={faEllipsis}
          className={cn({
            "text-gray-0 dark:text-gray-0": variant === "image_overflow",
          })}
        />
      </Button>
    </DropdownMenu>
  );
};

export default TournamentDropdownMenu;
