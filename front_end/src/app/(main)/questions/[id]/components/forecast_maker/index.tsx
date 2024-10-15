import { parseISO } from "date-fns";
import { isNil } from "lodash";
import { FC } from "react";

import {
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import {
  canPredictQuestion,
  getPredictionInputMessage,
} from "@/utils/questions";

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
    [ProjectPermissions.CURATOR, ProjectPermissions.ADMIN].includes(
      post.user_permission
    ) &&
    !isNil(post.published_at) &&
    parseISO(post.published_at) <= new Date() &&
    [PostStatus.APPROVED, PostStatus.OPEN, PostStatus.CLOSED].includes(status);

  const predictionMessage = getPredictionInputMessage(post);
  if (groupOfQuestions) {
    return (
      <ForecastMakerGroup
        post={post}
        resolutionCriteria={groupOfQuestions.resolution_criteria}
        finePrint={groupOfQuestions.fine_print}
        questions={groupOfQuestions.questions}
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
        postId={post.id}
        predictionMessage={predictionMessage}
      />
    );
  }

  return null;
};

export default ForecastMaker;
