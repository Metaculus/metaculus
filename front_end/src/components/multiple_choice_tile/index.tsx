"use client";

import { isNil, round } from "lodash";
import React, { FC, useCallback, useMemo } from "react";
import { VictoryThemeDefinition } from "victory";

import FanGraphGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/fan_graph_group_chart";
import { BINARY_FORECAST_PRECISION } from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import useCardReaffirmContext from "@/components/post_card/reaffirm_context";
import PredictionChip from "@/components/prediction_chip";
import { ForecastPayload } from "@/services/questions";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { PostStatus, QuestionStatus } from "@/types/post";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";

import MultipleChoiceTileLegend from "./multiple_choice_tile_legend";

type BaseProps = {
  choices: ChoiceItem[];
  visibleChoicesCount: number;
  hideCP?: boolean;
  forecastAvailability?: ForecastAvailability;
  chartHeight?: number;
  canPredict?: boolean;
};

type QuestionProps = {
  question: QuestionWithMultipleChoiceForecasts;
  groupQuestions?: never;
  groupType?: never;
};

type GroupProps = {
  groupQuestions: QuestionWithNumericForecasts[];
  groupType?: QuestionType;
  question?: never;
};

type ConditionalProps = QuestionProps | GroupProps;

type ContinuousMultipleChoiceTileProps = BaseProps &
  ConditionalProps & {
    timestamps: number[];
    actualCloseTime?: number | null;
    openTime: number | undefined;
    defaultChartZoom?: TimelineChartZoomOption;
    withZoomPicker?: boolean;
    chartTheme?: VictoryThemeDefinition;
    question?: QuestionWithMultipleChoiceForecasts;
    scaling?: Scaling | undefined;
  };

export const ContinuousMultipleChoiceTile: FC<
  ContinuousMultipleChoiceTileProps
> = ({
  timestamps,
  actualCloseTime,
  openTime,
  choices,
  visibleChoicesCount,
  defaultChartZoom,
  withZoomPicker,
  chartHeight = 100,
  chartTheme,
  question,
  groupType,
  groupQuestions,
  scaling,
  hideCP,
  forecastAvailability,
  canPredict,
}) => {
  const { onReaffirm } = useCardReaffirmContext();

  // when resolution chip is shown we want to hide the chart and display the chip
  // (e.g. multiple-choice question on questions feed)
  // otherwise, resolution status will be populated near the every choice
  // (e.g. multiple-choice question in the embedding view, or questions group)
  const isResolvedView =
    !isNil(question?.resolution) &&
    choices.every((choice) => isNil(choice.resolution));

  const { canReaffirm, forecast } = useMemo(
    () => generateReaffirmData({ question, groupQuestions, groupType }),
    [groupQuestions, groupType, question]
  );

  const handleReaffirmClick = useCallback(() => {
    if (!onReaffirm || !canReaffirm) return;

    onReaffirm(forecast);
  }, [canReaffirm, forecast, onReaffirm]);

  return (
    <div className="MultipleChoiceTile ml-0 mr-2 flex w-full grid-cols-[200px_auto] flex-col items-start gap-3 pr-1 xs:grid">
      <div className="resize-container">
        {isResolvedView ? (
          <PredictionChip question={question} status={PostStatus.RESOLVED} />
        ) : (
          <MultipleChoiceTileLegend
            choices={choices}
            visibleChoicesCount={visibleChoicesCount}
            questionType={groupType}
            hideCP={hideCP}
            canPredict={canPredict && canReaffirm}
            onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
          />
        )}
      </div>
      {!isResolvedView && (
        <div className="relative w-full">
          <MultipleChoiceChart
            timestamps={timestamps}
            actualCloseTime={actualCloseTime}
            choiceItems={choices}
            height={chartHeight}
            extraTheme={chartTheme}
            defaultZoom={defaultChartZoom}
            withZoomPicker={withZoomPicker}
            questionType={groupType}
            scaling={scaling}
            isEmptyDomain={
              !!forecastAvailability?.isEmpty ||
              !!forecastAvailability?.cpRevealsOn
            }
            openTime={openTime}
            hideCP={hideCP}
          />
          <ForecastAvailabilityChartOverflow
            forecastAvailability={forecastAvailability}
            className="text-xs lg:text-sm"
          />
        </div>
      )}
    </div>
  );
};

type FanGraphMultipleChoiceTileProps = BaseProps & GroupProps;

export const FanGraphMultipleChoiceTile: FC<
  FanGraphMultipleChoiceTileProps
