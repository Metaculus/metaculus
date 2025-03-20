import "./styles.scss";

import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";
import {
  LineSegment,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryGroup,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { QuestionStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import {
  getDisplayValue,
  scaleInternalLocation,
  unscaleNominalLocation,
  getResolutionPosition,
  calculateCharWidth,
  getTruncatedLabel,
} from "@/utils/charts";
import { formatResolution, isUnsuccessfullyResolved } from "@/utils/questions";

import TimeSeriesLabel from "./time_series_label";

type Props = {
  questions: QuestionWithNumericForecasts[];
  height?: number;
};

const TimeSeriesChart: FC<Props> = ({ questions, height = 130 }) => {
  const { theme, getThemeColor } = useAppTheme();
  const locale = useLocale();
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const chartData = buildChartData(questions, locale);
  const adjustedChartData =
    chartWidth < 350 ? chartData.slice(0, 12) : chartData;
  const shouldDisplayChart = !!chartWidth;
  const tickLabelVisibilityMap = adjustLabelsForDisplay(
    adjustedChartData,
    chartWidth
  );
  const barLabelVisibilityMap = adjustLabelsForDisplay(
    adjustedChartData,
    chartWidth,
    true
  );

  return (
    <div ref={chartContainerRef} className="relative w-full">
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={chartTheme}
          padding={{
            left: 0,
            top: 20,
            right: 0,
            bottom: 25,
          }}
          domainPadding={{
            x: chartWidth > 400 ? 80 : chartData.length > 3 ? 40 : 50,
            y: 20,
          }}
          containerComponent={
            <VictoryContainer
              style={{
                userSelect: "auto",
                pointerEvents: "auto",
                touchAction: "auto",
                overflow: "visible",
              }}
            />
          }
        >
          <VictoryAxis
            style={{
              axis: {
                stroke: getThemeColor(METAC_COLORS.blue["300"]),
                strokeDasharray: "4, 4",
              },
              ticks: {
                stroke: "transparent",
              },
              tickLabels: {
                fill: "none",
              },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: "none" },
              ticks: { stroke: "transparent" },
              tickLabels: { fill: "none" },
              grid: {
                stroke: getThemeColor(METAC_COLORS.blue["300"]),
                strokeDasharray: "4, 4",
              },
            }}
            gridComponent={<LineSegment />}
            tickCount={5}
          />
          <VictoryGroup data={adjustedChartData}>
            <VictoryBar
              style={{
                data: { fill: "none" },
              }}
              labelComponent={
                <TimeSeriesLabel
                  isTickLabel={true}
                  labelVisibilityMap={tickLabelVisibilityMap}
                />
              }
            />
            <VictoryBar
              labelComponent={
                <TimeSeriesLabel
                  isTickLabel={false}
                  labelVisibilityMap={barLabelVisibilityMap}
                />
              }
              style={{
                border: {
                  stroke: getThemeColor(METAC_COLORS.blue["400"]),
                  strokeWidth: 2,
                  borderRadius: 2,
                },
                data: {
                  fill: ({ datum }) =>
                    datum.resolution
                      ? getThemeColor(METAC_COLORS.purple["500"])
                      : datum.isClosed
                        ? getThemeColor(METAC_COLORS.gray["500"])
                        : getThemeColor(METAC_COLORS.blue["400"]),
                  display: ({ datum }) =>
                    ["no", "yes"].includes(datum.resolution as string)
                      ? "none"
                      : "block",
                  strokeLinejoin: "round",
                  strokeWidth: 5,
                  width: 16,
                },
              }}
            />
          </VictoryGroup>
        </VictoryChart>
      )}
    </div>
  );
};

