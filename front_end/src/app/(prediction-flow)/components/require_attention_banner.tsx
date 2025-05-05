import { isNil } from "lodash";
import { useTranslations } from "next-intl";

import { PredictionFlowPost } from "@/types/post";
import { QuestionType } from "@/types/question";
import { isPostPredicted } from "@/utils/forecasts/helpers";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

import { FlowType, usePredictionFlow } from "./prediction_flow_provider";
import { isPostStale, isPostWithSignificantMovement } from "../helpers";

type Props = {
  detailedPost: PredictionFlowPost;
};

const RequireAttentionBanner = ({ detailedPost }: Props) => {
  const t = useTranslations();
  const { flowType } = usePredictionFlow();

  if (isNil(flowType)) {
    return null;
  }

  let bannerText = t("unpredictedQuestion");
  const requireAttentionQuestion = getAttentionQuestionFromPost(
    detailedPost,
    flowType
  );
  const flowUserForecast = requireAttentionQuestion?.my_forecast;
  console.log(requireAttentionQuestion);
  // TODO: adjust messages
  switch (flowType) {
    case FlowType.NOT_PREDICTED:
      bannerText = t("unpredictedQuestion");
      break;
    case FlowType.MOVEMENT:
      if (
        requireAttentionQuestion &&
        requireAttentionQuestion.type !== QuestionType.Date
      ) {
        const hasIncreased =
          flowUserForecast?.movement && flowUserForecast?.movement > 0;
        const formattedMovement = getPredictionDisplayValue(
          Math.abs(flowUserForecast?.movement ?? 0),
          {
            questionType: requireAttentionQuestion.type,
            scaling: requireAttentionQuestion.scaling,
            actual_resolve_time: null,
          }
        );
        bannerText = t("detailedSignificantMovementBannerText", {
          movement: formattedMovement,
          increased: hasIncreased ? t("increased") : t("decreased"),
          unit: [QuestionType.Binary, QuestionType.MultipleChoice].includes(
            requireAttentionQuestion.type
          )
            ? t("percentagePoints")
            : requireAttentionQuestion.unit,
        });
      } else {
        bannerText = t("significantMovementBannerText");
      }
      break;
    case FlowType.STALE:
      bannerText = t("staleQuestions", {
        count: Math.round((flowUserForecast?.lifetime_elapsed ?? 1) * 100),
      });
      break;
    case FlowType.GENERAL:
      // TODO: add check to pick the right banner text
      if (!isPostPredicted(detailedPost, true)) {
        bannerText = t("unpredictedQuestion");
      } else if (isPostWithSignificantMovement(detailedPost)) {
        bannerText = t("significantMovementBannerText");
      } else if (isPostStale(detailedPost)) {
        bannerText = t("staleQuestions", {
          count: Math.round((flowUserForecast?.lifetime_elapsed ?? 1) * 100),
        });
      }
      break;
  }

  // remove banner if post doesn't require attention anymore (new prediction or reaffirmed)
  if (detailedPost.isDone) {
    return null;
  }
  console.log(getAttentionQuestionFromPost(detailedPost, flowType));
  return (
    <div className="rounded-t border-b border-blue-400 bg-orange-50 px-4 py-3 text-center text-xs font-medium leading-4 text-orange-900 dark:border-blue-400-dark dark:bg-orange-50-dark dark:text-orange-900-dark">
      {bannerText}
    </div>
  );
};

function getAttentionQuestionFromPost(
  post: PredictionFlowPost,
  flowType: FlowType
) {
  // simple question
  if (!isNil(post.question)) {
    return post.question;
  }
  // group of questions
  if (!isNil(post.group_of_questions)) {
    return post.group_of_questions.questions.reduce(
      (maxQuestion, currentQuestion) => {
        if (
          !isNil(maxQuestion.my_forecast) &&
          !isNil(currentQuestion.my_forecast)
        ) {
          const currentMovement = Math.abs(
            currentQuestion.my_forecast.movement || 0
          );
          const maxMovement = Math.abs(maxQuestion.my_forecast.movement || 0);
          if (flowType === FlowType.MOVEMENT) {
            return currentMovement > maxMovement
              ? currentQuestion
              : maxQuestion;
          }
          const currentLifetimeElapsed =
            currentQuestion.my_forecast.lifetime_elapsed;
          const maxLifetimeElapsed = maxQuestion.my_forecast.lifetime_elapsed;
          if (flowType === FlowType.STALE) {
            return currentLifetimeElapsed > maxLifetimeElapsed
              ? currentQuestion
              : maxQuestion;
          }
          if (flowType === FlowType.GENERAL) {
            if (currentMovement > 0 || maxMovement > 0) {
              return currentMovement > maxMovement
                ? currentQuestion
                : maxQuestion;
            } else {
              return currentLifetimeElapsed > maxLifetimeElapsed
                ? currentQuestion
                : maxQuestion;
            }
          }
        }
        return maxQuestion;
      }
    );
  }
  // conditional question
  if (!isNil(post.conditional)) {
    const noQuestion = post.conditional.question_no;
    const yesQuestion = post.conditional.question_yes;

    if (isNil(noQuestion) && isNil(yesQuestion)) {
      return null;
    }

    if (isNil(noQuestion)) {
      return yesQuestion;
    }

    if (isNil(yesQuestion)) {
      return noQuestion;
    }

    const getValue = (question: PredictionFlowPost) => {
      if (isNil(question.question?.my_forecast)) return 0;

      if (flowType === FlowType.MOVEMENT) {
        return Math.abs(question.question.my_forecast.movement || 0);
      }
      if (flowType === FlowType.STALE) {
        return question.question.my_forecast.lifetime_elapsed || 0;
      }
      return !isNil(question.question.my_forecast.movement)
        ? question.question.my_forecast.movement
        : question.question.my_forecast.lifetime_elapsed;
    };

    return getValue(noQuestion) > getValue(yesQuestion)
      ? noQuestion
      : yesQuestion;
  }
  return null;
}

export default RequireAttentionBanner;
