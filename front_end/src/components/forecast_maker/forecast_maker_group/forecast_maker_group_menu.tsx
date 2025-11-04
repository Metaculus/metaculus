"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useState } from "react";

import IncludeBotsInfo from "@/app/(main)/questions/[id]/components/sidebar/question_info/include_bots_info";
import QuestionWeightInfo from "@/app/(main)/questions/[id]/components/sidebar/question_info/question_weight_info";
import { SLUG_POST_SUB_QUESTION_ID } from "@/app/(main)/questions/[id]/search_params";
import {
  unresolveQuestion as unresolveQuestionAction,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import DropdownMenu from "@/components/ui/dropdown_menu";
import LoadingSpinner from "@/components/ui/loading_spiner";
import LocalDaytime from "@/components/ui/local_daytime";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import { Post, ProjectPermissions, QuestionStatus } from "@/types/post";
import {
  Question,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { logError } from "@/utils/core/errors";
import { canWithdrawForecast } from "@/utils/questions/predictions";
import { canChangeQuestionResolution } from "@/utils/questions/resolution";

import QuestionResolutionModal from "../resolution/resolution_modal";
import WithdrawConfirmation from "../withdraw/withdraw_confirmation";

type Props = {
  question: Question;
  permission?: ProjectPermissions;
  button?: ReactNode;
  post?: Post;
  onPredictionSubmit?: () => void;
};

const ForecastMakerGroupControls: FC<Props> = ({
  question,
  button,
  permission,
  post,
  onPredictionSubmit,
}) => {
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const [unresolveQuestion, isPending] = useServerAction(
    unresolveQuestionAction
  );

  const handleWithdraw = async () => {
    if (post) {
      await withdrawForecasts(post.id, [{ question: question.id }]);
      onPredictionSubmit?.();
      setIsWithdrawModalOpen(false);
    }
  };

  const [withdraw, withdrawalIsPending] = useServerAction(handleWithdraw);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      logError(err, { message: `failed to copy text: ${err}` });
    }
  };

  return (
    <>
      <DropdownMenu
        className="w-[274px] !overflow-visible border-gray-500 p-6 dark:border-gray-500-dark"
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
          ...(canWithdrawForecast(
            question as QuestionWithForecasts,
            permission
          ) &&
          !isNil(post) &&
          question.type === QuestionType.Binary
            ? [
                {
                  id: "withdraw",
                  name: t("withdrawForecast"),
                  onClick: () => {
                    setIsWithdrawModalOpen(true);
                  },
                },
              ]
            : []),
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
                      data: {
                        title: t("confirmUnresolveQuestion"),
                        onConfirm: () => unresolveQuestion(question.id),
                      },
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
        ]}
        textAlign="left"
      >
        {isPending ? (
          <LoadingSpinner size="lg" className="size-[26px]" />
        ) : (
          button
        )}
      </DropdownMenu>

      <QuestionResolutionModal
        question={question}
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
      />

      {/* Withdraw Confirmation Modal */}
      <WithdrawConfirmation
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSubmit={withdraw}
        isPending={withdrawalIsPending}
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

        <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
          <span className="w-min text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
            {question.status === QuestionStatus.RESOLVED
              ? t("resolved")
              : t("scheduledResolution")}
            :
          </span>
          <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
            <LocalDaytime
              date={
                (question.status === QuestionStatus.RESOLVED &&
                  question.actual_resolve_time) ||
                question.scheduled_resolve_time
              }
            />
          </span>
        </div>

        {!!question.spot_scoring_time && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="w-min text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t("spotScoingTime")}:
            </span>
            <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              <LocalDaytime date={question.spot_scoring_time} />
            </span>
          </div>
        )}

        <QuestionWeightInfo questionWeight={question.question_weight} />
        <IncludeBotsInfo
          includeBotsInAggregate={question.include_bots_in_aggregates}
        />
      </div>
    </div>
  );
};
export default ForecastMakerGroupControls;
