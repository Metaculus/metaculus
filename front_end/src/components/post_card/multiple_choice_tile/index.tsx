"use client";

import { isNil } from "lodash";
import React, { FC, useCallback, useEffect, useMemo } from "react";
import { VictoryThemeDefinition } from "victory";

import { useIsEmbedMode } from "@/app/(embed)/questions/components/question_view_mode_context";
import FanChart from "@/components/charts/fan_chart";
import GroupChart from "@/components/charts/group_chart";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import {
  buildDefaultForecastExpiration,
  forecastExpirationToDate,
} from "@/components/forecast_maker/forecast_expiration";
import useCardReaffirmContext from "@/components/post_card/reaffirm_context";
import PredictionChip from "@/components/prediction_chip";
import { ContinuousQuestionTypes } from "@/constants/questions";
import { useAuth } from "@/contexts/auth_context";
import useContainerSize from "@/hooks/use_container_size";
import { ForecastPayload } from "@/services/api/questions/questions.server";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { PostGroupOfQuestions, PostStatus, QuestionStatus } from "@/types/post";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";

import MultipleChoiceTileLegend from "./multiple_choice_tile_legend";

type BaseProps = {
  choices: ChoiceItem[];
  visibleChoicesCount: number;
  hideCP?: boolean;
  chartHeight?: number;
  canPredict?: boolean;
  showChart?: boolean;
  minimalistic?: boolean;
  optionsLimit?: number;
  yLabel?: string;
};

type QuestionProps = {
  question: QuestionWithMultipleChoiceForecasts;
  group?: never;
  groupType?: never;
};

type GroupProps = {
  group: PostGroupOfQuestions<QuestionWithNumericForecasts>;
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
    forecastAvailability?: ForecastAvailability;
    onLegendHeightChange?: (height: number) => void;
  };

const CHART_HEIGHT = 100;

