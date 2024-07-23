import { FC } from "react";

import {
  PostConditional,
  PostGroupOfQuestions,
  ProjectPermissions,
} from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";

import ForecastMakerConditional from "./forecast_maker_conditional";
import ForecastMakerGroup from "./forecast_maker_group";
import QuestionForecastMaker from "./forecast_maker_question";

type Props = {
  postId: number;
  groupOfQuestions?: PostGroupOfQuestions<QuestionWithForecasts>;
  conditional?: PostConditional<QuestionWithForecasts>;
  question?: QuestionWithForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMaker: FC<Props> = ({
  postId,
  conditional,
  question,
  groupOfQuestions,
  permission,
  canPredict,
  canResolve,
}) => {
  if (groupOfQuestions) {
    return (
      <ForecastMakerGroup
        postId={postId}
        resolutionCriteria={groupOfQuestions.resolution_criteria_description}
        finePrint={groupOfQuestions.fine_print}
        questions={groupOfQuestions.questions}
        permission={permission}
        canPredict={canPredict}
        canResolve={canResolve}
      />
    );
  }

  if (conditional) {
    return (
      <ForecastMakerConditional
        postId={postId}
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
      />
    );
  }

  return null;
};

export default ForecastMaker;
