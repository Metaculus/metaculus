import { FC } from "react";

import { PostConditional } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";

import ConditionalForecastMaker from "./conditional_forecast_maker";
import QuestionForecastMaker from "./question_forecast_maker";

type Props = {
  conditional?: PostConditional<QuestionWithForecasts>;
  question?: QuestionWithForecasts;
};

const ForecastMaker: FC<Props> = ({ conditional, question }) => {
  if (conditional) {
    return <ConditionalForecastMaker conditional={conditional} />;
  }

  if (question) {
    return <QuestionForecastMaker question={question} />;
  }

  return null;
};

export default ForecastMaker;
