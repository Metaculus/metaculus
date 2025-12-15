"use client";

import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC, ReactNode, useCallback, useMemo } from "react";
import { VictoryThemeDefinition } from "victory";

import { TimelineChartZoomOption } from "@/types/charts";
import { QuestionStatus, Resolution } from "@/types/post";
import {
  AggregateForecastHistory,
  ForecastAvailability,
  QuestionType,
  Scaling,
  UserForecastHistory,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { getResolutionPoint } from "@/utils/charts/resolution";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

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
  title?: string;
  forecastAvailability?: ForecastAvailability;
  questionStatus?: QuestionStatus;
  cursorTooltip?: ReactNode;
  isConsumerView?: boolean;
  forFeedPage?: boolean;
  colorOverride?: ThemeColor | string;
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
  questionStatus,
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
  title,
  forecastAvailability,
  cursorTooltip,
  isConsumerView,
  forFeedPage,
  colorOverride,
}) => {
  const locale = useLocale();
  const resolutionPoint = useMemo(() => {
    if (!resolution || !resolveTime || isNil(actualCloseTime)) {
      return null;
    }
    const lastAggregation = aggregation.latest;

    const resolveSec = (() => {
      const n = Number(resolveTime);
      if (Number.isFinite(n) && String(resolveTime).trim() !== "") {
        return Math.floor(n > 1e12 ? n / 1000 : n);
      }
      const d = new Date(String(resolveTime));
      const ms = d.getTime();
      return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
    })();

    if (resolveSec == null) return null;

    return getResolutionPoint({
      lastAggregation,
      questionType,
      resolution,
      resolveTime: Math.min(resolveSec, Math.floor(actualCloseTime / 1000)),
      scaling,
      inboundOutcomeCount,
      size: 5,
    });
  }, [
    inboundOutcomeCount,
    actualCloseTime,
    questionType,
    resolution,
    resolveTime,
    scaling,
    aggregation.latest,
  ]);

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
        forceYTickCount: forFeedPage ? 3 : 5,
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
      forFeedPage,
    ]
  );
  const formattedResolution = formatResolution({
    resolution,
    questionType,
    locale,
    scaling,
    actual_resolve_time: resolveTime ?? null,
  });
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
      chartTitle={title}
      yLabel={unit?.length && unit.length > 3 ? unit : undefined}
      forecastAvailability={forecastAvailability}
      questionStatus={questionStatus}
      resolution={
        isNil(resolution) || isUnsuccessfullyResolved(resolution)
          ? null
          : formattedResolution
      }
      cursorTooltip={cursorTooltip}
      isConsumerView={isConsumerView}
      questionType={questionType}
      colorOverride={colorOverride}
    />
  );
};

export default NumericTimeline;
