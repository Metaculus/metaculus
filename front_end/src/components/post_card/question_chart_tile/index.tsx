import { FC } from "react";

import { PostStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/charts";
import { getIsForecastEmpty } from "@/utils/forecasts";

import MultipleChoiceTile from "./multiple_choice_tile";
import NumericTile from "./numeric_tile";

type Props = {
  question: QuestionWithForecasts;
  authorUsername: string;
  curationStatus: PostStatus;
};

const QuestionChartTile: FC<Props> = ({
  question,
  authorUsername,
  curationStatus,
}) => {
  if (curationStatus === PostStatus.PENDING) {
    return (
      <div>{`Created by ${authorUsername} on ${question.created_at.slice(0, 7)}`}</div>
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
      return (
        <NumericTile question={question} curationStatus={curationStatus} />
      );
    case QuestionType.MultipleChoice: {
      const choices = generateChoiceItemsFromMultipleChoiceForecast(
        question.forecasts
      );
      return (
        <MultipleChoiceTile
          timestamps={question.forecasts.timestamps}
          choices={choices}
        />
      );
    }
    default:
      return null;
  }
};

export default QuestionChartTile;
