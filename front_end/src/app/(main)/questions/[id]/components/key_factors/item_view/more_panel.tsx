"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, ReactNode, RefObject } from "react";

import {
  useKeyFactorDelete,
  useKeyFactorModeration,
} from "@/app/(main)/questions/[id]/components/key_factors/hooks";
import { useQuestionLayoutSafe } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";
import { formatRelativeDate } from "@/utils/formatters/date";

import PanelContainer from "./panel_container";

export const ACTION_BTN =
  "mb-[-1px] border border-blue-400 bg-gray-0 px-2 py-1 text-xs font-medium leading-4 transition-colors hover:bg-blue-100 dark:border-blue-400-dark dark:bg-gray-0-dark dark:hover:bg-blue-100-dark";

export type ActionItem = {
  label: string;
  onClick: () => void;
  variant?: "danger";
  icon?: ReactNode;
};

type ActionListProps = {
  ref?: RefObject<HTMLDivElement | null>;
  actions: ActionItem[];
  header?: ReactNode;
  anchorRef: RefObject<HTMLDivElement | null>;
  isCompact?: boolean;
  inline?: boolean;
  onClose: () => void;
};

export const ActionPanel: FC<ActionListProps> = ({
  ref,
  actions,
  header,
  anchorRef,
  isCompact,
  inline,
  onClose,
}) => {
  return (
    <PanelContainer
      ref={ref}
      anchorRef={anchorRef}
      isCompact={isCompact}
      inline={inline}
      onClose={onClose}
    >
      {header}
      <div
        className={cn(
          "flex w-full flex-col overflow-clip pb-px",
          !header && "pt-3"
        )}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={cn(
              ACTION_BTN,
              action.variant === "danger"
                ? "text-salmon-700 dark:text-salmon-700-dark"
                : "text-blue-800 dark:text-blue-800-dark",
              action.icon && "inline-flex items-center justify-center gap-2.5"
            )}
          >
            <span>{action.label}</span>
            {action.icon}
          </button>
        ))}
      </div>
    </PanelContainer>
  );
};

type MorePanelProps = {
  ref?: RefObject<HTMLDivElement | null>;
  keyFactor: KeyFactor;
  projectPermission?: ProjectPermissions;
  anchorRef: RefObject<HTMLDivElement | null>;
  isCompact?: boolean;
  inline?: boolean;
  onClose: () => void;
};

const MorePanel: FC<MorePanelProps> = ({
  ref,
  keyFactor,
  projectPermission,
  anchorRef,
  isCompact,
  inline,
  onClose,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const questionLayout = useQuestionLayoutSafe();
  const isAdmin = projectPermission === ProjectPermissions.ADMIN;
  const { openDeleteModal } = useKeyFactorDelete();
  const { reportSpam, openDispute } = useKeyFactorModeration();

  const isAuthor = user?.id === keyFactor.author.id;
  const showDelete = isAuthor || isAdmin;

  const createdDate = formatRelativeDate(
    locale,
    new Date(keyFactor.created_at)
  );

  const handleViewComment = () => {
    onClose();
    questionLayout?.closeKeyFactorOverlay();
    questionLayout?.setActiveTab("comments");
    setTimeout(() => {
      questionLayout?.requestScrollToComment(keyFactor.comment_id);
    }, 50);
  };

  const actions: ActionItem[] = [
    { label: t("viewComment"), onClick: handleViewComment },
    ...(!isAuthor
      ? [
          {
            label: t("dispute"),
            onClick: () => {
              onClose();
              if (!user) {
                setCurrentModal({ type: "signin" });
                return;
              }
              openDispute(keyFactor);
            },
          },
          {
            label: t("reportSpam"),
            onClick: () => {
              onClose();
              if (!user) {
                setCurrentModal({ type: "signin" });
                return;
              }
              reportSpam(keyFactor);
            },
          },
        ]
      : []),
    ...(showDelete
      ? [
          {
            label: t("deleteKeyFactor"),
            onClick: () => {
              openDeleteModal(keyFactor.id);
              onClose();
            },
            variant: "danger" as const,
          },
        ]
      : []),
  ];

  return (
    <ActionPanel
      ref={ref}
      actions={actions}
      anchorRef={anchorRef}
      isCompact={isCompact}
      inline={inline}
      onClose={onClose}
      header={
        <span
          className={cn(
            "self-start leading-3",
            isCompact ? "text-[8px]" : "text-[10px]"
          )}
        >
          <span className="font-normal text-gray-500 dark:text-gray-500-dark">
            {t("createdTimeAgo", { timeAgo: createdDate })}
          </span>{" "}
          <span className="font-normal text-gray-600 dark:text-gray-600-dark">
            {t("by").toLowerCase()}{" "}
            <span className="text-blue-700 dark:text-blue-700-dark">
              @{keyFactor.author.username}
            </span>
          </span>
        </span>
      }
    />
  );
};

export default MorePanel;
