import { isNil } from "lodash";
import { FC } from "react";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup } from "victory";

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
} from "@/utils/charts";
import { formatResolution, isUnsuccessfullyResolved } from "@/utils/questions";

import TimeSeriesLabel from "./primitives/time_series_label";

type Props = {
  questions: QuestionWithNumericForecasts[];
  height?: number;
};

const TimeSeriesChart: FC<Props> = ({ questions, height = 130 }) => {
  const { theme, getThemeColor } = useAppTheme();
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const chartData = buildChartData(questions);
  const shouldDisplayChart = !!chartWidth;

  return (
    <div ref={chartContainerRef} className="relative w-full" style={{ height }}>
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={chartTheme}
          padding={{
            left: 15,
            top: 20,
            right: 15,
            bottom: 25,
          }}
          domainPadding={{
            x: chartWidth > 400 ? 60 : chartData.length > 5 ? 10 : 20,
            y: 20,
          }}
        >
          {" "}
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
            gridComponent={<line />}
            tickCount={5}
          />
          <VictoryGroup data={chartData}>
            <VictoryBar
              style={{
                data: { fill: "none" },
              }}
              labels={({ datum }) => `${datum.x}`}
              labelComponent={
                <TimeSeriesLabel
                  isTickLabel={true}
                  getThemeColor={getThemeColor}
                />
              }
            />
            <VictoryBar
              labels={({ datum }) => `${datum.y}`}
              labelComponent={
                <TimeSeriesLabel
                  isTickLabel={false}
                  getThemeColor={getThemeColor}
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

function buildChartData(questions: QuestionWithNumericForecasts[]): {
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
            locale: "en",
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

export default TimeSeriesChart;
