import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { PredictionFlowPost } from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  isOpenQuestionPredicted,
  isPostOpenQuestionPredicted,
} from "@/utils/forecasts/helpers";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

import { FlowType, usePredictionFlow } from "./prediction_flow_provider";
import { isPostStale, isPostWithSignificantMovement } from "../helpers";

type Props = {
  posts: PredictionFlowPost[];
};

const PredictionFlowMenu: FC<Props> = ({ posts }) => {
  const t = useTranslations();
  const { currentPostId, changeActivePost, flowType, setIsMenuOpen } =
    usePredictionFlow();

  return (
    <div className="mt-5 flex w-full flex-col gap-2.5 overflow-y-scroll rounded-[4px] border border-blue-400 bg-gray-0 p-2 dark:border-blue-400-dark dark:bg-gray-0-dark">
      {posts.map((post) => {
        const isActive = currentPostId === post.id;
        const attentionChipText = !isNil(flowType)
          ? getAttentionChipText(post, t, flowType)
          : null;
        return (
          <div
            key={post.id}
            className={cn(
              "flex cursor-pointer flex-col gap-2 rounded-sm border-2 border-transparent bg-blue-200 p-2.5 hover:border-blue-600 dark:bg-blue-200-dark dark:hover:border-blue-600-dark",
              {
                "border-blue-700 bg-gray-0 dark:border-blue-700-dark dark:bg-gray-0-dark":
                  isActive,
              }
            )}
            onClick={() => {
              changeActivePost(post.id);
              setIsMenuOpen(false);
            }}
          >
            <span className="text-sm font-medium leading-5 text-gray-700 dark:text-gray-700-dark">
              {post.title}
            </span>
            <div className="flex flex-row gap-2">
              <span
                className={cn(
                  "flex min-w-10 items-center justify-center border border-orange-300 bg-orange-100 px-1 py-0.5 text-xs font-bold leading-4 text-orange-800 dark:border-orange-300-dark dark:bg-orange-100-dark dark:text-orange-800-dark",
                  {
                    "border-salmon-500 bg-salmon-300 text-salmon-800 dark:border-salmon-500-dark dark:bg-salmon-300-dark dark:text-salmon-800-dark":
                      !isPostOpenQuestionPredicted(post),
                  }
                )}
              >
                {getUserPredictionChip(post, t)}
              </span>
              {!isNil(attentionChipText) && (
                <span className="flex items-center justify-center bg-gray-0 px-1 py-0.5 text-xs font-bold leading-4 dark:bg-gray-0-dark">
                  {attentionChipText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function getUserPredictionChip(
  post: PredictionFlowPost,
  t: ReturnType<typeof useTranslations>
) {
  const isPredicted = isPostOpenQuestionPredicted(post);
  if (!isNil(post.question)) {
    if (post.question.type === QuestionType.MultipleChoice) {
      const optionsAmount = post.question.options?.length;
      return `${isPredicted ? optionsAmount : 0}/${optionsAmount} ${t("options")}`;
    }
    const latest = post.question.my_forecast?.latest;
    if (latest && !latest.end_time) {
      return getPredictionDisplayValue(
        latest.centers ? latest.centers[0] : latest.forecast_values[1],
        {
          questionType: post.question.type,
          scaling: post.question.scaling,
          actual_resolve_time: post.question.actual_resolve_time ?? null,
        }
      );
    }

    return "—";
  }

  if (!isNil(post.conditional)) {
    const { question_yes, question_no } = post.conditional;
    let questionsPredicted = 0;
    if (isOpenQuestionPredicted(question_yes)) {
      questionsPredicted++;
    }
    if (isOpenQuestionPredicted(question_no)) {
      questionsPredicted++;
    }
    return `${questionsPredicted}/2 ${t("subquestions")}`;
  }

  if (!isNil(post.group_of_questions)) {
    const questionsPredicted = post.group_of_questions.questions.filter(
      (question) => isOpenQuestionPredicted(question)
    ).length;
    return `${questionsPredicted}/${post.group_of_questions.questions.length} ${t("subquestions")}`;
  }

  return "—";
}

function getAttentionChipText(
  post: PredictionFlowPost,
  t: ReturnType<typeof useTranslations>,
  flowType: FlowType
) {
  const isPredicted = isPostOpenQuestionPredicted(post);
  if (!isPredicted) {
    return t("notPredicted");
  }
  if (flowType === FlowType.STALE) {
    return t("potentialyStale");
  } else if (flowType === FlowType.MOVEMENT) {
    return t("significantMovement");
  } else {
    if (isPostWithSignificantMovement(post)) {
      return t("significantMovement");
    }
    if (isPostStale(post)) {
      return t("potentialyStale");
    }
  }
  return null;
}
export default PredictionFlowMenu;
