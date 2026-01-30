"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { UserChoiceItem } from "@/types/choices";
import { PostStatus, QuestionStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithMultipleChoiceForecasts,
} from "@/types/question";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { formatDate } from "@/utils/formatters/date";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/questions/choices";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import { getPostDrivenTime } from "@/utils/questions/helpers";

import { MultipleChoiceTile } from "../multiple_choice_tile";
import QuestionContinuousTile from "./question_continuous_tile";

// TODO: refactor this component to expect QuestionPost
// requires refactoring conditional form
type Props = {
  question: QuestionWithForecasts;
  authorUsername: string;
  curationStatus: PostStatus | QuestionStatus;
  hideCP?: boolean;
  showChart?: boolean;
  canPredict?: boolean;
  minimalistic?: boolean;
};

const QuestionTile: FC<Props> = ({
  question,
  curationStatus,
  authorUsername,
  hideCP,
  canPredict,
  showChart,
  minimalistic,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();

  const forecastAvailability = getQuestionForecastAvailability(question);

  if (curationStatus === PostStatus.PENDING) {
    return (
      <div>
        {t("createdByUserOnDate", {
          user: authorUsername,
          date: formatDate(locale, new Date(question.created_at)),
        })}
      </div>
    );
  }

  // hide the card if the question is not opened yet
  // otherwise, we should the chart with "No forecasts yet" message on the chart itself
  if (forecastAvailability.isEmpty && question.status !== QuestionStatus.OPEN) {
    return null;
  }

  const defaultChartZoom: TimelineChartZoomOption = user
    ? TimelineChartZoomOption.All
    : TimelineChartZoomOption.TwoMonths;

  switch (question.type) {
    case QuestionType.Binary:
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      return (
        <QuestionContinuousTile
          question={question}
          defaultChartZoom={defaultChartZoom}
          forecastAvailability={forecastAvailability}
          canPredict={canPredict}
          showChart={showChart}
          minimalistic={minimalistic}
        />
      );
    case QuestionType.MultipleChoice: {
      const visibleChoicesCount = 3;

      const choices = generateChoiceItemsFromMultipleChoiceForecast(
        question,
        t
      );
      const userForecasts = generateUserForecastsForMultipleQuestion(question);
      const actualCloseTime = getPostDrivenTime(question.actual_close_time);
      const openTime = getPostDrivenTime(question.open_time);

      const timestamps: number[] = !forecastAvailability.cpRevealsOn
        ? question.aggregations[
            question.default_aggregation_method
          ].history.map((forecast) => forecast.start_time)
        : userForecasts?.flatMap((option) => option.timestamps ?? []) ?? [];

      return (
        <MultipleChoiceTile
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
          showChart={showChart}
          minimalistic={minimalistic}
        />
      );
    }
    default:
      return null;
  }
};

const generateUserForecastsForMultipleQuestion = (
  question: QuestionWithMultipleChoiceForecasts
): UserChoiceItem[] | undefined => {
  const latest =
    question.aggregations[question.default_aggregation_method].latest;
  const options = question.options;

  const choiceOrdering: number[] = options?.map((_, i) => i) ?? [];
  choiceOrdering.sort((a, b) => {
    const aCenter = latest?.forecast_values[a] ?? 0;
    const bCenter = latest?.forecast_values[b] ?? 0;
    return bCenter - aCenter;
  });

  return options?.map((choice, index) => {
    const userForecasts = question.my_forecasts?.history;
    const values: (number | null)[] = [];
    const timestamps: number[] = [];
    userForecasts?.forEach((forecast) => {
      if (
        timestamps.length &&
        timestamps[timestamps.length - 1] === forecast.start_time
      ) {
        // new forecast starts at the end of the previous, so overwrite values
        values[values.length - 1] = forecast.forecast_values[index] ?? null;
      } else {
        // just add the forecast
        values.push(forecast.forecast_values[index] ?? null);
        timestamps.push(forecast.start_time);
      }

      if (forecast.end_time && !isForecastActive(forecast)) {
        // this forecast ends, add it to timestamps and a null value
        timestamps.push(forecast.end_time);
        values.push(null);
      }
    });
    return {
      choice,
      values: values,
      timestamps: timestamps,
      color:
        MULTIPLE_CHOICE_COLOR_SCALE[choiceOrdering.indexOf(index)] ??
        METAC_COLORS.gray["400"],
    };
  });
};

export default QuestionTile;
