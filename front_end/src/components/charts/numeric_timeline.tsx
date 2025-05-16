"use client";

import { getUnixTime } from "date-fns";
import { isNil } from "lodash";
import React, { FC, useCallback, useMemo } from "react";
import { VictoryThemeDefinition } from "victory";

import { TimelineChartZoomOption } from "@/types/charts";
import { Resolution } from "@/types/post";
import {
  AggregateForecastHistory,
  QuestionType,
  Scaling,
  UserForecastHistory,
} from "@/types/question";
import { getResolutionPoint } from "@/utils/charts/resolution";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

import { buildNumericChartData } from "./helpers";
import NewNumericChart from "./new_numeric_chart";

type Props = {
  aggregation: AggregateForecastHistory;
  aggregationIndex?: number;
  myForecasts?: UserForecastHistory;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  yLabel?: string;
  height?: number;
  onCursorChange?: (value: number | null) => void;
  onChartReady?: () => void;
  questionType: QuestionType;
  actualCloseTime: number | null | undefined;
  scaling: Scaling;
  extraTheme?: VictoryThemeDefinition;
  resolution?: Resolution | null;
  resolveTime?: string | null;
  hideCP?: boolean;
  isEmptyDomain?: boolean;
  openTime?: number;
  unit?: string;
  tickFontSize?: number;
  nonInteractive?: boolean;
};

const NumericTimeline: FC<Props> = ({
  aggregation,
  aggregationIndex = 0,
  myForecasts,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker,
  yLabel,
  height = 150,
  onCursorChange,
  onChartReady,
  questionType,
  actualCloseTime,
  scaling,
  extraTheme,
  resolution,
  resolveTime,
  hideCP,
  isEmptyDomain,
  openTime,
  unit,
  tickFontSize,
  nonInteractive,
}) => {
  const resolutionPoint = useMemo(() => {
    if (!resolution || !resolveTime || isNil(actualCloseTime)) {
      return null;
    }

    return getResolutionPoint({
      questionType,
      resolution,
      resolveTime: Math.min(getUnixTime(resolveTime), actualCloseTime / 1000),
      scaling,
    });
  }, [actualCloseTime, questionType, resolution, resolveTime, scaling]);

  const getCursorValue = useCallback(
    (value: number) => {
      const displayValue = getPredictionDisplayValue(value, {
        questionType,
        scaling,
        unit,
        actual_resolve_time: resolveTime ?? null,
      });

      return displayValue.split("\n")[0] ?? displayValue;
    },
    [questionType, scaling, unit, resolveTime]
  );
  return (
    <NewNumericChart
      buildChartData={(width, zoom) =>
        buildNumericChartData({
          questionType,
          actualCloseTime,
          scaling,
          height,
          aggregation,
          aggregationIndex,
          myForecasts,
          width,
          zoom,
          extraTheme,
          isAggregationsEmpty: isEmptyDomain,
          openTime,
          unit,
          forceYTickCount: 5,
        })
      }
      extraTheme={extraTheme}
      onChartReady={onChartReady}
      onCursorChange={onCursorChange}
      defaultZoom={defaultZoom}
      withZoomPicker={withZoomPicker}
      yLabel={yLabel}
      hideCP={hideCP}
      resolutionPoint={resolutionPoint ? [resolutionPoint] : undefined}
      getCursorValue={getCursorValue}
      height={height}
      tickFontSize={tickFontSize}
      nonInteractive={nonInteractive}
    />
  );
};

export default NumericTimeline;
