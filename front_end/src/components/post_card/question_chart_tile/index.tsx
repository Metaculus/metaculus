"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { ContinuousMultipleChoiceTile } from "@/components/multiple_choice_tile";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostStatus, QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/charts";
import {
  generateUserForecastsForMultipleQuestion,
  getQuestionForecastAvailability,
} from "@/utils/questions";

import QuestionNumericTile from "./question_numeric_tile";

// TODO: refactor this component to expect QuestionPost
// requires refactoring conditional form
type Props = {
  question: QuestionWithForecasts;
  authorUsername: string;
  curationStatus: PostStatus | QuestionStatus;
  hideCP?: boolean;
  forecasters?: number;
  canPredict?: boolean;
};

const QuestionChartTile: FC<Props> = ({
  question,
  curationStatus,
  authorUsername,
  hideCP,
  forecasters,
  canPredict,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const forecastAvailability = getQuestionForecastAvailability(question);

  if (curationStatus === PostStatus.PENDING) {
    return (
      <div>
        {t("createdByUserOnDate", {
          user: authorUsername,
          date: question.created_at.slice(0, 7),
        })}
      </div>
    );
  }

  // hide the card if the question is not opened yet
  // otherwise, we should the chart with "No forecasts yet" message on the chart itself
  if (forecastAvailability.isEmpty && curationStatus !== PostStatus.OPEN) {
    return null;
  }

  const defaultChartZoom: TimelineChartZoomOption = user
    ? TimelineChartZoomOption.All
    : TimelineChartZoomOption.TwoMonths;

  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
    case QuestionType.Discrete:
    case QuestionType.Binary:
      return (
        <QuestionNumericTile
          question={question}
          curationStatus={curationStatus}
          defaultChartZoom={defaultChartZoom}
          hideCP={hideCP}
          forecastAvailability={forecastAvailability}
          forecasters={forecasters}
          canPredict={canPredict}
        />
      );
    case QuestionType.MultipleChoice: {
      const visibleChoicesCount = 3;

      const choices = generateChoiceItemsFromMultipleChoiceForecast(question, {
        activeCount: visibleChoicesCount,
      });
      const userForecasts = generateUserForecastsForMultipleQuestion(question);
      const actualCloseTime = question.actual_close_time
        ? new Date(question.actual_close_time).getTime()
        : null;
      const openTime = question.open_time
        ? new Date(question.open_time).getTime()
        : undefined;

      const timestamps: number[] = !forecastAvailability.cpRevealsOn
        ? question.aggregations.recency_weighted.history.map(
            (forecast) => forecast.start_time
          )
        : userForecasts?.flatMap((option) => option.timestamps ?? []) ?? [];

      return (
        <ContinuousMultipleChoiceTile
          timestamps={timestamps}
          choices={choices}
          visibleChoicesCount={visibleChoicesCount}
          defaultChartZoom={defaultChartZoom}
          question={question}
          hideCP={hideCP}
          actualCloseTime={actualCloseTime}
          openTime={openTime}
          forecastAvailability={forecastAvailability}
          canPredict={canPredict}
        />
      );
    }
    default:
      return null;
  }
};

export default QuestionChartTile;