export const MultipleChoiceTile: FC<ContinuousMultipleChoiceTileProps> = ({
  timestamps,
  actualCloseTime,
  openTime,
  choices,
  visibleChoicesCount,
  defaultChartZoom,
  withZoomPicker,
  chartHeight,
  chartTheme,
  question,
  groupType,
  group,
  scaling,
  yLabel,
  hideCP,
  forecastAvailability,
  canPredict,
  showChart = true,
  minimalistic = false,
  onLegendHeightChange,
}) => {
  const { user } = useAuth();
  const { onReaffirm } = useCardReaffirmContext();
  const { ref, height } = useContainerSize<HTMLDivElement>();

  const { ref: tileRef, width: tileWidth } = useContainerSize<HTMLDivElement>();
  const isEmbed = useIsEmbedMode();
  const isCompactEmbed = isEmbed && !!tileWidth && tileWidth < 400;

  // when resolution chip is shown we want to hide the chart and display the chip
  // (e.g. multiple-choice question on questions feed)
  // otherwise, resolution status will be populated near the every choice
  // (e.g. multiple-choice question in the embedding view, or questions group)
  const isResolvedView =
    !isNil(question?.resolution) &&
    choices.every((choice) => isNil(choice.resolution));

  const { canReaffirm, forecast } = useMemo(
    () =>
      generateReaffirmData({
        question,
        groupQuestions: group?.questions,
        groupType,
        user,
      }),
    [group?.questions, groupType, question, user]
  );

  useEffect(() => {
    if (!onLegendHeightChange) return;
    onLegendHeightChange(height);
  }, [height, groupType, onLegendHeightChange]);

  const handleReaffirmClick = useCallback(() => {
    if (!onReaffirm || !canReaffirm) return;

    onReaffirm(forecast);
  }, [canReaffirm, forecast, onReaffirm]);

  return (
    <div
      ref={tileRef}
      className={cn(
        "MultipleChoiceTile ml-0 w-full items-start",
        {
          "flex flex-col": isEmbed && isCompactEmbed,
          "grid grid-cols-2": isEmbed && !isCompactEmbed,
          "flex flex-col md:grid md:grid-cols-5": !isEmbed,
        },
        {
          "gap-3": isEmbed && isCompactEmbed && !minimalistic,
          "gap-5": isEmbed && !isCompactEmbed && !minimalistic,
          "gap-5 md:gap-8": !isEmbed && !minimalistic,
        }
      )}
    >
      <div
        className={cn("resize-container w-full min-w-0", {
          "col-span-1": isEmbed && !isCompactEmbed,
          "col-span-2": isEmbed && isCompactEmbed,
          "md:col-span-2": !isEmbed && (!minimalistic || isResolvedView),
        })}
      >
        {isResolvedView ? (
          <PredictionChip question={question} status={PostStatus.RESOLVED} />
        ) : (
          !minimalistic && (
            <MultipleChoiceTileLegend
              ref={ref}
              choices={choices}
              visibleChoicesCount={visibleChoicesCount}
              questionType={groupType}
              hideCP={hideCP}
              canPredict={canPredict && canReaffirm}
              onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
              layout={isEmbed && isCompactEmbed ? "wrap" : "column"}
            />
          )
        )}
      </div>
      {showChart && !isResolvedView && (
        <div
          className={cn("relative w-full min-w-0", {
            "col-span-1": isEmbed && !isCompactEmbed,
            "col-span-2": isEmbed && isCompactEmbed,
            "md:col-span-5": !isEmbed,
            "md:col-span-3": !isEmbed && (!minimalistic || isResolvedView),
          })}
        >
          {isNil(group) ? (
            <MultipleChoiceChart
              timestamps={timestamps}
              actualCloseTime={actualCloseTime}
              choiceItems={choices}
              height={chartHeight ?? Math.max(height, CHART_HEIGHT)}
              extraTheme={chartTheme}
              defaultZoom={defaultChartZoom}
              withZoomPicker={withZoomPicker}
              scaling={scaling}
              forecastAvailability={forecastAvailability}
              openTime={openTime}
              hideCP={hideCP}
              yLabel={yLabel}
              isEmbedded={isEmbed}
              forFeedPage
            />
          ) : (
            <GroupChart
              questionType={groupType}
              timestamps={timestamps}
              actualCloseTime={actualCloseTime}
              choiceItems={choices}
              height={chartHeight ?? Math.max(height, CHART_HEIGHT)}
              extraTheme={chartTheme}
              defaultZoom={defaultChartZoom}
              withZoomPicker={withZoomPicker}
              scaling={scaling}
              forecastAvailability={forecastAvailability}
              forceShowLinePoints={true}
              openTime={openTime}
              hideCP={hideCP}
              yLabel={yLabel}
              isEmbedded={isEmbed}
              forFeedPage
            />
          )}
        </div>
      )}
    </div>
  );
};

type FanGraphTileProps = BaseProps & GroupProps;

export const FanGraphTile: FC<FanGraphTileProps> = ({
  group,
  choices,
  visibleChoicesCount,
  hideCP,
  chartHeight,
  groupType,
  canPredict,
  showChart = true,
  minimalistic = false,
  optionsLimit,
}) => {
  const { onReaffirm } = useCardReaffirmContext();
  const { ref, height } = useContainerSize<HTMLDivElement>();
  const { user } = useAuth();
  const { canReaffirm, forecast } = useMemo(
    () =>
      generateReaffirmData({
        groupQuestions: group.questions,
        groupType,
        user,
      }),
    [group.questions, groupType, user]
  );

  const handleReaffirmClick = useCallback(() => {
    if (!onReaffirm || !canReaffirm) return;

    onReaffirm(forecast);
  }, [canReaffirm, forecast, onReaffirm]);

  return (
    <div
      className={cn(
        "MultipleChoiceTile ml-0 flex w-full flex-col items-start",
        {
          "md:grid md:grid-cols-5": showChart,
          "gap-8": !minimalistic,
        }
      )}
    >
      <div
        className={cn("resize-container w-full", {
          "md:col-span-2": !minimalistic,
        })}
      >
        {!minimalistic && (
          <MultipleChoiceTileLegend
            ref={ref}
            choices={choices}
            visibleChoicesCount={visibleChoicesCount}
            hideCP={hideCP}
            questionType={groupType}
            canPredict={canPredict && canReaffirm}
            onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
            withChoiceIcon={false}
          />
        )}
      </div>
      {showChart && (
        <div
          className={cn("w-full md:col-span-5", {
            "md:col-span-3": !minimalistic,
          })}
        >
          <FanChart
            group={group}
            height={chartHeight ?? Math.max(height, CHART_HEIGHT)}
            pointSize={9}
            hideCP={hideCP}
            withTooltip={false}
            optionsLimit={optionsLimit}
            forFeedPage
          />
        </div>
      )}
    </div>
  );
};

