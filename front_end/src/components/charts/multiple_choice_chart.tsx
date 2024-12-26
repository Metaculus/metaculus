"use client";

import { isNil, merge } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, memo, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  PointProps,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
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
import { QuestionType, Scaling } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import {
  findPreviousTimestamp,
  generateNumericXDomain,
  generateScale,
  generateTimestampXScale,
  generateYDomain,
  getTickLabelFontSize,
  scaleInternalLocation,
  unscaleNominalLocation,
} from "@/utils/charts";

import ChartContainer from "./primitives/chart_container";
import ChartCursorLabel from "./primitives/chart_cursor_label";
import XTickLabel from "./primitives/x_tick_label";

type Props = {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  height?: number;
  yLabel?: string;
  hideCP?: boolean;
  onCursorChange?: (value: number, format: TickFormat) => void;
  onChartReady?: () => void;
  extraTheme?: VictoryThemeDefinition;
  userForecasts?: UserChoiceItem[];
  questionType?: QuestionType;
  scaling?: Scaling;
  isClosed?: boolean;
  aggregation?: boolean;
  isEmptyDomain?: boolean;
  openTime?: number;
};

const MultipleChoiceChart: FC<Props> = ({
  timestamps,
  actualCloseTime,
  choiceItems,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  height = 150,
  yLabel,
  hideCP,
  onCursorChange,
  onChartReady,
  extraTheme,
  questionType = QuestionType.Binary,
  scaling,
  isClosed,
  aggregation,
  isEmptyDomain,
  openTime,
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
  const tickLabelFontSize = getTickLabelFontSize(actualTheme);

  const defaultCursor = useMemo(
    () =>
      isClosed
        ? actualCloseTime
          ? actualCloseTime / 1000
          : timestamps[timestamps.length - 1]
        : Date.now() / 1000,
    [actualCloseTime, isClosed, timestamps]
  );
  const [isCursorActive, setIsCursorActive] = useState(false);

  const [zoom, setZoom] = useState<TimelineChartZoomOption>(defaultZoom);
  const { xScale, yScale, graphs, xDomain, yDomain } = useMemo(
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
        aggregation,
        extraTheme,
        hideCP,
        isAggregationsEmpty: isEmptyDomain,
        openTime,
      }),
    [
      timestamps,
      choiceItems,
      chartWidth,
      chartHeight,
      zoom,
      questionType,
      scaling,
      actualCloseTime,
      aggregation,
      extraTheme,
      hideCP,
      isEmptyDomain,
      openTime,
    ]
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
          containerComponent={
            onCursorChange ? (
              CursorContainer
            ) : (
              <VictoryContainer
                style={{
                  pointerEvents: "auto",
                  userSelect: "auto",
                  touchAction: "auto",
                }}
              />
            )
          }
          domain={{
            x: xDomain,
            y: yDomain,
          }}
        >
          {graphs.map(({ line, color, active, highlighted }, index) =>
            active ? (
              <VictoryLine
                key={`multiple-choice-line-${index}`}
                data={line}
                style={{
                  data: {
                    stroke: getThemeColor(color),
                    strokeOpacity: !isHighlightActive
                      ? 1
                      : highlighted
                        ? 1
                        : 0.2,
                  },
                }}
                interpolation="stepAfter"
              />
            ) : null
          )}
          {graphs.map(({ area, color, highlighted, active }, index) =>
            active ? (
              <VictoryArea
                key={`multiple-choice-area-${index}`}
                data={area}
                style={{
                  data: {
                    fill: getThemeColor(color),
                    opacity: highlighted ? 0.3 : 0,
                  },
                }}
                interpolation="stepAfter"
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

          {graphs.map(({ active, scatter, color, highlighted }, index) =>
            active && (!isHighlightActive || highlighted) ? (
              <VictoryScatter
                key={`multiple-choice-scatter-${index}`}
                data={scatter}
                dataComponent={<PredictionSymbol />}
                style={{
                  data: {
                    stroke: getThemeColor(color),
                    fill: "none",
                    strokeWidth: 2,
                  },
                }}
              />
            ) : null
          )}

          <VictoryAxis
            dependentAxis
            tickValues={yScale.ticks}
            tickFormat={yScale.tickFormat}
            style={{
              tickLabels: { padding: 2 },
            }}
            label={yLabel}
            axisLabelComponent={
              <VictoryLabel
                dy={-10}
                style={{ fill: getThemeColor(METAC_COLORS.gray["1000"]) }}
              />
            }
          />
          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={isCursorActive ? () => "" : xScale.tickFormat}
            tickLabelComponent={
              <XTickLabel
                chartWidth={chartWidth}
                withCursor={!!onCursorChange}
                fontSize={tickLabelFontSize as number}
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
  scatter?: Line;
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
  yDomain: DomainTuple;
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
  aggregation,
  extraTheme,
  hideCP,
  isAggregationsEmpty,
  openTime,
}: {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  width: number;
  height: number;
  zoom: TimelineChartZoomOption;
  questionType: QuestionType;
  scaling?: Scaling;
  aggregation?: boolean;
  extraTheme?: VictoryThemeDefinition;
  hideCP?: boolean;
  isAggregationsEmpty?: boolean;
  openTime?: number;
}): ChartData {
  const closeTimes = choiceItems
    .map(({ closeTime }) => closeTime)
    .filter((t) => t !== undefined);
  const latestTimestamp = actualCloseTime
    ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
    : !!closeTimes.length && closeTimes.length === choiceItems.length
      ? Math.min(
          // @ts-expect-error we manually filter out undefined values, this is fixed on more recent typescript versions
          Math.max(...closeTimes.map((t) => t / 1000)),
          Date.now() / 1000
        )
      : Date.now() / 1000;

  const graphs: ChoiceGraph[] = choiceItems.map(
    ({
      choice,
      aggregationTimestamps,
      aggregationValues,
      aggregationMinValues,
      aggregationMaxValues,
      userTimestamps,
      userValues,
      userMaxValues,
      userMinValues,
      color,
      active,
      highlighted,
      closeTime,
      resolution,
      scaling: choiceScaling,
    }) => {
      const rescale = (val: number) => {
        if (scaling && choiceScaling) {
          return unscaleNominalLocation(
            scaleInternalLocation(val, choiceScaling),
            scaling
          );
        }
        return val;
      };

      const scatter: Line = [];
      const line: Line = [];
      const area: Area = [];

      userTimestamps.forEach((timestamp, timestampIndex) => {
        const userValue = userValues[timestampIndex];
        const userMaxValue = userMaxValues
          ? userMaxValues[timestampIndex]
          : null;
        const userMinValue = userMinValues
          ? userMinValues[timestampIndex]
          : null;
        // build user scatter points
        if (
          !scatter.length ||
          userValue ||
          isNil(scatter[scatter.length - 1]?.y)
        ) {
          // we are either starting or have a real value or previous value is null
          scatter.push({
            x: timestamp,
            y: userValue ? rescale(userValue) : null,
            y1: userMinValue ? rescale(userMinValue) : null,
            y2: userMaxValue ? rescale(userMaxValue) : null,
            symbol: "circle",
          });
        } else {
          // we have a null vlalue while previous was real
          const lastScatterItem = scatter.at(-1);
          if (!isNil(lastScatterItem)) {
            scatter.push({
              x: timestamp,
              y: lastScatterItem.y,
              y1: lastScatterItem.y1,
              y2: lastScatterItem.y2,
              symbol: "x",
            });
          }

          scatter.push({
            x: timestamp,
            y: null,
            y1: null,
            y2: null,
            symbol: "circle",
          });
        }
      });
      if (!hideCP) {
        aggregationTimestamps.forEach((timestamp, timestampIndex) => {
          const aggregationValue = aggregationValues[timestampIndex];
          const aggregationMinValue = aggregationMinValues[timestampIndex];
          const aggregationMaxValue = aggregationMaxValues[timestampIndex];
          // build line and area (CP data)
          if (
            !line.length ||
            aggregationValue ||
            isNil(line[line.length - 1]?.y)
          ) {
            // we are either starting or have a real value or previous value is null
            line.push({
              x: timestamp,
              y: aggregationValue ? rescale(aggregationValue) : null,
            });
            area.push({
              x: timestamp,
              y: aggregationMaxValue ? rescale(aggregationMaxValue) : null,
              y0: aggregationMinValue ? rescale(aggregationMinValue) : null,
            });
          } else {
            // we have a null vlalue while previous was real
            const lastLineItem = line.at(-1);
            if (!isNil(lastLineItem)) {
              line.push({
                x: timestamp,
                y: lastLineItem.y,
              });
            }
            const lastAreaItem = area.at(-1);
            if (!isNil(lastAreaItem)) {
              area.push({
                x: timestamp,
                y: lastAreaItem.y,
                y0: lastAreaItem.y0,
              });
            }

            line.push({
              x: timestamp,
              y: null,
            });
            area.push({
              x: timestamp,
              y: null,
              y0: null,
            });
          }
        });
      }

      const item: ChoiceGraph = {
        choice,
        color,
        line: line,
        area: area,
        scatter: scatter,
        active,
        highlighted,
      };
      if (item.line.length > 0) {
        item.line.push({
          x: closeTime ? closeTime / 1000 : latestTimestamp,
          y: item.line.at(-1)?.y ?? null,
        });
        item.area?.push({
          x: closeTime ? closeTime / 1000 : latestTimestamp,
          y: item?.area?.at(-1)?.y ?? null,
          y0: item?.area?.at(-1)?.y0 ?? null,
        });
      }

      if (!isNil(resolution)) {
        const resolveTime = closeTime ? closeTime / 1000 : latestTimestamp;
        if (resolution === choice) {
          // multiple choice case
          item.resolutionPoint = {
            x: resolveTime,
            y: 1,
          };
        }

        if (
          ["yes", "no", "below_lower_bound", "above_upper_bound"].includes(
            resolution as string
          )
        ) {
          // binary group and out of borders cases
          item.resolutionPoint = {
            x: resolveTime,
            y:
              resolution === "no" || resolution === "below_lower_bound" ? 0 : 1,
          };
        }

        if (isFinite(Number(resolution))) {
          // continuous group case
          item.resolutionPoint = {
            x: resolveTime,
            y: scaling
              ? unscaleNominalLocation(Number(resolution), scaling)
              : Number(resolution) ?? 0,
          };
        }
      }

      return item;
    }
  );

  const domainTimestamps =
    isAggregationsEmpty && !!openTime
      ? [openTime / 1000, latestTimestamp]
      : aggregation
        ? timestamps
        : [...timestamps, latestTimestamp];

  const xDomain = generateNumericXDomain(domainTimestamps, zoom);
  const fontSize = extraTheme ? getTickLabelFontSize(extraTheme) : undefined;
  const xScale = generateTimestampXScale(xDomain, width, fontSize);

  // @ts-expect-error we manually check, that areas are not nullable, this should be fixed on later ts versions
  const areas: Area = graphs
    .filter((g) => !isNil(g.area) && g.active)
    .flatMap((g) => g.area);
  const { originalYDomain, zoomedYDomain } = generateYDomain({
    zoom,
    minTimestamp: xDomain[0],
    isChartEmpty: !domainTimestamps.length,
    minValues: areas.map((a) => ({ timestamp: a.x, y: a.y0 })),
    maxValues: areas.map((a) => ({ timestamp: a.x, y: a.y })),
  });
  const yScale = generateScale({
    displayType: questionType,
    axisLength: height,
    direction: "vertical",
    scaling: scaling,
    domain: originalYDomain,
    zoomedDomain: zoomedYDomain,
  });

  return { xScale, yScale, graphs, xDomain, yDomain: zoomedYDomain };
}

// Define a custom "X" symbol function
const PredictionSymbol: React.FC<PointProps> = (props: PointProps) => {
  const { x, y, datum, size, style } = props;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof size !== "number"
  ) {
    return null;
  }
  const symbol = datum.symbol;
  const stroke = style.stroke;

  if (symbol === "x") {
    return (
      <g>
        <line
          x1={x - size}
          y1={y - size}
          x2={x + size}
          y2={y + size}
          stroke={stroke}
          strokeWidth={2}
        />
        <line
          x1={x - size}
          y1={y + size}
          x2={x + size}
          y2={y - size}
          stroke={stroke}
          strokeWidth={2}
        />
      </g>
    );
  }

  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      stroke={stroke}
      fill={"none"}
      strokeWidth={2}
    />
  );
};

export default memo(MultipleChoiceChart);
