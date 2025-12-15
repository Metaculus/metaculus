"use client";

import { faTimesCircle } from "@fortawesome/free-regular-svg-icons";
import {
  faCommentDots,
  faEllipsis,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import {
  useKeyFactorDelete,
  useKeyFactorModeration,
} from "@/app/(main)/questions/[id]/components/key_factors/hooks";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

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

  const isAdmin = projectPermission === ProjectPermissions.ADMIN;
  const { openDeleteModal } = useKeyFactorDelete();
  const { reportSpam, openDispute } = useKeyFactorModeration();

  const isAuthor = user?.id === keyFactor.author.id;

  const showDelete = isAuthor || isAdmin;
  const showReportDispute = !isAuthor;

  const menuItems: MenuItemProps[] = [
    ...(showDelete
      ? [
          {
            id: "delete-key-factor",
            element: (
              <div
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2.5 whitespace-nowrap px-3 py-2 text-xs text-salmon-700 hover:bg-blue-100 dark:text-salmon-700-dark dark:hover:bg-blue-100-dark",
                  "border-b-[1px] border-gray-300 dark:border-gray-300-dark"
                )}
                onClick={() => openDeleteModal(keyFactor.id)}
              >
                <span>{t("deleteKeyFactor")}</span>
                <FontAwesomeIcon icon={faTimesCircle} />
              </div>
            ),
          },
        ]
      : []),
    // Admin actions
    ...(isAdmin
      ? [
          {
            id: "freshness",
            element: (
              <div
                className={cn(
                  "inline-flex items-center justify-end gap-2.5 whitespace-nowrap px-3 py-2 text-xs",
                  showReportDispute &&
                    "border-b-[1px] border-gray-300 dark:border-gray-300-dark"
                )}
              >
                <span>Freshness: {keyFactor.freshness?.toFixed(2)}</span>
              </div>
            ),
          },
        ]
      : []),
    ...(showReportDispute
      ? [
          {
            id: "report-spam",
            element: (
              <div
                className="inline-flex cursor-pointer items-center justify-end gap-2.5 whitespace-nowrap border-b-[1px] border-gray-300 px-3 py-2 text-xs text-blue-700 hover:bg-blue-100 dark:border-gray-300-dark dark:text-blue-700-dark dark:hover:bg-blue-100-dark"
                onClick={() => reportSpam(keyFactor)}
              >
                <span>{t("reportSpam")}</span>
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
            ),
          },
          {
            id: "dispute",
            element: (
              <div
                className="inline-flex cursor-pointer items-center justify-end gap-2.5 whitespace-nowrap px-3 py-2 text-xs text-blue-700 hover:bg-blue-100 dark:text-blue-700-dark dark:hover:bg-blue-100-dark"
                onClick={() => openDispute(keyFactor)}
              >
                <span>{t("dispute")}</span>
                <FontAwesomeIcon icon={faCommentDots} />
              </div>
            ),
          },
        ]
      : []),
  ];

  if (!menuItems.length) return null;

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