// generate data to submit based on user forecast and post type
function generateReaffirmData({
  question,
  groupQuestions,
  groupType,
  user,
}: {
  question?: QuestionWithMultipleChoiceForecasts;
  groupQuestions?: QuestionWithNumericForecasts[];
  groupType?: QuestionType;
  user: CurrentUser | null;
}): {
  canReaffirm: boolean;
  forecast: ForecastPayload[];
} {
  const fallback = { canReaffirm: false, forecast: [] };

  // multiple choice question
  if (question) {
    const latest = question.my_forecasts?.latest;
    const hasActivePrediction = latest && isForecastActive(latest);
    if (!hasActivePrediction) {
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

    const forecastExpiration = buildDefaultForecastExpiration(
      question,
      user?.prediction_expiration_percent ?? undefined
    );

    const forecastEndTime = forecastExpirationToDate(forecastExpiration);
    return {
      canReaffirm:
        !!latest.forecast_values.length && !!Object.keys(forecastValue).length,
      forecast: [
        {
          questionId: question.id,
          forecastEndTime,
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
        const hasActivePrediction = latest && isForecastActive(latest);
        let forecast: number | null = null;
        if (hasActivePrediction) {
          forecast = latest?.forecast_values[1] ?? null;
        }

        return {
          question: q,
          forecast,
        };
      });

      const reaffirmForecasts = groupForecasts.filter(
        (q) => q.forecast !== null && q.question.status === QuestionStatus.OPEN
      );

      return {
        canReaffirm: !!reaffirmForecasts.length,
        forecast: reaffirmForecasts.map((q) => {
          const forecastExpiration = buildDefaultForecastExpiration(
            q.question,
            user?.prediction_expiration_percent ?? undefined
          );
          return {
            questionId: q.question.id,
            forecastEndTime: forecastExpirationToDate(forecastExpiration),
            forecastData: {
              probabilityYes: q.forecast,
              probabilityYesPerCategory: null,
              continuousCdf: null,
            },
          };
        }),
      };
    }

    // continuous group
    if (ContinuousQuestionTypes.some((type) => type === groupType)) {
      const groupForecasts = groupQuestions.map((q) => {
        const latest = q.my_forecasts?.latest;
        let forecastValues: number[] | undefined = undefined;
        const hasActivePrediction = latest && isForecastActive(latest);

        if (hasActivePrediction) {
          forecastValues = latest.forecast_values;
        }

        return {
          question: q,
          forecastValues,
          distributionInput: latest?.distribution_input,
        };
      });

      const reaffirmForecasts = groupForecasts.filter(
        (q) =>
          !isNil(q.forecastValues) &&
          !isNil(q.distributionInput) &&
          q.question.status === QuestionStatus.OPEN
      );

      return {
        canReaffirm: !!reaffirmForecasts.length,
        forecast: reaffirmForecasts.map((q) => {
          const forecastExpiration = buildDefaultForecastExpiration(
            q.question,
            user?.prediction_expiration_percent ?? undefined
          );
          return {
            questionId: q.question.id,
            forecastEndTime: forecastExpirationToDate(forecastExpiration),
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