> = ({
  groupQuestions,
  choices,
  visibleChoicesCount,
  hideCP,
  forecastAvailability,
  chartHeight,
  groupType,
  canPredict,
}) => {
  const { onReaffirm } = useCardReaffirmContext();

  const { canReaffirm, forecast } = useMemo(
    () => generateReaffirmData({ groupQuestions, groupType }),
    [groupQuestions, groupType]
  );

  const handleReaffirmClick = useCallback(() => {
    if (!onReaffirm || !canReaffirm) return;

    onReaffirm(forecast);
  }, [canReaffirm, forecast, onReaffirm]);

  return (
    <div className="MultipleChoiceTile ml-0 mr-2 flex w-full grid-cols-[200px_auto] flex-col items-start gap-3 pr-1 xs:grid">
      <div className="resize-container">
        <MultipleChoiceTileLegend
          choices={choices}
          visibleChoicesCount={visibleChoicesCount}
          hideCP={hideCP}
          questionType={groupType}
          hideChoiceIcon
          optionLabelClassName="text-olive-800 dark:text-olive-800-dark"
          canPredict={canPredict && canReaffirm}
          onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
        />
      </div>
      <div className="w-full">
        <FanGraphGroupChart
          questions={groupQuestions}
          height={chartHeight}
          pointSize={8}
          hideCP={hideCP}
          withTooltip={false}
          forecastAvailability={forecastAvailability}
        />
      </div>
    </div>
  );
};

// generate data to submit based on user forecast and post type
function generateReaffirmData({
  question,
  groupQuestions,
  groupType,
}: {
  question?: QuestionWithMultipleChoiceForecasts;
  groupQuestions?: QuestionWithNumericForecasts[];
  groupType?: QuestionType;
}): {
  canReaffirm: boolean;
  forecast: ForecastPayload[];
} {
  const fallback = { canReaffirm: false, forecast: [] };

  // multiple choice question
  if (question) {
    const latest = question.my_forecasts?.latest;
    if (!latest || latest.end_time) {
      return fallback;
    }

    const forecastValue = question.options.reduce<Record<string, number>>(
      (acc, el, index) => {
        const optionForecast = latest.forecast_values[index];
        if (optionForecast) {
          acc[el] = optionForecast;
        }
        return acc;
      },
      {}
    );

    return {
      canReaffirm:
        !!latest.forecast_values.length && !!Object.keys(forecastValue).length,
      forecast: [
        {
          questionId: question.id,
          forecastData: {
            continuousCdf: null,
            probabilityYes: null,
            probabilityYesPerCategory: forecastValue,
          },
        },
      ],
    };
  }

  // group questions
  if (groupType && groupQuestions) {
    // binary group
    if (groupType === QuestionType.Binary) {
      const groupForecasts = groupQuestions.map((q) => {
        const latest = q.my_forecasts?.latest;
        let forecast: number | null = null;
        if (latest && !latest.end_time) {
          const rawForecast = extractPrevBinaryForecastValue(
            latest.forecast_values[1]
          );
          forecast = rawForecast
            ? round(rawForecast / 100, BINARY_FORECAST_PRECISION)
            : null;
        }

        return {
          id: q.id,
          forecast,
          status: q.status,
        };
      });

      const reaffirmForecasts = groupForecasts.filter(
        (q) => q.forecast !== null && q.status === QuestionStatus.OPEN
      );

      return {
        canReaffirm: !!reaffirmForecasts.length,
        forecast: reaffirmForecasts.map((q) => ({
          questionId: q.id,
          forecastData: {
            probabilityYes: q.forecast,
            probabilityYesPerCategory: null,
            continuousCdf: null,
          },
        })),
      };
    }

    // continuous group
    if (groupType === QuestionType.Date || groupType === QuestionType.Numeric) {
      const groupForecasts = groupQuestions.map((q) => {
        const latest = q.my_forecasts?.latest;
        let forecastValues: number[] | undefined = undefined;
        if (latest && !latest.end_time) {
          forecastValues = latest.forecast_values;
        }

        return {
          id: q.id,
          forecastValues,
          distributionInput: latest?.distribution_input,
          status: q.status,
        };
      });

      const reaffirmForecasts = groupForecasts.filter(
        (q) =>
          !isNil(q.forecastValues) &&
          !isNil(q.distributionInput) &&
          q.status === QuestionStatus.OPEN
      );

      return {
        canReaffirm: !!reaffirmForecasts.length,
        forecast: reaffirmForecasts.map((q) => {
          return {
            questionId: q.id,
            forecastData: {
              // okay to ignore, we check for null when calculating reaffirmForecasts
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              continuousCdf: q.forecastValues!,
              probabilityYesPerCategory: null,
              probabilityYes: null,
            },
            distributionInput: q.distributionInput,
          };
        }),
      };
    }
  }

  return fallback;
}
