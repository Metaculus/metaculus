"use client";
import { isNil } from "lodash";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  VictoryArea,
  VictoryChart,
  VictoryContainer,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLabelProps,
  VictoryLine,
  VictoryScatter,
} from "victory";
import { VictoryAxis } from "victory";

import ChartContainer from "@/components/charts/primitives/chart_container";
import ChartCursorLabel from "@/components/charts/primitives/chart_cursor_label";
import XTickLabel from "@/components/charts/primitives/x_tick_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  Area,
  BaseChartData,
  Line,
  LinePoint,
  Scale,
  TimelineChartZoomOption,
} from "@/types/charts";
import { Tournament } from "@/types/projects";
import { QuestionType } from "@/types/question";
import { getAxisRightPadding, getTickLabelFontSize } from "@/utils/charts/axis";
import cn from "@/utils/core/cn";

type ChartData = {
  line: Line;
  area: Area;
  points: Line;
  yDomain: DomainTuple;
  xDomain: DomainTuple;
  yScale: Scale;
  xScale: Scale;
};

type Props = {
  chartData: ChartData;
  chartTitle?: string;
  height?: number;
  hideCP?: boolean;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  resolutionPoint?: LinePoint;
  yLabel?: string;
  onCursorChange?: (value: number | null) => void;
};

