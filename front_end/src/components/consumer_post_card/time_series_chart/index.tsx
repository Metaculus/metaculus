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
import { QuestionStatus, Resolution } from "@/types/post";
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
  getContinuousGroupScaling,
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
  const adjustedChartData = adjustChartData(chartData, chartWidth);
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

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div ref={chartContainerRef} className="TimeSeriesChart relative w-full">
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
                      ? getThemeColor(
                          ["no", "yes"].includes(datum.resolution as string)
                            ? METAC_COLORS.purple["400"]
                            : METAC_COLORS.purple["500"]
                        )
                      : datum.isClosed
                        ? getThemeColor(METAC_COLORS.gray["500"])
                        : getThemeColor(METAC_COLORS.blue["400"]),
                  display: "block",
                  strokeLinejoin: "round",
                  strokeWidth: ({ datum }) =>
                    ["no", "yes"].includes(datum.resolution as string) ? 0 : 5,
                  width: ({ datum }) =>
                    ["no", "yes"].includes(datum.resolution as string) ? 2 : 16,
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
  isClosed: boolean;
  resolution: Resolution | null;
}[] {
  const scaling = getContinuousGroupScaling(questions);
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
  datum: Array<{
    x: string;
    label: string;
    isClosed: boolean;
    resolution: Resolution | null;
  }>,
  chartWidth: number,
  isBarLabel?: boolean
) {
  const labelMargin = 5;
  const charWidth = calculateCharWidth(isBarLabel ? 14 : 12);

  const labels = [
    ...datum.map((item) => {
      let adjustedLabel = isBarLabel ? item.label : item.x;
      if (isBarLabel) {
        if (item.isClosed) {
          adjustedLabel = "closed";
        } else if (item.resolution) {
          adjustedLabel = "resolved";
        }
      }

      return getTruncatedLabel(adjustedLabel, 25);
    }),
  ];

  if (!charWidth) {
    return labels.map(() => true);
  }
  const chartDomainPadding = chartWidth > 400 ? 60 : 30;
  const availableWidth = chartWidth - chartDomainPadding;

  const getLabelX = (index: number) =>
    (index * availableWidth) / (labels.length - 1) + chartDomainPadding / 2;

  const getLabelWidth = (label: string) =>
    label.length * charWidth + labelMargin;

  return labels.reduce((visibleLabels, label, index) => {
    if (index === 0) {
      visibleLabels[index] = true;
      return visibleLabels;
    }

    const currentLabelX = getLabelX(index);
    const currentLabelWidth = getLabelWidth(label);

    let lastVisibleIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (visibleLabels[i]) {
        lastVisibleIndex = i;
        break;
      }
    }

    if (lastVisibleIndex === -1) {
      visibleLabels[index] = true;
      return visibleLabels;
    }

    const prevLabelX = getLabelX(lastVisibleIndex);
    const prevLabelWidth = getLabelWidth(labels[lastVisibleIndex] as string);

    const overlap =
      currentLabelX - currentLabelWidth / 2 <= prevLabelX + prevLabelWidth / 2;

    visibleLabels[index] = !overlap;
    return visibleLabels;
  }, Array(labels.length).fill(false));
}

function adjustChartData(
  chartData: {
    x: string;
    y: number;
    label: string;
    isClosed: boolean;
    resolution: Resolution | null;
  }[],
  chartWidth: number
) {
  let questionsToDisplay = 8;
  if (chartWidth < 374) {
    questionsToDisplay = 4;
  } else if (chartWidth < 448) {
    questionsToDisplay = 5;
  } else if (chartWidth < 576) {
    questionsToDisplay = 6;
  } else if (chartWidth < 660) {
    questionsToDisplay = 7;
  } else {
    questionsToDisplay = 8;
  }
  return chartData.slice(-questionsToDisplay);
}

export default TimeSeriesChart;
