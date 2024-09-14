"use client";

import { isNil, merge } from "lodash";
import React, { FC, memo, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLabelProps,
  VictoryLine,
  VictoryScatter,
  VictoryThemeDefinition,
} from "victory";

import { lightTheme, darkTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  Area,
  BaseChartData,
  Line,
  TickFormat,
  TimelineChartZoomOption,
} from "@/types/charts";
import { ChoiceItem, UserChoiceItem } from "@/types/choices";
import { ThemeColor } from "@/types/theme";
import {
  findPreviousTimestamp,
  generateNumericDomain,
  generatePercentageYScale,
  generateTicksY,
  generateTimestampXScale,
  getDisplayValue,
  scaleInternalLocation,
  unscaleNominalLocation,
} from "@/utils/charts";

import ChartContainer from "./primitives/chart_container";
import ChartCursorLabel from "./primitives/chart_cursor_label";
import XTickLabel from "./primitives/x_tick_label";
import { useTranslations } from "next-intl";
import { QuestionType, Scaling } from "@/types/question";

type Props = {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  height?: number;
  yLabel?: string;
  onCursorChange?: (value: number, format: TickFormat) => void;
  onChartReady?: () => void;
  extraTheme?: VictoryThemeDefinition;
  userForecasts?: UserChoiceItem[];
  questionType?: QuestionType;
  scaling?: Scaling;
  isClosed?: boolean;
};

const MultipleChoiceChart: FC<Props> = ({
  timestamps,
  actualCloseTime,
  choiceItems,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  height = 150,
  yLabel,
  onCursorChange,
  onChartReady,
  extraTheme,
  userForecasts,
  questionType,
  scaling,
  isClosed,
}) => {
  const t = useTranslations();
  const {
    ref: chartContainerRef,
    width: chartWidth,
    height: chartHeight,
  } = useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const defaultCursor = timestamps[timestamps.length - 1];
  const [isCursorActive, setIsCursorActive] = useState(false);

  const [zoom, setZoom] = useState<TimelineChartZoomOption>(defaultZoom);
  const { xScale, yScale, graphs, xDomain } = useMemo(
    () =>
      buildChartData({
        timestamps,
        choiceItems,
        width: chartWidth,
        height: chartHeight,
        zoom,
        questionType,
        scaling,
        actualCloseTime,
      }),
    [timestamps, choiceItems, chartWidth, chartHeight, zoom, userForecasts]
  );

  const isHighlightActive = useMemo(
    () => Object.values(choiceItems).some(({ highlighted }) => highlighted),
    [choiceItems]
  );

  const prevWidth = usePrevious(chartWidth);
  useEffect(() => {
    if (!prevWidth && chartWidth && onChartReady) {
      onChartReady();
    }
  }, [onChartReady, prevWidth, chartWidth]);

  const CursorContainer = (
    <VictoryCursorContainer
      cursorDimension={"x"}
      defaultCursorValue={defaultCursor}
      cursorLabelOffset={{
        x: 0,
        y: 0,
      }}
      cursorLabel={({ datum }: VictoryLabelProps) => {
        if (datum) {
          return datum.x === defaultCursor
            ? isClosed
              ? ""
              : t("now")
            : xScale.cursorFormat?.(datum.x) ?? xScale.tickFormat(datum.x);
        }
      }}
      cursorComponent={
        <LineSegment
          style={{
            stroke: getThemeColor(METAC_COLORS.gray["600"]),
            strokeDasharray: "2,1",
          }}
        />
      }
      cursorLabelComponent={<ChartCursorLabel positionY={height - 10} />}
      onCursorChange={(value: CursorCoordinatesPropType) => {
        if (typeof value === "number" && onCursorChange) {
          const lastTimestamp = timestamps[timestamps.length - 1];
          if (value === lastTimestamp) {
            onCursorChange(lastTimestamp, xScale.tickFormat);
            return;
          }

          const closestTimestamp = findPreviousTimestamp(timestamps, value);

          onCursorChange(closestTimestamp, xScale.tickFormat);
        }
      }}
    />
  );
  return (
    <ChartContainer
      ref={chartContainerRef}
      height={height}
      zoom={withZoomPicker ? zoom : undefined}
      onZoomChange={setZoom}
    >
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          events={[
            {
              target: "parent",
              eventHandlers: {
                onMouseOverCapture: () => {
                  if (!onCursorChange) return;

                  setIsCursorActive(true);
                },
                onMouseOutCapture: () => {
                  if (!onCursorChange) return;

                  setIsCursorActive(false);
                },
              },
            },
          ]}
          containerComponent={onCursorChange ? CursorContainer : undefined}
          domain={{ x: xDomain }}
        >
          {graphs.map(({ line, color, active, highlighted }, index) => (
            <VictoryLine
              key={`multiple-choice-line-${index}`}
              data={line}
              style={{
                data: {
                  stroke: active ? getThemeColor(color) : "transparent",
                  strokeOpacity: !isHighlightActive ? 1 : highlighted ? 1 : 0.2,
                },
              }}
            />
          ))}
          {graphs.map(({ area, color, highlighted }, index) =>
            !!area && highlighted ? (
              <VictoryArea
                key={`multiple-choice-area-${index}`}
                data={area}
                style={{
                  data: {
                    fill: getThemeColor(color),
                    opacity: 0.3,
                  },
                }}
              />
            ) : null
          )}
          {graphs.map(({ color, active, resolutionPoint }, index) => {
            if (!resolutionPoint || !active) return null;

            return (
              <VictoryScatter
                key={`multiple-choice-resolution-${index}`}
                data={[
                  {
                    x: resolutionPoint?.x,
                    y: resolutionPoint?.y,
                    symbol: "diamond",
                    size: 4,
                  },
                ]}
                style={{
                  data: {
                    stroke: getThemeColor(color),
                    fill: "none",
                    strokeWidth: 2.5,
                  },
                }}
              />
            );
          })}

          {userForecasts?.map((question) => {
            return (
              <VictoryScatter
                key={question.choice}
                data={question.values?.map((value, index) => ({
                  y: value,
                  x: question.timestamps?.[index],
                }))}
                style={{
                  data: {
                    stroke: getThemeColor(question.color),
                    fill: "none",
                    strokeWidth: 2,
                  },
                }}
              />
            );
          })}

          <VictoryAxis
            dependentAxis
            tickValues={yScale.ticks}
            tickFormat={yScale.tickFormat}
            style={{
              tickLabels: { padding: 2 },
            }}
            label={yLabel}
            axisLabelComponent={
              <VictoryLabel dy={-10} style={{ fill: "white" }} />
            }
          />
          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={isCursorActive ? () => "" : xScale.tickFormat}
            tickLabelComponent={
              <XTickLabel
                chartWidth={chartWidth}
                withCursor={!!onCursorChange}
              />
            }
          />
        </VictoryChart>
      )}
    </ChartContainer>
  );
};