const BOTTOM_PADDING = 20;
// TODO: implement this as a reusable component that will receive chart data as props
const NewNumericChart: FC<Props> = ({
  chartData,
  chartTitle,
  height = 170,
  hideCP,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = true,
  resolutionPoint,
  yLabel,
  onCursorChange,
}) => {
  const { theme, getThemeColor } = useAppTheme();
  const [isChartReady, setIsChartReady] = useState(false);
  const [zoom, setZoom] = useState(defaultZoom);
  const [isCursorActive, setIsCursorActive] = useState(false);
  const { line, area, points, yDomain, xDomain, yScale, xScale } = chartData;
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const tickLabelFontSize = getTickLabelFontSize(chartTheme);
  console.log(tickLabelFontSize);
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const prevWidth = usePrevious(chartWidth);
  useEffect(() => {
    if (!prevWidth && chartWidth && handleChartReady) {
      handleChartReady();
    }
  }, [prevWidth, chartWidth, handleChartReady]);

  const { rightPadding, MIN_RIGHT_PADDING } = useMemo(() => {
    return getAxisRightPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);

  const defaultCursor = Date.now() / 1000;
  const CursorContainer = (
    <VictoryCursorContainer
      cursorDimension={"x"}
      defaultCursorValue={0}
      //   defaultCursorValue={defaultCursor}
      style={{
        touchAction: "pan-y",
      }}
      cursorLabelOffset={{
        x: 0,
        y: 0,
      }}
      cursorLabel={({ datum }: VictoryLabelProps) => {
        if (datum) {
          return datum.x === defaultCursor
            ? ""
            : xScale.cursorFormat?.(datum.x) ?? xScale.tickFormat(datum.x);
        }
      }}
      cursorComponent={
        <LineSegment
          style={{
            stroke: getThemeColor(METAC_COLORS.blue["700"]),
            strokeDasharray: "5,2",
          }}
        />
      }
      cursorLabelComponent={<ChartCursorLabel positionY={height - 10} />}
      //   onCursorChange={(value: CursorCoordinatesPropType) => {
      //     if (typeof value === "number" && onCursorChange) {
      //       onCursorChange(
      //         timestamps[timestamps.findIndex((t) => t > value) - 1] ?? null
      //       );
      //     }
      //   }}
    />
  );

  const shouldDisplayChart =
    !!chartWidth && !!xScale.ticks.length && yScale.ticks.length;

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <ChartContainer
        ref={chartContainerRef}
        height={height}
        zoom={withZoomPicker ? zoom : undefined}
        onZoomChange={setZoom}
        chartTitle={chartTitle}
      >
        {shouldDisplayChart && (
          <VictoryChart
            domain={{
              y: yDomain,
              x: xDomain,
            }}
            width={chartWidth}
            height={height}
            theme={chartTheme}
            padding={{
              right: Math.max(rightPadding, MIN_RIGHT_PADDING),
              top: 10,
              left: 10,
              bottom: BOTTOM_PADDING,
            }}
            events={[
              {
                target: "parent",
                eventHandlers: {
                  onMouseOverCapture: () => {
                    setIsCursorActive(true);
                  },
                  onMouseOutCapture: () => {
                    setIsCursorActive(false);
                  },
                  onMouseLeave: () => {
                    if (!onCursorChange) return;
                    onCursorChange(null);
                  },
                },
              },
            ]}
            containerComponent={CursorContainer}
            // containerComponent={
            //   onCursorChange ? (
            //     CursorContainer
            //   ) : (
            //     <VictoryContainer
            //       style={{
            //         pointerEvents: "auto",
            //         userSelect: "auto",
            //         touchAction: "auto",
            //       }}
            //     />
            //   )
            // }
          >
            {/* Y axis */}
            <VictoryAxis
              dependentAxis
              style={{
                ticks: {
                  stroke: "transparent",
                },
                tickLabels: { padding: 2, fontSize: 10 },
                axis: {
                  stroke: "transparent",
                },
                grid: {
                  stroke: getThemeColor(METAC_COLORS.gray["300"]),
                  strokeWidth: 1,
                  strokeDasharray: "2, 5",
                },
              }}
              tickValues={yScale.ticks}
              tickFormat={yScale.tickFormat}
              label={yLabel}
              orientation="left"
              offsetX={
                isNil(yLabel)
                  ? chartWidth + 5
                  : chartWidth -
                    Math.max(rightPadding - 35, MIN_RIGHT_PADDING - 35)
              }
              axisLabelComponent={
                <VictoryLabel
                  dy={Math.max(rightPadding - 10, MIN_RIGHT_PADDING - 10)}
                  //   dy={Math.max(rightPadding - 40, MIN_RIGHT_PADDING - 40)}
                />
              }
            />
            {/* X axis */}
            <VictoryAxis
              style={{
                ticks: {
                  stroke: "transparent",
                },
                axis: {
                  stroke: "transparent",
                },
              }}
              offsetY={BOTTOM_PADDING}
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
            {/* CP range */}
            {!hideCP && (
              <VictoryArea
                data={area}
                style={{
                  data: {
                    opacity: 0.3,
                  },
                }}
                interpolation="stepAfter"
              />
            )}
            {/* CP Line */}
            {!hideCP && (
              <VictoryLine
                data={line}
                style={{
                  data: {
                    strokeWidth: 2,
                    stroke: getThemeColor(METAC_COLORS.blue["600"]),
                  },
                }}
                interpolation="stepAfter"
              />
            )}

            {/* Prediciton points */}
            <VictoryScatter
              data={points}
              dataComponent={<PredictionWithRange />}
            />

            {!!resolutionPoint && (
              <VictoryScatter
                data={[resolutionPoint]}
                style={{
                  data: {
                    stroke: getThemeColor(METAC_COLORS.purple["800"]),
                    fill: "none",
                    strokeWidth: 2.5,
                  },
                }}
              />
            )}
          </VictoryChart>
        )}
      </ChartContainer>
    </div>
  );
};

const PredictionWithRange: React.FC<any> = ({
  x,
  y,
  symbol,
  datum: { y1, y2 },
  scale,
}) => {
  const { getThemeColor } = useAppTheme();
  const y1Scaled = scale.y(y1);
  const y2Scaled = scale.y(y2);
  return (
    <>
      {y1 !== undefined && y2 !== undefined && (
        <line
          x1={x}
          x2={x}
          y1={y1Scaled}
          y2={y2Scaled}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}
      {symbol === "circle" && (
        <circle
          cx={x}
          cy={y}
          r={3}
          fill={getThemeColor(METAC_COLORS.gray["0"])}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}

      {symbol === "x" && (
        <polygon
          points={`${x - 3},${y - 3} ${x + 3},${y + 3} ${x},${y} ${x - 3},${y + 3} ${x + 3},${y - 3} ${x},${y}`}
          r={3}
          fill={getThemeColor(METAC_COLORS.gray["0"])}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}
    </>
  );
};

export default NewNumericChart;
