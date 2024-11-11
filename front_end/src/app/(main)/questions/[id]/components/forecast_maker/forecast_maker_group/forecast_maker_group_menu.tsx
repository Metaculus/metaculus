"use client";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useState } from "react";

import { unresolveQuestion as unresolveQuestionAction } from "@/app/(main)/questions/actions";
import DropdownMenu from "@/components/ui/dropdown_menu";
import LoadingSpinner from "@/components/ui/loading_spiner";
import LocalDaytime from "@/components/ui/local_daytime";
import Tooltip from "@/components/ui/tooltip";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import { Post, ProjectPermissions, QuestionStatus } from "@/types/post";
import { Question } from "@/types/question";
import { logError } from "@/utils/errors";
import { canChangeQuestionResolution } from "@/utils/questions";

import { SLUG_POST_SUB_QUESTION_ID } from "../../../search_params";
import SidebarTooltip from "../../sidebar/sidebar_tooltip";
import QuestionResolutionModal from "../resolution/resolution_modal";

type Props = {
  question: Question;
  permission?: ProjectPermissions;
  button?: ReactNode;
  post?: Post;
};

const ForecastMakerGroupControls: FC<Props> = ({
  question,
  button,
  permission,
  post,
}) => {
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const [unresolveQuestion, isPending] = useServerAction(
    unresolveQuestionAction
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      logError(err, `${t("failedToCopyText")} ${err}`);
    }
  };

  return (
    <>
      <DropdownMenu
        className="w-[274px] border-gray-500 p-6 dark:border-gray-500-dark"
        itemClassName="!p-0 !py-2"
        items={[
          ...[
            {
              id: "questionInfoHeader",
              element: (
                <p className="mb-4 mt-0 text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
                  {t("subquestionDetails")}
                </p>
              ),
            },
            {
              id: "questionInfo",
              element: <GroupQuestionInfo question={question} />,
            },
            {
              id: "lineBreak",
              element: (
                <hr className="my-4 border-gray-300 dark:border-gray-300-dark" />
              ),
            },
            {
              id: "actionsHeader",
              element: (
                <p className="m-0 mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
                  {t("actions")}
                </p>
              ),
            },
          ],
          ...(canChangeQuestionResolution(question, permission)
            ? [
                {
                  id: "resolve",
                  name: t("resolve"),
                  onClick: () => setIsResolutionModalOpen(true),
                },
              ]
            : []),
          ...(canChangeQuestionResolution(question, permission, false)
            ? [
                {
                  id: "unresolve",
                  name: t("unresolve"),
                  onClick: () =>
                    setCurrentModal({
                      type: "confirm",
                      data: { onConfirm: () => unresolveQuestion(question.id) },
                    }),
                },
              ]
            : []),
          {
            id: "copyLink",
            name: t("copyLink"),
            onClick: () => {
              copyToClipboard(
                `${window.location.origin}${window.location.pathname}?${SLUG_POST_SUB_QUESTION_ID}=${question.id}`
              ).then();
            },
          },
          {
            id: "downloadCSV",
            name: t("downloadCSV"),
            onClick: () => {
              window.open(
                `/api/posts/${post!.id}/download-csv/?sub-question=${question.id}`
              );
            },
          },
        ]}
        textAlign="left"
      >
        {isPending ? (
          <LoadingSpinner size="lg" className="h-[32px] w-[32px]" />
        ) : (
          button
        )}
      </DropdownMenu>

      <QuestionResolutionModal
        question={question}
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
      />
    </>
  );
};

const GroupQuestionInfo = ({ question }: { question: Question }) => {
  const t = useTranslations();

  const isUpcoming = new Date(question.open_time || "").getTime() > Date.now();
  return (
    <div className="flex flex-col items-start gap-4 self-stretch @container">
      <div className="flex flex-col justify-between gap-4 self-stretch @lg:grid @lg:grid-cols-4 @lg:gap-1 @lg:gap-y-5">
        {question.open_time && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t(isUpcoming ? "opens" : "opened")}:
            </span>
            <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              <LocalDaytime date={question.open_time} />
            </span>
          </div>
        )}

        <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
          <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
            {question.status === QuestionStatus.CLOSED
              ? t("closed")
              : t("closes")}
            :
          </span>
          <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
            {question.scheduled_close_time && (
              <LocalDaytime date={question.scheduled_close_time} />
            )}
          </span>
        </div>

        {question.question_weight !== 1.0 && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t("questionWeight")}:
            </span>
            <span className="leading-4">
              <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
                {Math.round(question.question_weight * 100)}%
              </span>

              <SidebarTooltip
                tooltipContent={t.rich("questionWeightTooltip", {
                  count: question.question_weight - 1 < 0 ? 1 : 2,
                  weight: Math.round(question.question_weight * 100),
                  weightDiff: Math.round(
                    Math.abs(1 - question.question_weight) * 100
                  ),
                  bold: (chunks) => <span className="font-bold">{chunks}</span>,
                })}
              />
            </span>
          </div>
        )}

        {question?.include_bots_in_aggregates && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t("includeBots")}:
            </span>
            <span className="leading-4">
              <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
                {t("Yes")}
              </span>
              <SidebarTooltip
                tooltipContent={t.rich("includeBotsTooltip", {
                  link: (chunks) => (
                    <Link
                      href={"/aib"}
                      className="inline-block text-sm font-medium leading-5 text-blue-700 dark:text-blue-700-dark"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default ForecastMakerGroupControls;
