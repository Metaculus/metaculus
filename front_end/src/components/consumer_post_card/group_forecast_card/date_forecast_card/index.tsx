"use client";

import "./styles.scss";

import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { FC } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryScatter,
} from "victory";

import NumericForecastCard from "@/components/consumer_post_card/group_forecast_card/numeric_forecast_card";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { useHideCP } from "@/contexts/cp_context";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { ChoiceItem } from "@/types/choices";
import { PostGroupOfQuestions, PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { calculateTextWidth } from "@/utils/charts/helpers";
import { getResolutionPoint } from "@/utils/charts/resolution";
import cn from "@/utils/core/cn";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/questions/choices";
import { getContinuousGroupScaling } from "@/utils/questions/helpers";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

import DateForecastCardTooltip from "./date_card_tooltip";
import PredictionSymbol from "./prediction_symbol";
import ScatterLabel from "./scatter_label";

type Props = {
  post: PostWithForecasts;
  questionsGroup: PostGroupOfQuestions<QuestionWithNumericForecasts>;
  height?: number;
  fillHeight?: boolean;
  innerChartPaddingX?: number;
  yearOnlyTicks?: boolean;
};

const TICK_LABEL_INDEXES = [0, 4, 8];
const SMALL_CHART_WIDTH = 400;
const TICKS_ARRAY = Array.from({ length: 9 }, (_, i) => 0.04 + (i * 0.92) / 8);

const DateForecastCard: FC<Props> = ({
  post,
  questionsGroup,
  height = 100,
  fillHeight = false,
  innerChartPaddingX = 0,
  yearOnlyTicks = false,
}) => {
  const { questions } = questionsGroup;
  const locale = useLocale();
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const {
    ref: chartContainerRef,
    width: chartWidth,
    height: containerHeight,
  } = useContainerSize<HTMLDivElement>();
  const chartHeight =
    fillHeight && containerHeight > 0 ? containerHeight : height;
  const choices = generateChoiceItemsFromGroupQuestions(questionsGroup, {
    locale,
  });
  const scaling = getContinuousGroupScaling(questions);
  const shouldDisplayChart = !!chartWidth;
  const isBigChartView = chartWidth > SMALL_CHART_WIDTH;
  const { adjustedScaling, points, todayLine } = generateChartData(
    choices,
    scaling
  );
  if (points.length === 0 || hideCP) {
    // Render empty state taken from the Numeric representation
    return <NumericForecastCard post={post} />;
  }

  return (
    <>
      <div
        ref={chartContainerRef}
        className={cn(
          "DateForecastCard relative w-full",
          fillHeight && "flex-1"
        )}
      >
        {shouldDisplayChart && (
          <VictoryChart
            width={chartWidth}
            height={chartHeight}
            theme={chartTheme}
            padding={{
              left: innerChartPaddingX,
              top: isBigChartView ? 5 : 20,
              right: innerChartPaddingX,
              bottom: isBigChartView ? 20 : 5,
            }}
            domain={{ x: [0, 1], y: [0, 1] }}
            domainPadding={{
              x: [10, innerChartPaddingX > 0 ? 10 : 0],
              y: 20,
            }}
            containerComponent={
              <VictoryContainer
                style={{
                  userSelect: "auto",
                  pointerEvents: "auto",
                  touchAction: "auto",
                }}
              />
            }
          >
            <VictoryAxis
              tickFormat={(tick, index) => {
                if (!isBigChartView) {
                  return "";
                }
                if (!isNil(todayLine)) {
                  return tick < todayLine - 0.1 || tick > todayLine + 0.1
                    ? formatTickLabel(
                        tick,
                        adjustedScaling,
                        index,
                        yearOnlyTicks ? "yyyy" : "dd MMM yyyy"
                      )
                    : "";
                }
                return formatTickLabel(
                  tick,
                  adjustedScaling,
                  index,
                  yearOnlyTicks ? "yyyy" : "dd MMM yyyy"
                );
              }}
              tickValues={TICKS_ARRAY}
              style={{
                ticks: {
                  stroke: "transparent",
                },
                grid: {
                  stroke: getThemeColor(METAC_COLORS.gray["400"]),
                  strokeDasharray: "3,2",
                },
                axis: {
                  stroke: getThemeColor(METAC_COLORS.gray["300"]),
                },
                tickLabels: {
                  fill: () => getThemeColor(METAC_COLORS.gray["500"]),
                  fontSize: 14,
                },
              }}
            />
            <VictoryScatter
              data={points}
              size={8}
              dataComponent={<PredictionSymbol />}
              style={{
                data: {
                  stroke: ({ datum }) => getThemeColor(datum.color),
                },
                labels: {
                  maxWidth: 100,
                  fontSize: 14,
                  fill: () =>
                    !isBigChartView
                      ? "transparent"
                      : getThemeColor(METAC_COLORS.blue["800"]),
                },
              }}
              labelComponent={<ScatterLabel chartWidth={chartWidth} />}
            />
            {/* Tick labels on top of the chart — rendered after scatter so they paint above points */}
            {!isBigChartView && (
              <VictoryAxis
                tickFormat={(tick, index) =>
                  formatTickLabel(
                    tick,
                    adjustedScaling,
                    index,
                    yearOnlyTicks ? "yyyy" : "dd MMM yyyy"
                  )
                }
                tickValues={TICKS_ARRAY}
                orientation="top"
                style={{
                  ticks: { stroke: "transparent" },
                  grid: { stroke: "transparent" },
                  axis: { stroke: "transparent" },
                  tickLabels: {
                    fill: () => getThemeColor(METAC_COLORS.gray["500"]),
                    fontSize: 14,
                  },
                }}
                offsetY={5}
              />
            )}
            {/* Today line */}
            {todayLine && (
              <VictoryAxis
                tickFormat={() => t("today")}
                tickValues={[todayLine]}
                orientation="bottom"
                style={{
                  ticks: { stroke: "transparent" },
                  grid: {
                    stroke: getThemeColor(METAC_COLORS.purple["700"]),
                  },
                  axis: { stroke: "transparent" },
                  tickLabels: {
                    fill: () => getThemeColor(METAC_COLORS.purple["700"]),
                    fontSize: 14,
                  },
                }}
              />
            )}
          </VictoryChart>
        )}
      </div>
      {chartWidth && !isBigChartView && (
        <div className="mt-4">
          <DateForecastCardTooltip points={points} />
        </div>
      )}
    </>
  );
};

function generateChartData(choices: ChoiceItem[], originalScaling: Scaling) {
  const choicesCP = choices
    .map((choice) => {
      const latest =
        choice.aggregationValues[choice.aggregationValues.length - 1];
      if (
        !latest ||
        !choice.scaling ||
        isUnsuccessfullyResolved(choice.resolution)
      ) {
        return null;
      }
      let resolutionTimestampPoint = null;
      if (choice.resolution) {
        switch (choice.resolution) {
          case "below_lower_bound":
            resolutionTimestampPoint = 0;
            break;
          case "above_upper_bound":
            resolutionTimestampPoint = 1;
            break;
          default:
            resolutionTimestampPoint =
              getResolutionPoint({
                questionType: QuestionType.Date,
                resolution: choice.resolution,
                resolveTime: Date.now(),
                scaling: choice.scaling,
              })?.y ?? null;
            break;
        }
      }
      return {
        id: choice.id,
        cp: scaleInternalLocation(latest, choice.scaling),
        resolution: !isNil(resolutionTimestampPoint)
          ? scaleInternalLocation(resolutionTimestampPoint, choice.scaling)
          : null,
      };
    })
    .filter((choice) => !isNil(choice)) as {
    id: number;
    cp: number;
    resolution: number | null;
  }[];
  if (!choicesCP.length) {
    return {
      adjustedScaling: originalScaling,
      points: [],
    };
  }

  const resolutionsArray = choicesCP
    .filter((choice) => !isNil(choice.resolution))
    .map((choice) => choice.resolution) as number[];
  const minCP = Math.min(
    ...choicesCP.map((choice) => choice.cp),
    ...resolutionsArray
  );
  const maxCP = Math.max(
    ...choicesCP.map((choice) => choice.cp),
    ...resolutionsArray
  );

  // add buffer to the domain bounds
  const rangePadding = (maxCP - minCP) * 0.1;
  const scaling = {
    range_max: maxCP + rangePadding,
    range_min: minCP - rangePadding,
    zero_point: null,
  };
  const points = choicesCP.map((choice) => {
    return {
      id: choice.id,
      x: isNil(choice.resolution)
        ? unscaleNominalLocation(choice.cp, scaling)
        : unscaleNominalLocation(choice.resolution, scaling),
      symbol: isNil(choice.resolution) ? "circle" : "diamond",
    };
  });

  const nowTimestamp = Date.now() / 1000;

  let todayPoint = null;
  if (nowTimestamp <= scaling.range_max && nowTimestamp >= scaling.range_min) {
    todayPoint = unscaleNominalLocation(nowTimestamp, scaling);
  }

  return {
    adjustedScaling: scaling,
    todayLine: todayPoint,
    points: points.map((point) => {
      // this should always return an object
      const pointData = choices.find((choice) => choice.id === point.id);
      return {
        x: point.x,
        y: 0.35,
        label: pointData?.choice ?? "",
        color: pointData?.color ?? (METAC_COLORS.gray["400"] as ThemeColor),
        labelWidth: Math.min(
          calculateTextWidth(12, pointData?.choice ?? ""),
          100
        ),
        resolution: pointData?.resolution,
        symbol: point.symbol,
      };
    }),
  };
}

function formatTickLabel(
  tick: number,
  scaling: Scaling,
  index: number,
  dateFormatString: string
) {
  if (!TICK_LABEL_INDEXES.includes(index)) {
    return "";
  }
  return getPredictionDisplayValue(tick, {
    questionType: QuestionType.Date,
    scaling,
    precision: 3,
    actual_resolve_time: null,
    dateFormatString,
    skipQuartilesBorders: true,
  });
}
export default DateForecastCard;
