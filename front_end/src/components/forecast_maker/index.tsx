import { FC } from "react";

import { PostConditional } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";

import ForecastMakerConditional from "./forecast_maker_conditional";
import QuestionForecastMaker from "./forecast_maker_question";

type Props = {
  conditional?: PostConditional<QuestionWithForecasts>;
  question?: QuestionWithForecasts;
};

const ForecastMaker: FC<Props> = ({ conditional, question }) => {
  if (conditional) {
    return <ForecastMakerConditional conditional={conditional} />;
  }

  if (question) {
    return <QuestionForecastMaker question={question} />;
  }

  return null;
};

export default ForecastMaker;
