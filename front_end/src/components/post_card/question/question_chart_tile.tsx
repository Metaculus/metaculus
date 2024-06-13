import { FC } from "react";

import MultipleChoiceTile from "@/components/post_card/question/multiple_choice_tile";
import NumericTile from "@/components/post_card/question/numeric_tile";
import { PostStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";

type Props = {
  question: QuestionWithForecasts;
  author_username: string;
};

const QuestionChartTile: FC<Props> = ({ question, author_username }) => {
  if (question.status === PostStatus.InReview) {
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
    default:
      return null;
  }
};

export default QuestionChartTile;
