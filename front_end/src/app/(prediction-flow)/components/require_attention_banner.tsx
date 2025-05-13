import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { getMovementComponents } from "@/components/cp_movement";
import RichText from "@/components/rich_text";
import { PredictionFlowPost } from "@/types/post";
import {
  MovementDirection,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";

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

  let bannerText: string | ReactNode = "";
  const requireAttentionQuestion = getAttentionQuestionFromPost(
    detailedPost,
    flowType
  );
  const flowUserForecast = requireAttentionQuestion?.my_forecast;

  switch (flowType) {
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
      if (isPostWithSignificantMovement(detailedPost)) {
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
  if (detailedPost.isDone || !bannerText) {
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
  if (
    isNil(requireAttentionQuestion) ||
    isNil(flowUserForecast?.movement) ||
    ![
      MovementDirection.UP,
      MovementDirection.DOWN,
      MovementDirection.CONTRACTED,
      MovementDirection.EXPANDED,
    ].includes(flowUserForecast?.movement.direction)
  ) {
    return;
  }

  const movementComponents = getMovementComponents(
    requireAttentionQuestion,
    flowUserForecast.movement,
    t
  );

  if (!movementComponents) {
    return;
  }

  const { amount, unit, directionLabel } = movementComponents;

  // Date questions
  if (requireAttentionQuestion.type === QuestionType.Date) {
    if (
      [MovementDirection.UP, MovementDirection.DOWN].includes(
        flowUserForecast.movement.direction
      )
    ) {
      // Median movement
      return (
        <RichText>
          {(tags) =>
            t.rich("dateQuestionSignificantMovementBannerText", {
              ...tags,
              amount,
              unit,
              direction: directionLabel,
            })
          }
        </RichText>
      );
    } else if (
      [MovementDirection.CONTRACTED, MovementDirection.EXPANDED].includes(
        flowUserForecast.movement.direction
      )
    ) {
      return (
        <RichText>
          {(tags) =>
            t.rich("uncertaintySignificantMovementBannerText", {
              ...tags,
              amount,
              unit,
              direction: directionLabel,
            })
          }
        </RichText>
      );
    }
  } else {
    // Numeric, binary and MC questions
    if (
      [MovementDirection.UP, MovementDirection.DOWN].includes(
        flowUserForecast.movement.direction
      )
    ) {
      // Median movement
      return (
        <RichText>
          {(tags) =>
            t.rich("detailedSignificantMovementBannerText", {
              ...tags,
              amount,
              unit,
              direction: directionLabel,
            })
          }
        </RichText>
      );
    } else if (
      [MovementDirection.CONTRACTED, MovementDirection.EXPANDED].includes(
        flowUserForecast.movement.direction
      )
    ) {
      // Uncertainty movement
      return (
        <RichText>
          {(tags) =>
            t.rich("uncertaintySignificantMovementBannerText", {
              ...tags,
              amount,
              unit,
              direction: directionLabel,
            })
          }
        </RichText>
      );
    }
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
