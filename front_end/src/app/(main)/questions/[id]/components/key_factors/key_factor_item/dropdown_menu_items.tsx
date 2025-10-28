"use client";

import { faTimesCircle } from "@fortawesome/free-regular-svg-icons";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import { useKeyFactorsContext } from "@/app/(main)/questions/[id]/components/key_factors/key_factors_provider";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";

type Props = {
  keyFactor: KeyFactor;
  projectPermission?: ProjectPermissions;
};

const KeyFactorDropdownMenuItems: FC<Props> = ({
  keyFactor,
  projectPermission,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { openDeleteModal } = useKeyFactorsContext();

  const canEdit =
    user?.id === keyFactor.author.id ||
    projectPermission === ProjectPermissions.ADMIN;

  const menuItems: MenuItemProps[] = [
    ...(canEdit
      ? [
          {
            id: "delete-key-factor",
            element: (
              <div
                className="inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap px-3 py-2 text-xs text-salmon-700 dark:text-salmon-700-dark"
                onClick={() => {
                  console.log("clicked");
                  openDeleteModal(keyFactor.id);
                }}
              >
                <span>{t("deleteKeyFactor")}</span>
                <FontAwesomeIcon icon={faTimesCircle} />
              </div>
            ),
          },
        ]
      : []),
  ];

  if (!menuItems.length) {
    return null;
  }

  return (
    <DropdownMenu
      items={menuItems}
      className="border-gray-300 dark:border-gray-300-dark"
    >
      <Button
        aria-label="menu"
        variant="tertiary"
        size="sm"
        presentationType="icon"
      >
        <FontAwesomeIcon icon={faEllipsis} />
      </Button>
    </DropdownMenu>
  );
};

export default KeyFactorDropdownMenuItems;
