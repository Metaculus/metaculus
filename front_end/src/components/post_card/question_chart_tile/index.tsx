"use client";
import { FC } from "react";

import MultipleChoiceTile from "@/components/multiple_choice_tile";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/charts";
import { getIsForecastEmpty } from "@/utils/forecasts";

import QuestionNumericTile from "./question_numeric_tile";

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
  const { user } = useAuth();

  if (curationStatus === PostStatus.PENDING) {
    return (
      <div>{`Created by ${authorUsername} on ${question.created_at.slice(0, 7)}`}</div>
    );
  }
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  if (isForecastEmpty) {
    return <div>Forecasts data is empty</div>;
  }

  const defaultChartZoom: TimelineChartZoomOption = user
    ? TimelineChartZoomOption.All
    : TimelineChartZoomOption.TwoMonths;

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Binary:
      return (
        <QuestionNumericTile
          question={question}
          curationStatus={curationStatus}
          defaultChartZoom={defaultChartZoom}
        />
      );
    case QuestionType.MultipleChoice: {
      const visibleChoicesCount = 3;

      const choices = generateChoiceItemsFromMultipleChoiceForecast(
        question.forecasts,
        { activeCount: visibleChoicesCount }
      );
      return (
        <MultipleChoiceTile
          timestamps={question.forecasts.timestamps}
          choices={choices}
          visibleChoicesCount={visibleChoicesCount}
          defaultChartZoom={defaultChartZoom}
        />
      );
    }
    default:
      return null;
  }
};

export default QuestionChartTile;
