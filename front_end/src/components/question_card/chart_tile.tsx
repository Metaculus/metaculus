import { FC } from "react";

// import ConditionalTile from "@/components/question_card/conditional_tile";
import MultipleChoiceTile from "@/components/question_card/multiple_choice_tile";
import NumericTile from "@/components/question_card/numeric_tile";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionStatus as QuestionStatusEnum,
} from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";

import QuestionStatus from "../question_status";

type Props = {
  question: QuestionWithForecasts;
  author_username: string;
};

const QuestionChartTile: FC<Props> = ({ question, author_username }) => {
  if (question.status === QuestionStatusEnum.InReview) {
    return (
      <div>{`Created by ${author_username} on ${question.created_at.slice(0, 7)}`}</div>
    );
  }
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  if (isForecastEmpty) {
    return <div>Forecasts data is empty</div>;
  }

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return <NumericTile question={question} />;
    case QuestionType.MultipleChoice:
      return <MultipleChoiceTile question={question} />;
    // case "conditional":
    //   return <ConditionalTile />;
    default:
      return null;
  }
};

export default QuestionChartTile;
