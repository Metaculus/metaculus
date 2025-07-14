import { FC } from "react";

import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";

import ConsumerBinaryTile from "./consumer_binary_tile";
import ConsumerContinuousTile from "./consumer_continuous_tile";

type Props = {
  question: QuestionWithForecasts;
};

const ConsumerQuestionTile: FC<Props> = ({ question }) => {
  const forecastAvailability = getQuestionForecastAvailability(question);

  // Open/Closed - delegate to specific tile components based on question type
  switch (question.type) {
    case QuestionType.Binary:
      return (
        <ConsumerBinaryTile
          question={question}
          forecastAvailability={forecastAvailability}
        />
      );
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      return (
        <ConsumerContinuousTile
          question={question}
          forecastAvailability={forecastAvailability}
        />
      );
    default:
      return null;
  }
};

export default ConsumerQuestionTile;
