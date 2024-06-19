import { FC } from "react";

import ForecastMakerGroup from "@/components/forecast_maker/forecast_maker_group";
import { PostConditional } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";

import ForecastMakerConditional from "./forecast_maker_conditional";
import QuestionForecastMaker from "./forecast_maker_question";

type Props = {
  postId: number;
  groupOfQuestions?: { id: number; questions: QuestionWithForecasts[] };
  conditional?: PostConditional<QuestionWithForecasts>;
  question?: QuestionWithForecasts;
};

const ForecastMaker: FC<Props> = ({
  postId,
  conditional,
  question,
  groupOfQuestions,
}) => {
  if (groupOfQuestions) {
    return (
      <ForecastMakerGroup
        postId={postId}
        questions={groupOfQuestions.questions}
      />
    );
  }

  if (conditional) {
    return (
      <ForecastMakerConditional postId={postId} conditional={conditional} />
    );
  }

  if (question) {
    return <QuestionForecastMaker question={question} />;
  }

  return null;
};

export default ForecastMaker;
