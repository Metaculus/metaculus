import { parseISO } from "date-fns";
import { isNil } from "lodash";
import { FC } from "react";

import {
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import { canPredictQuestion } from "@/utils/questions";

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
  } = post;
  const canPredict = canPredictQuestion(post);
  const canResolve =
    (post.user_permission === ProjectPermissions.CURATOR ||
      post.user_permission === ProjectPermissions.ADMIN) &&
    !isNil(post.published_at) &&
    parseISO(post.published_at) <= new Date() &&
    post.status === PostStatus.APPROVED;

  if (groupOfQuestions) {
    return (
      <ForecastMakerGroup
        post={post}
        resolutionCriteria={groupOfQuestions.resolution_criteria}
        finePrint={groupOfQuestions.fine_print}
        questions={groupOfQuestions.questions}
        canPredict={canPredict}
        canResolve={canResolve}
      />
    );
  }

  if (conditional) {
    return (
      <ForecastMakerConditional
        post={post}
        conditional={conditional}
        canPredict={canPredict}
        canResolve={canResolve}
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
      />
    );
  }

  return null;
};

export default ForecastMaker;
