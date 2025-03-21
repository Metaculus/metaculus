import "./styles.scss";

import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryScatter,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { ChoiceItem } from "@/types/choices";
import {
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import {
  generateChoiceItemsFromGroupQuestions,
  getContinuousGroupScaling,
  getDisplayValue,
  scaleInternalLocation,
  unscaleNominalLocation,
} from "@/utils/charts";

import DateForecastCardTooltip from "./date_card_tooltip";
import PredictionSymbol from "./prediction_symbol";
import ScatterLabel from "./scatter_label";

type Props = {
  questions: QuestionWithNumericForecasts[];
  postId: number;
  height?: number;
};

const TICK_LABEL_INDEXES = [0, 4, 8];
const SMALL_CHART_WIDTH = 400;

const DateForecastCard: FC<Props> = ({ questions, height = 100, postId }) => {
  const locale = useLocale();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const choices = generateChoiceItemsFromGroupQuestions(questions, {
    locale,
  });
  const scaling = getContinuousGroupScaling(questions);
  const shouldDisplayChart = !!chartWidth;

  const { adjustedScaling, points } = generateChartData(
    choices,
    postId,
    scaling
  );

  const ticksArray = Array.from({ length: 9 }, (_, i) => 0.04 + (i * 0.92) / 8);
  return (
    <>
      <div ref={chartContainerRef} className="DateForecastCard relative w-full">
        {shouldDisplayChart && (
          <VictoryChart
            width={chartWidth}
            height={chartWidth > 400 ? height : 80}
            theme={chartTheme}
            padding={{
              left: 0,
              top: 0,
              right: 0,
              bottom: 25,
            }}
            domain={{ x: [0, 1], y: [0, 1] }}
            domainPadding={{
              x: [10, 0],
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
              tickFormat={(tick, index) =>
                formatTickLabel(tick, adjustedScaling, index)
              }
              // tickLabelComponent={<TickLabel />}
              tickValues={ticksArray}
              style={{
                ticks: {
                  stroke: "transparent",
                },
                grid: {
                  stroke: getThemeColor(METAC_COLORS.gray["300"]),
                  strokeDasharray: "4,4",
                },
                axis: {
                  stroke: getThemeColor(METAC_COLORS.gray["300"]),
                },
                tickLabels: {
                  fill: () => getThemeColor(METAC_COLORS.gray["500"]),
                  fontSize: 11,
                },
              }}
            />
            <VictoryScatter
              data={points}
              size={8}
              dataComponent={<PredictionSymbol chartWidth={chartWidth} />}
              style={{
                data: {
                  stroke: ({ datum }) => getThemeColor(datum.color),
                },
                labels: {
                  maxWidth: 100,
                  fontSize: 14,
                  fill: () =>
                    chartWidth < SMALL_CHART_WIDTH
                      ? "transparent"
                      : getThemeColor(METAC_COLORS.blue["800"]),
                },
              }}
              labelComponent={<ScatterLabel chartWidth={chartWidth} />}
            />
          </VictoryChart>
        )}
      </div>
      {chartWidth && chartWidth < SMALL_CHART_WIDTH && (
        <DateForecastCardTooltip points={points} />
      )}
    </>
  );
};

function generateChartData(
  choices: ChoiceItem[],
  postId: number,
  originalScaling: Scaling
) {
  const choicesCP = choices
    .filter((choice) => isNil(choice.resolution))
    .map((choice) => {
      const latest =
        choice.aggregationValues[choice.aggregationValues.length - 1];
      if (!latest || !choice.scaling) {
        return null;
      }
      return {
        id: choice.id,
        cp: scaleInternalLocation(latest, choice.scaling),
      };
    })
    .filter((cp) => !isNil(cp)) as { id: number; cp: number }[];
  if (!choicesCP.length) {
    return {
      adjustedScaling: originalScaling,
      points: [],
    };
  }
  const minCP = Math.min(...choicesCP.map((choice) => choice.cp));
  const maxCP = Math.max(...choicesCP.map((choice) => choice.cp));

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
      x: unscaleNominalLocation(choice.cp, scaling),
    };
  });

  return {
    adjustedScaling: scaling,
    points: points.map((point) => {
      // this should always return an object
      const pointData = choices.find((choice) => choice.id === point.id);
      return {
        x: point.x,
        y: 0.4,
        label: pointData?.choice ?? "",
        color: pointData?.color ?? (METAC_COLORS.gray["400"] as ThemeColor),
      };
    }),
  };
}

function formatTickLabel(tick: number, scaling: Scaling, index: number) {
  if (!TICK_LABEL_INDEXES.includes(index)) {
    return "";
  }
  return getDisplayValue({
    value: tick,
    questionType: QuestionType.Date,
    scaling,
    precision: 3,
  });
}
export default DateForecastCard;