function buildChartData(
  questions: QuestionWithNumericForecasts[],
  locale: string
): {
  x: string;
  y: number;
  label: string;
}[] {
  const rangeMaxValues: number[] = [];
  const rangeMinValues: number[] = [];
  const zeroPoints: number[] = [];
  for (const question of questions) {
    if (!isNil(question.scaling.range_max)) {
      rangeMaxValues.push(question.scaling.range_max);
    }
    if (!isNil(question.scaling.range_min)) {
      rangeMinValues.push(question.scaling.range_min);
    }
    if (question.scaling.zero_point !== null) {
      zeroPoints.push(question.scaling.zero_point);
    }
  }
  const scaling: Scaling = {
    range_max: rangeMaxValues.length > 0 ? Math.max(...rangeMaxValues) : null,
    range_min: rangeMinValues.length > 0 ? Math.min(...rangeMinValues) : null,
    zero_point: zeroPoints.length > 0 ? Math.min(...zeroPoints) : null,
  };
  // ignore the log scaling if we have mixes of log and linear scaled options
  if (
    scaling.zero_point !== null &&
    !isNil(scaling.range_min) &&
    !isNil(scaling.range_max) &&
    scaling.range_min <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max
  ) {
    scaling.zero_point = null;
  }

  return [...questions]
    .filter(
      (question) =>
        !isUnsuccessfullyResolved(question.resolution) &&
        !isNil(question.aggregations.recency_weighted.latest?.centers?.[0])
    )
    .map((question) => {
      const resolutionPoint = question.resolution
        ? getResolutionPosition({
            question,
            scaling,
            adjustBinaryPoint: true,
          })
        : null;
      const formatedResolution = question.resolution
        ? formatResolution({
            resolution: question.resolution,
            questionType: question.type,
            locale: locale,
            scaling: question.scaling,
            shortBounds: true,
          })
        : null;

      const point = getOptionPoint(
        {
          value:
            question.aggregations.recency_weighted.latest?.centers?.[0] ?? 0,
          optionScaling: question.scaling,
          questionScaling: scaling,
        },
        question.type === QuestionType.Binary
      );

      return {
        x: question.label,
        y: !isNil(resolutionPoint) ? resolutionPoint : point,
        label: !isNil(formatedResolution)
          ? formatedResolution
          : getDisplayValue({
              value:
                question.aggregations.recency_weighted.latest?.centers?.[0] ??
                0,
              questionType: question.type,
              scaling: question.scaling,
            }),
        isClosed: question.status === QuestionStatus.CLOSED,
        resolution: question.resolution,
      };
    });
}

function getOptionPoint(
  {
    value,
    optionScaling,
    questionScaling,
  }: {
    value: number;
    optionScaling: Scaling;
    questionScaling: Scaling;
  },
  withoutScaling = true
) {
  if (withoutScaling) {
    return value;
  }
  return unscaleNominalLocation(
    scaleInternalLocation(value, optionScaling),
    questionScaling
  );
}

function adjustLabelsForDisplay(
  datum: Array<{ x: string; label: string }>,
  chartWidth: number,
  isBarLabel?: boolean
) {
  const labelMargin = isBarLabel ? 0 : 5;
  const charWidth = calculateCharWidth(isBarLabel ? 8 : 9);

  const labels = [
    ...datum.map((item) =>
      getTruncatedLabel(isBarLabel ? item.label : item.x, 20)
    ),
    ...(isBarLabel ? ["Resolved", "Closed"] : []),
  ];

  if (!charWidth) {
    return labels.map(() => true);
  }

  const maxLabelLength = Math.max(...labels.map((label) => label.length));
  const maxLabelWidth = maxLabelLength * charWidth + labelMargin;
  const chartDomainPadding = chartWidth > 400 ? 60 : 30;
  let availableSpacePerLabel =
    (chartWidth - chartDomainPadding) / labels.length;

  if (maxLabelWidth < availableSpacePerLabel) {
    return labels.map(() => true);
  }

  let step = 1;
  let visibleLabelsCount = labels.length;

  while (maxLabelWidth >= availableSpacePerLabel && step < labels.length) {
    visibleLabelsCount = Math.ceil(labels.length / step);
    availableSpacePerLabel = chartWidth / visibleLabelsCount;
    step++;
  }

  return datum.map(
    (_, index) =>
      index % step === 0 || (datum.length === 3 && index === datum.length - 1)
  );
}

export default TimeSeriesChart;
