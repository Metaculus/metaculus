import { parseISO } from "date-fns";
import { isNil } from "lodash";
import { FC } from "react";

import PredictionStatusMessage from "@/components/forecast_maker/prediction_status_message";
import {
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import { canPredictQuestion } from "@/utils/questions/predictions";

import ForecastMakerConditional from "./forecast_maker_conditional";
import ForecastMakerGroup from "./forecast_maker_group";
import QuestionForecastMaker from "./forecast_maker_question";

type Props = {
  post: PostWithForecasts;
  onPredictionSubmit?: () => void;
  disableResolveButtons?: boolean;
};

const ForecastMaker: FC<Props> = ({
  post,
  onPredictionSubmit,
  disableResolveButtons,
}) => {
  const {
    group_of_questions: groupOfQuestions,
    conditional,
    question,
    user_permission: permission,
  } = post;
  const canPredict = canPredictQuestion(post);
  const canResolve = canResolveQuestion(post, {
    disableResolveButtons,
  });

  const predictionMessage = <PredictionStatusMessage post={post} />;

  if (groupOfQuestions) {
    return (
      <ForecastMakerGroup
        post={post}
        questions={groupOfQuestions.questions}
        groupVariable={groupOfQuestions.group_variable}
        canPredict={canPredict}
        canResolve={
          isNil(disableResolveButtons) ? canResolve : !disableResolveButtons
        }
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  }

  if (conditional) {
    return (
      <ForecastMakerConditional
        post={post}
        conditional={conditional}
        canPredict={canPredict}
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  }

  if (question) {
    return (
      <QuestionForecastMaker
        question={question}
        permission={permission}
        canPredict={canPredict}
        canResolve={
          isNil(disableResolveButtons) ? canResolve : !disableResolveButtons
        }
        post={post}
        predictionMessage={predictionMessage}
        onPredictionSubmit={onPredictionSubmit}
      />
    );
  }

  return null;
};

const canResolveQuestion = (
  post: PostWithForecasts,
  config?: { disableResolveButtons?: boolean }
) => {
  const { disableResolveButtons } = config ?? {};
  const { user_permission: permission, status } = post;
  const canResolve =
    permission === ProjectPermissions.ADMIN &&
    !isNil(post.published_at) &&
    parseISO(post.published_at) <= new Date() &&
    [PostStatus.APPROVED, PostStatus.OPEN, PostStatus.CLOSED].includes(status);
  return isNil(disableResolveButtons) ? canResolve : !disableResolveButtons;
};

export default ForecastMaker;