export type ChoiceGraph = {
  line: Line;
  area?: Area;
  resolutionPoint?: {
    x?: number;
    y: number;
  };
  choice: string;
  color: ThemeColor;
  active: boolean;
  highlighted: boolean;
};
type ChartData = BaseChartData & {
  graphs: ChoiceGraph[];
  xDomain: DomainTuple;
};

function buildChartData({
  height,
  width,
  choiceItems,
  timestamps,
  actualCloseTime,
  zoom,
  questionType,
  scaling,
}: {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  width: number;
  height: number;
  zoom: TimelineChartZoomOption;
  questionType?: QuestionType;
  scaling?: Scaling;
}): ChartData {
  const latestTimestamp = actualCloseTime
    ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
    : Date.now() / 1000;
  const xDomain = generateNumericDomain([...timestamps, latestTimestamp], zoom);

  const graphs: ChoiceGraph[] = choiceItems.map(
    ({
      choice,
      values,
      minValues,
      maxValues,
      color,
      active,
      highlighted,
      timestamps: choiceTimestamps,
      resolution,
      rangeMin,
      rangeMax,
      scaling: choiceScaling,
    }) => {
      const actualTimestamps = choiceTimestamps ?? timestamps;

      const item: ChoiceGraph = {
        choice,
        color,
        line: actualTimestamps.map((timestamp, timestampIndex) => ({
          x: timestamp,
          y: scaling
            ? unscaleNominalLocation(
                scaleInternalLocation(values[timestampIndex], choiceScaling!),
                scaling
              )
            : values[timestampIndex] ?? 0,
        })),
        active,
        highlighted,
      };

      if (minValues && maxValues) {
        item.area = actualTimestamps.map((timestamp, timestampIndex) => ({
          x: timestamp,
          y: scaling
            ? unscaleNominalLocation(
                scaleInternalLocation(
                  maxValues[timestampIndex],
                  choiceScaling!
                ),
                scaling
              )
            : values[timestampIndex] ?? 0,
          y0: scaling
            ? unscaleNominalLocation(
                scaleInternalLocation(
                  minValues[timestampIndex],
                  choiceScaling!
                ),
                scaling
              )
            : values[timestampIndex] ?? 0,
        }));
      }

      if (!isNil(resolution)) {
        if (resolution === choice) {
          // multiple choice case
          item.resolutionPoint = {
            x: actualTimestamps.at(-1),
            y: rangeMax ?? 1,
          };
        }

        if (resolution === "yes" || resolution === "no") {
          // binary group case
          item.resolutionPoint = {
            x: actualTimestamps.at(-1),
            y: resolution === "no" ? rangeMin ?? 0 : rangeMax ?? 1,
          };
        }
      }

      return item;
    }
  );
  let yScale = generatePercentageYScale(height);
  if (!!scaling && !!questionType) {
    const { ticks, majorTicks } = generateTicksY(
      height,
      [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
      20
    );
    const tickFormat = (value: number): string => {
      if (!majorTicks.includes(value)) {
        return "";
      }
      return getDisplayValue(value, questionType!, scaling!);
    };
    yScale = { ticks, tickFormat };
  }

  return {
    xScale: generateTimestampXScale(xDomain, width),
    yScale,
    graphs: graphs,
    xDomain,
  };
}

export default memo(MultipleChoiceChart);
