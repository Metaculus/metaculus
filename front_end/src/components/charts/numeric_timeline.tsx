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
import NumericChart from "./numeric_chart";

type Props = {
  aggregation: AggregateForecastHistory;
  aggregationIndex?: number;
  myForecasts?: UserForecastHistory;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  height?: number;
  cursorTimestamp?: number | null;
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
  inboundOutcomeCount?: number | null;
  isEmbedded?: boolean;
  simplifiedCursor?: boolean;
};

const NumericTimeline: FC<Props> = ({
  aggregation,
  aggregationIndex = 0,
  myForecasts,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker,
  height = 150,
  cursorTimestamp,
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
  inboundOutcomeCount,
  isEmbedded,
  simplifiedCursor,
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

  const buildChartData = useCallback(
    (width: number, zoom: TimelineChartZoomOption) =>
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
        alwaysShowYTicks: true,
        inboundOutcomeCount,
      }),
    [
      questionType,
      actualCloseTime,
      scaling,
      height,
      aggregation,
      aggregationIndex,
      myForecasts,
      extraTheme,
      isEmptyDomain,
      openTime,
      unit,
      inboundOutcomeCount,
    ]
  );

  return (
    <NumericChart
      buildChartData={buildChartData}
      extraTheme={extraTheme}
      onChartReady={onChartReady}
      cursorTimestamp={cursorTimestamp}
      onCursorChange={onCursorChange}
      defaultZoom={defaultZoom}
      withZoomPicker={withZoomPicker}
      hideCP={hideCP}
      resolutionPoint={resolutionPoint ? [resolutionPoint] : undefined}
      getCursorValue={getCursorValue}
      height={height}
      tickFontSize={tickFontSize}
      nonInteractive={nonInteractive}
      isEmbedded={isEmbedded}
      simplifiedCursor={simplifiedCursor}
    />
  );
};

export default NumericTimeline;
