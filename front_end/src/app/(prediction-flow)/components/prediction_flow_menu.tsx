import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { isPostPredicted } from "@/utils/forecasts/helpers";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { usePredictionFlow } from "./prediction_flow_provider";

type Props = {
  posts: PostWithForecasts[];
};

const PredictionFlowMenu: FC<Props> = ({ posts }) => {
  const t = useTranslations();
  const { currentPostId, setCurrentPostId } = usePredictionFlow();

  return (
    <div className="mt-5 flex w-full flex-col gap-2.5 overflow-y-scroll rounded-[4px] border border-blue-400 bg-gray-0 p-2 dark:border-blue-400-dark dark:bg-gray-0-dark">
      {posts.map((post) => {
        const isPredicted = isPostPredicted(post);
        const isActive = currentPostId === post.id;
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
            onClick={() => setCurrentPostId(post.id)}
          >
            <span className="text-sm font-medium leading-5 text-gray-700 dark:text-gray-700-dark">
              {post.title}
            </span>
            <div className="flex flex-row gap-2">
              {/* TODO: implement prediction and question state chips */}
              <span className="flex h-5 min-w-10 items-center justify-center border border-orange-300 bg-orange-100 px-1 py-0.5 text-xs font-bold leading-4 text-orange-800 dark:border-orange-300-dark dark:bg-orange-100-dark dark:text-orange-800-dark">
                {getUserPredictionState(post)}
              </span>
              {true && (
                <span className="flex items-center justify-center bg-gray-0 px-1 py-0.5 text-xs font-bold leading-4 dark:bg-gray-0-dark">
                  {isPredicted
                    ? t(
                        Math.random() > 0.5
                          ? "potentialyStale"
                          : "significantMovement"
                      )
                    : t("notForecasted")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function getUserPredictionState(post: PostWithForecasts) {
  const isPredicted = isPostPredicted(post);
  if (isQuestionPost(post)) {
    if (post.question.type === QuestionType.MultipleChoice) {
      const optionsAmount = post.question.options?.length;
      return `${isPredicted ? optionsAmount : 0}/${optionsAmount} subquestions`;
    }
    const latest = post.question.my_forecasts?.latest;
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

  if (isConditionalPost(post)) {
    const { question_yes, question_no } = post.conditional;
    let questionsPredicted = 0;
    if (!!question_yes.my_forecasts?.history.length) {
      questionsPredicted++;
    }
    if (!!question_no.my_forecasts?.history.length) {
      questionsPredicted++;
    }
    return `${questionsPredicted}/2 subquestions`;
  }

  if (isGroupOfQuestionsPost(post)) {
    const questionsPredicted = post.group_of_questions.questions.filter(
      (question) => question.my_forecasts?.history.length
    ).length;
    return `${questionsPredicted}/${post.group_of_questions.questions.length} subquestions`;
  }

  return "—";
}
export default PredictionFlowMenu;
