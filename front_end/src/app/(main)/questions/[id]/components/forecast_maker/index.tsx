import { parseISO } from "date-fns";
import { isNil } from "lodash";
import { FC } from "react";

import PredictionStatusMessage from "@/app/(main)/questions/[id]/components/forecast_maker/prediction_status_message";
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
};

const ForecastMaker: FC<Props> = ({ post }) => {
  const {
    group_of_questions: groupOfQuestions,
    conditional,
    question,
    user_permission: permission,
    status,
  } = post;
  const canPredict = canPredictQuestion(post);
  const canResolve =
    permission === ProjectPermissions.ADMIN &&
    !isNil(post.published_at) &&
    parseISO(post.published_at) <= new Date() &&
    [PostStatus.APPROVED, PostStatus.OPEN, PostStatus.CLOSED].includes(status);

  const predictionMessage = <PredictionStatusMessage post={post} />;

  if (groupOfQuestions) {
    return (
      <ForecastMakerGroup
        post={post}
        questions={groupOfQuestions.questions}
        groupVariable={groupOfQuestions.group_variable}
        canPredict={canPredict}
        canResolve={canResolve}
        predictionMessage={predictionMessage}
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
      />
    );
  }

  if (question) {
    return (
      <QuestionForecastMaker
        question={question}
        permission={permission}
        canPredict={canPredict}
        canResolve={canResolve}
        post={post}
        predictionMessage={predictionMessage}
      />
    );
  }

  return null;
};

export default ForecastMaker;
