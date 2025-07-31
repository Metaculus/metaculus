import "./styles.scss";

import { isNil, round } from "lodash";
import { useLocale } from "next-intl";
import { FC, useMemo } from "react";
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
import { ThemeColor } from "@/types/theme";
import { calculateCharWidth } from "@/utils/charts/helpers";
import { getResolutionPosition } from "@/utils/charts/resolution";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";
import { truncateLabel } from "@/utils/formatters/string";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import { getContinuousGroupScaling } from "@/utils/questions/helpers";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

import UpcomingCP from "../upcoming_cp";
import TimeSeriesLabel from "./time_series_label";

type Props = {
  questions: QuestionWithNumericForecasts[];
  height?: number;
  variant?: "default" | "colorful";
};

const MULTIPLE_CHOICE_LIGHT_COLOR_SCALE = Object.values(
  METAC_COLORS["mc-option-light"]
) as ThemeColor[];
const MULTIPLE_CHOICE_COLOR_SCALE = Object.values(
  METAC_COLORS["mc-option"]
) as ThemeColor[];

function getNormalizedTicks(maxValue: number): number[] {
  return [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue];
}

const TimeSeriesChart: FC<Props> = ({
  questions,
  height = 130,
  variant = "default",
}) => {
  const { theme, getThemeColor } = useAppTheme();
  const locale = useLocale();
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const chartData = buildChartData(questions, locale);
  const { adjustedChartData, yDomain } = adjustChartData(chartData, chartWidth);
  const shouldDisplayChart = !!chartWidth;
  const { labelVisibilityMap: tickLabelVisibilityMap, widthPerLabel } =
    adjustLabelsForDisplay(adjustedChartData, chartWidth);

  const { labelVisibilityMap: barLabelVisibilityMap } = adjustLabelsForDisplay(
    adjustedChartData,
    chartWidth,
    true
  );

  const allQuestionsEmpty = adjustedChartData.every((datum) => datum.isEmpty);

  // Forecast availabilities map
  const questionAvailabilities = useMemo(
    () =>
      questions.map((question) => getQuestionForecastAvailability(question)),
    [questions]
  );

  // Show upcoming label if any empty questions have cpRevealsOn
  const shouldShowCPLabel = useMemo(() => {
    return questionAvailabilities.some(
      (availability) => availability.isEmpty && availability.cpRevealsOn
    );
  }, [questionAvailabilities]);

  // Get the earliest CP reveal time from empty questions
  const earliestCPRevealTime = useMemo(() => {
    if (!shouldShowCPLabel) return null;

    const cpRevealTimes = questionAvailabilities
      .filter(
        (availability) =>
          availability.isEmpty && !isNil(availability.cpRevealsOn)
      )
      .map((availability) => availability.cpRevealsOn as string);

    if (cpRevealTimes.length === 0) return null;

    return cpRevealTimes.reduce((earliest, current) => {
      return new Date(current) < new Date(earliest) ? current : earliest;
    });
  }, [shouldShowCPLabel, questionAvailabilities]);

  const maxValue = Math.max(...adjustedChartData.map((d) => d.y), 1);
  const tickValues = getNormalizedTicks(maxValue);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div ref={chartContainerRef} className="TimeSeriesChart relative w-full">
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={allQuestionsEmpty ? 46 : height}
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
          domain={yDomain ? { y: yDomain } : undefined}
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
                stroke: allQuestionsEmpty
                  ? "transparent"
                  : getThemeColor(METAC_COLORS.blue["300"]),
                strokeDasharray: allQuestionsEmpty ? "none" : "4, 4",
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
                stroke: allQuestionsEmpty
                  ? "transparent"
                  : getThemeColor(METAC_COLORS.blue["300"]),
                strokeDasharray: allQuestionsEmpty ? "none" : "4, 4",
              },
            }}
            gridComponent={<LineSegment />}
            tickValues={variant === "colorful" ? tickValues : undefined}
            tickCount={variant === "default" ? 5 : undefined}
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
                  widthPerLabel={widthPerLabel}
                  allQuestionsEmpty={allQuestionsEmpty}
                  colorful={variant === "colorful"}
                />
              }
            />
            <VictoryBar
              labelComponent={
                <TimeSeriesLabel
                  isTickLabel={false}
                  labelVisibilityMap={barLabelVisibilityMap}
                  allQuestionsEmpty={allQuestionsEmpty}
                  colorful={variant === "colorful"}
                />
              }
              style={{
                data: {
                  fill: ({ datum, index }) => {
                    if (variant === "colorful" && !datum.isEmpty) {
                      if (datum.resolution) {
                        return "transparent";
                      }
                      const safeIndex = typeof index === "number" ? index : 0;
                      const color: ThemeColor =
                        MULTIPLE_CHOICE_LIGHT_COLOR_SCALE[
                          safeIndex % MULTIPLE_CHOICE_LIGHT_COLOR_SCALE.length
                        ] ?? (METAC_COLORS.blue["400"] as ThemeColor);

                      return getThemeColor(color);
                    }

                    if (datum.resolution) {
                      return getThemeColor(
                        ["no", "yes"].includes(datum.resolution as string)
                          ? METAC_COLORS.purple["400"]
                          : METAC_COLORS.purple["500"]
                      );
                    }

                    return datum.isClosed
                      ? getThemeColor(METAC_COLORS.gray["500"])
                      : getThemeColor(METAC_COLORS.blue["400"]);
                  },
                  stroke:
                    variant === "colorful"
                      ? ({ datum, index }) => {
                          if (datum.resolution) {
                            return getThemeColor(METAC_COLORS.purple["600"]);
                          }
                          if (!datum.isEmpty) {
                            const safeIndex =
                              typeof index === "number" ? index : 0;
                            const color: ThemeColor =
                              MULTIPLE_CHOICE_COLOR_SCALE[
                                safeIndex % MULTIPLE_CHOICE_COLOR_SCALE.length
                              ] ?? (METAC_COLORS.blue["400"] as ThemeColor);

                            return getThemeColor(color);
                          }
                          return "transparent";
                        }
                      : undefined,
                  strokeLinejoin: "round",
                  strokeWidth: ({ datum }) => {
                    if (variant === "colorful") {
                      if (datum.resolution) {
                        return 2;
                      }
                      return datum.isEmpty ||
                        ["no", "yes"].includes(datum.resolution as string)
                        ? 0
                        : 1;
                    }
                    return datum.isEmpty
                      ? 0
                      : ["no", "yes"].includes(datum.resolution as string)
                        ? 0
                        : 5;
                  },
                  width: ({ datum }) =>
                    datum.isEmpty
                      ? 0
                      : ["no", "yes"].includes(datum.resolution as string)
                        ? 2
                        : 16,
                },
              }}
            />
          </VictoryGroup>
        </VictoryChart>
      )}
      {shouldShowCPLabel && earliestCPRevealTime && (
        <UpcomingCP
          cpRevealsOn={earliestCPRevealTime}
          className="mt-5 text-sm font-normal text-gray-500 dark:text-gray-500-dark"
        />
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
  isEmpty: boolean;
}[] {
  const scaling = getContinuousGroupScaling(questions);
  return [...questions]
    .filter((question) => !isUnsuccessfullyResolved(question.resolution))
    .map((question) => {
      const latest_centers =
        question.aggregations.recency_weighted.latest?.centers?.[0];
      const hasData = !isNil(latest_centers);
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
            completeBounds: true,
            actual_resolve_time: null,
            sigfigs: 4,
          })
        : null;

      const point = hasData
        ? getOptionPoint(
            {
              value: latest_centers ?? 0,
              optionScaling: question.scaling,
              questionScaling: scaling,
            },
            question.type === QuestionType.Binary
          )
        : 0.5; // Default position for empty state

      return {
        x: question.label,
        y: !isNil(resolutionPoint) ? resolutionPoint : point,
        label: !isNil(formatedResolution)
          ? formatedResolution
          : hasData
            ? getPredictionDisplayValue(latest_centers ?? 0, {
                questionType: question.type,
                scaling: question.scaling,
                actual_resolve_time: null,
              })
            : "?",
        isClosed: question.status === QuestionStatus.CLOSED,
        resolution: question.resolution,
        isEmpty: !hasData,
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
  return round(
    unscaleNominalLocation(
      scaleInternalLocation(value, optionScaling),
      questionScaling
    ),
    2
  );
}

function adjustLabelsForDisplay(
  datum: Array<{
    x: string;
    label: string;
    isClosed: boolean;
    resolution: Resolution | null;
    isEmpty: boolean;
  }>,
  chartWidth: number,
  isBarLabel?: boolean
) {
  const labelMargin = 5;
  const charWidth = calculateCharWidth(isBarLabel ? 14 : 14);

  const labels = [
    ...datum.map((item) => {
      let adjustedLabel = isBarLabel ? item.label : item.x;
      if (isBarLabel) {
        if (item.isEmpty) {
          adjustedLabel = "?";
        } else if (item.isClosed) {
          adjustedLabel = "closed";
        } else if (item.resolution) {
          adjustedLabel = "resolved";
        }
      }

      return truncateLabel(adjustedLabel, 25);
    }),
  ];

  if (!charWidth) {
    return { labelVisibilityMap: labels.map(() => true), widthPerLabel: 0 };
  }
  const chartDomainPadding = chartWidth > 400 ? 60 : 30;
  const availableWidth = chartWidth - chartDomainPadding;

  const getLabelX = (index: number) =>
    (index * availableWidth) / (labels.length - 1) + chartDomainPadding / 2;

  const getLabelWidth = (label: string) =>
    label.length * charWidth + labelMargin;
  const widthPerLabel = availableWidth / labels.length;
  return {
    labelVisibilityMap: labels.reduce((visibleLabels, label, index) => {
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
        currentLabelX - currentLabelWidth / 2 <=
        prevLabelX + prevLabelWidth / 2;

      visibleLabels[index] = !overlap;
      return visibleLabels;
    }, Array(labels.length).fill(false)),
    widthPerLabel,
  };
}

function adjustChartData(
  chartData: {
    x: string;
    y: number;
    label: string;
    isClosed: boolean;
    resolution: Resolution | null;
    isEmpty: boolean;
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
  const unresolvedPoints = [...chartData]
    .map((datum) => {
      if (["no", "yes"].includes(datum.resolution as string)) {
        return null;
      }
      return datum.y;
    })
    .filter((y): y is number => !isNil(y));
  const maxY = Math.max(
    unresolvedPoints.length > 0 ? Math.max(...unresolvedPoints) : 1
  );

  return {
    adjustedChartData: chartData.slice(-questionsToDisplay).map((datum) => {
      if (["no", "yes"].includes(datum.resolution as string)) {
        return { ...datum, y: maxY * 0.4 };
      }
      return datum;
    }),
    yDomain:
      unresolvedPoints.length === 0 ? ([0, 1] as [number, number]) : undefined,
  };
}

export default TimeSeriesChart;
