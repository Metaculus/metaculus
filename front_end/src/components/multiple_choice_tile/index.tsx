"use client";

import { isNil } from "lodash";
import React, { FC } from "react";
import { VictoryThemeDefinition } from "victory";

import FanGraphGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/fan_graph_group_chart";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import PredictionChip from "@/components/prediction_chip";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { PostStatus } from "@/types/post";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";

import MultipleChoiceTileLegend from "./multiple_choice_tile_legend";

type BaseProps = {
  choices: ChoiceItem[];
  visibleChoicesCount: number;
  questionType?: QuestionType;
  hideCP?: boolean;
  forecastAvailability?: ForecastAvailability;
  chartHeight?: number;
};

type ContinuousMultipleChoiceTileProps = BaseProps & {
  timestamps: number[];
  actualCloseTime?: number | null;
  openTime: number | undefined;
  defaultChartZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  chartTheme?: VictoryThemeDefinition;
  question?: QuestionWithForecasts;
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
  questionType,
  scaling,
  hideCP,
  forecastAvailability,
}) => {
  // when resolution chip is shown we want to hide the chart and display the chip
  // (e.g. multiple-choice question on questions feed)
  // otherwise, resolution status will be populated near the every choice
  // (e.g. multiple-choice question in the embedding view, or questions group)
  const isResolvedView =
    !isNil(question?.resolution) &&
    choices.every((choice) => isNil(choice.resolution));

  return (
    <div className="MultipleChoiceTile ml-0 mr-2 flex w-full grid-cols-[200px_auto] flex-col items-start gap-3 pr-1 xs:grid">
      <div className="resize-container">
        {isResolvedView ? (
          <PredictionChip question={question} status={PostStatus.RESOLVED} />
        ) : (
          <MultipleChoiceTileLegend
            choices={choices}
            visibleChoicesCount={visibleChoicesCount}
            questionType={questionType}
            hideCP={hideCP}
          />
        )}
      </div>
      {!isResolvedView && (
        <div className="relative">
          <MultipleChoiceChart
            timestamps={timestamps}
            actualCloseTime={actualCloseTime}
            choiceItems={choices}
            height={chartHeight}
            extraTheme={chartTheme}
            defaultZoom={defaultChartZoom}
            withZoomPicker={withZoomPicker}
            questionType={questionType}
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

type FanGraphMultipleChoiceTileProps = BaseProps & {
  questions: QuestionWithNumericForecasts[];
};

export const FanGraphMultipleChoiceTile: FC<
  FanGraphMultipleChoiceTileProps
> = ({
  questions,
  choices,
  visibleChoicesCount,
  hideCP,
  forecastAvailability,
  chartHeight,
  questionType,
}) => {
  return (
    <div className="MultipleChoiceTile ml-0 mr-2 flex w-full grid-cols-[200px_auto] flex-col items-start gap-3 pr-1 xs:grid">
      <div className="resize-container">
        <MultipleChoiceTileLegend
          choices={choices}
          visibleChoicesCount={visibleChoicesCount}
          hideCP={hideCP}
          questionType={questionType}
          hideChoiceIcon
          optionLabelClassName="text-olive-800 dark:text-olive-800-dark"
        />
      </div>
      <div>
        <FanGraphGroupChart
          questions={questions}
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
