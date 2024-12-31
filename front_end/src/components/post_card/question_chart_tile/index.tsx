"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { ContinuousMultipleChoiceTile } from "@/components/multiple_choice_tile";
import { useAuth } from "@/contexts/auth_context";
import { ForecastPayload } from "@/services/questions";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostStatus, QuestionPost } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/charts";
import {
  canPredictQuestion,
  generateUserForecastsForMultipleQuestion,
  getQuestionForecastAvailability,
} from "@/utils/questions";

import QuestionNumericTile from "./question_numeric_tile";

type Props = {
  post: QuestionPost<QuestionWithForecasts>;
  hideCP?: boolean;
  onReaffirm?: (userForecast: ForecastPayload[]) => void;
};

const QuestionChartTile: FC<Props> = ({ post, hideCP, onReaffirm }) => {
  const t = useTranslations();
  const { user } = useAuth();

  const { question, author_username, curation_status, nr_forecasters } = post;

  const forecastAvailability = getQuestionForecastAvailability(question);

  const canPredict = canPredictQuestion(post);

  if (curation_status === PostStatus.PENDING) {
    return (
      <div>
        {t("createdByUserOnDate", {
          user: author_username,
          date: question.created_at.slice(0, 7),
        })}
      </div>
    );
  }

  // hide the card if the question is not opened yet
  // otherwise, we should the chart with "No forecasts yet" message on the chart itself
  if (forecastAvailability.isEmpty && curation_status !== PostStatus.OPEN) {
    return null;
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
          curationStatus={curation_status}
          defaultChartZoom={defaultChartZoom}
          hideCP={hideCP}
          forecastAvailability={forecastAvailability}
          forecasters={nr_forecasters}
          onReaffirm={onReaffirm}
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
          onReaffirm={onReaffirm}
          canPredict={canPredict}
        />
      );
    }
    default:
      return null;
  }
};

export default QuestionChartTile;
