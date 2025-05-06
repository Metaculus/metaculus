import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { PredictionFlowPost } from "@/types/post";
import {
  MovementDirection,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { isPostOpenQuestionPredicted } from "@/utils/forecasts/helpers";

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

  let bannerText: string | ReactNode = t("unpredictedQuestion");
  const requireAttentionQuestion = getAttentionQuestionFromPost(
    detailedPost,
    flowType
  );
  const flowUserForecast = requireAttentionQuestion?.my_forecast;

  switch (flowType) {
    case FlowType.NOT_PREDICTED:
      bannerText = t("unpredictedQuestion");
      break;
    case FlowType.MOVEMENT:
      bannerText = getMovementBannerText(
        requireAttentionQuestion,
        flowUserForecast,
        t
      );
      break;
    case FlowType.STALE:
      bannerText = t("staleQuestions", {
        count: Math.round((flowUserForecast?.lifetime_elapsed ?? 1) * 100),
      });
      break;
    case FlowType.GENERAL:
      if (
        !isPostOpenQuestionPredicted(detailedPost, {
          checkAllSubquestions: true,
        })
      ) {
        bannerText = t("unpredictedQuestion");
      } else if (isPostWithSignificantMovement(detailedPost)) {
        bannerText = getMovementBannerText(
          requireAttentionQuestion,
          flowUserForecast,
          t
        );
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

  return (
    <div className="rounded-t border-b border-blue-400 bg-orange-50 px-4 py-3 text-center text-xs font-medium leading-4 text-orange-900 dark:border-blue-400-dark dark:bg-orange-50-dark dark:text-orange-900-dark">
      {bannerText}
    </div>
  );
};

function getMovementBannerText(
  requireAttentionQuestion: QuestionWithForecasts | null,
  flowUserForecast: QuestionWithForecasts["my_forecast"] | undefined,
  t: ReturnType<typeof useTranslations>
) {
  console.log(requireAttentionQuestion, flowUserForecast);
  if (isNil(requireAttentionQuestion) || isNil(flowUserForecast?.movement)) {
    return null;
  }
  switch (requireAttentionQuestion.type) {
    case QuestionType.Date:
      // TBD: returned value doesn't really make sense when rendered and maybe it's bettter to return some general movement string
      // for date questions we receive movement in seconds so we need to convert it to days
      const movementInDays =
        (flowUserForecast.movement.movement ?? 0) / (60 * 60 * 24);
      let amount = movementInDays;
      let unit = t("days");
      const movementDirection = [
        MovementDirection.UP,
        MovementDirection.EXPANDED,
      ].includes(flowUserForecast.movement.direction)
        ? t("later")
        : t("sooner");
      if (movementInDays > 730) {
        amount = Math.round(movementInDays / 365);
        unit = t("years");
      } else if (movementInDays <= 730) {
        amount = Math.round(movementInDays / 30);
        unit = t("months");
      } else if (movementInDays <= 120) {
        amount = Math.round(movementInDays / 7);
        unit = t("weeks");
      } else if (movementInDays <= 21) {
        amount = movementInDays;
        unit = t("days");
      }
      console.log(movementInDays);
      return t.rich("dateQuestionSignificantMovementBannerText", {
        amount,
        unit,
        movementDirection,
        bold: (chunks) => <span className="font-bold">{chunks}</span>,
      });
    case QuestionType.Numeric:
      // we get scaled value of movement so can just render it with unit
      return t.rich("detailedSignificantMovementBannerText", {
        direction: [MovementDirection.UP, MovementDirection.EXPANDED].includes(
          flowUserForecast.movement.direction
        )
          ? t("increased")
          : t("decreased"),
        movement: Math.round(flowUserForecast.movement.movement * 10) / 10,
        unit: requireAttentionQuestion.unit,
        bold: (chunks) => <span className="font-bold">{chunks}</span>,
      });
    case QuestionType.Binary:
    case QuestionType.MultipleChoice:
      // for binaries and MC we receive the movement in format form 0 to 1
      return t.rich("detailedSignificantMovementBannerText", {
        direction: [MovementDirection.UP, MovementDirection.EXPANDED].includes(
          flowUserForecast.movement.direction
        )
          ? t("increased")
          : t("decreased"),
        movement: Math.round(flowUserForecast.movement.movement * 1000) / 10,
        unit: t("percentagePoints"),
        bold: (chunks) => <span className="font-bold">{chunks}</span>,
      });
  }
}

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
            currentQuestion.my_forecast.movement?.movement || 0
          );
          const maxMovement = Math.abs(
            maxQuestion.my_forecast.movement?.movement || 0
          );
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
      if (isNil(question.question?.my_forecast)) return 1;

      if (flowType === FlowType.MOVEMENT) {
        return Math.abs(question.question.my_forecast.movement?.movement || 0);
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
