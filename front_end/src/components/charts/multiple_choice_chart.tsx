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
  generateNumericDomain,
  generateScale,
  generateTimestampXScale,
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
  onCursorChange?: (value: number, format: TickFormat) => void;
  onChartReady?: () => void;
  extraTheme?: VictoryThemeDefinition;
  userForecasts?: UserChoiceItem[];
  questionType?: QuestionType;
  scaling?: Scaling;
  isClosed?: boolean;
  aggregation?: boolean;
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
  aggregation,
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

  const defaultCursor = isClosed
    ? actualCloseTime
      ? actualCloseTime / 1000
      : timestamps[timestamps.length - 1]
    : Date.now() / 1000;
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
        aggregation,
        extraTheme,
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

  // Define a custom "X" symbol function
  const GetSymbol: React.FC<PointProps> = (props: PointProps) => {
    const { x, y, datum, size, style } = props;
    const symbol = datum.symbol;
    const stroke = style.stroke;

    if (symbol === "x") {
      return (
        <g>
          <line
            x1={x! - (size! as number)}
            y1={y! - (size! as number)}
            x2={x! + (size! as number)}
            y2={y! + (size! as number)}
            stroke={stroke}
            strokeWidth={2}
          />
          <line
            x1={x! - (size! as number)}
            y1={y! + (size! as number)}
            x2={x! + (size! as number)}
            y2={y! - (size! as number)}
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
        radius={size! as number}
        stroke={stroke}
        fill={"none"}
        strokeWidth={2}
      />
    );
  };

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
              interpolation="stepAfter"
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
                dataComponent={<GetSymbol />}
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
}: {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  width: number;
  height: number;
  zoom: TimelineChartZoomOption;
  questionType?: QuestionType;
  scaling?: Scaling;
  aggregation?: boolean;
  extraTheme?: VictoryThemeDefinition;
}): ChartData {
  const latestTimestamp = actualCloseTime
    ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
    : Date.now() / 1000;
  const xDomain = aggregation
    ? generateNumericDomain([...timestamps], zoom)
    : generateNumericDomain([...timestamps, latestTimestamp], zoom);

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
        if (scaling) {
          return unscaleNominalLocation(
            scaleInternalLocation(val, choiceScaling!),
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
          scatter[scatter.length - 1].y === null
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
          scatter.push({
            x: timestamp,
            y: scatter[scatter.length - 1].y,
            y1: scatter[scatter.length - 1].y1,
            y2: scatter[scatter.length - 1].y2,
            symbol: "x",
          });
          scatter.push({
            x: timestamp,
            y: null,
            y1: null,
            y2: null,
            symbol: "circle",
          });
        }
      });
      aggregationTimestamps.forEach((timestamp, timestampIndex) => {
        const aggregationValue = aggregationValues[timestampIndex];
        const aggregationMinValue = aggregationMinValues[timestampIndex];
        const aggregationMaxValue = aggregationMaxValues[timestampIndex];
        // build line and area (CP data)
        if (
          !line.length ||
          aggregationValue ||
          line[line.length - 1].y === null
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
          line.push({
            x: timestamp,
            y: line[line.length - 1].y,
          });
          area.push({
            x: timestamp,
            y: area[area.length - 1].y,
            y0: area[area.length - 1].y0,
          });
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
          y: item.line.at(-1)!.y,
        });
        item.area!.push({
          x: closeTime ? closeTime / 1000 : latestTimestamp,
          y: item.area!.at(-1)!.y,
          y0: item.area!.at(-1)!.y0,
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

  const fontSize = extraTheme ? getTickLabelFontSize(extraTheme) : undefined;
  const xScale = generateTimestampXScale(xDomain, width, fontSize);
  const yScale =
    questionType === "numeric" || questionType === "date"
      ? generateScale({
          displayType: questionType,
          axisLength: height,
          direction: "vertical",
          scaling: scaling,
        })
      : generateScale({
          displayType: "percent",
          axisLength: height,
        });

  return { xScale, yScale, graphs, xDomain };
}

export default memo(MultipleChoiceChart);
