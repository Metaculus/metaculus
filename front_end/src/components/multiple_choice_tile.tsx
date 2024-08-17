"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { VictoryThemeDefinition } from "victory";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import MultiForecastTimeline from "@/components/charts/multi_forecast_timeline";
import ChoiceIcon from "@/components/choice_icon";
import ResolutionIcon from "@/components/icons/resolution";
import PredictionChip from "@/components/prediction_chip";
import { ForecastTimelineData, TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, UserChoiceItem } from "@/types/choices";
import { PostStatus, Resolution } from "@/types/post";
import { Aggregations, Question, UserForecastHistory } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

type MCTProps = {
  question: Question;
  aggregations: Aggregations;
  myForecasts: UserForecastHistory;
  visibleChoicesCount: number;
  defaultChartZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
};

export const MultipleChoiceTile: FC<MCTProps> = ({
  question,
  aggregations,
  myForecasts,
  visibleChoicesCount,
  defaultChartZoom,
  withZoomPicker,
  chartHeight,
  chartTheme,
}) => {
  const t = useTranslations();

  const optionOrdering = question.options!.map((_, i) => i); // real ordering

  const forecastTimelines: ForecastTimelineData[][] = question.options!.map(
    () => []
  );
  aggregations.recency_weighted.history.forEach((forecast) => {
    question.options!.map((_, i) => {
      forecastTimelines[i].push({
        color: MULTIPLE_CHOICE_COLOR_SCALE[optionOrdering[i]],

        highlighted: forecast.highlighted,
        active: forecast.active,
        timestamps: forecast.timestamps,
        centers: forecast.centers,
        uppers: forecast.uppers,
        lowers: forecast.lowers,
        resolutionPoint: forecast.resolutionPoint,
      });
    });
  });

  return <div />;
};

type Props = {
  timestamps: number[]; // deprecate
  choices: ChoiceItem[]; // depprecate
  visibleChoicesCount: number;
  defaultChartZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  userForecasts?: UserChoiceItem[];
  question?: Question;
};

const GroupTile: FC<Props> = ({
  timestamps, // deprecate
  choices, // deprecate
  visibleChoicesCount,
  defaultChartZoom,
  withZoomPicker,
  chartHeight = 100,
  chartTheme,
  userForecasts,
  question,
}) => {
  const t = useTranslations();

  const visibleChoices = choices.slice(0, visibleChoicesCount);
  const otherItemsCount = choices.length - visibleChoices.length;

  // when resolution chip is shown we want to hide the chart and display the chip
  // (e.g. multiple-choice question on questions feed)
  // otherwise, resolution status will be populated near the every choice
  // (e.g. multiple-choice question in the embedding view, or questions group)
  const isResolvedView =
    !isNil(question?.resolution) &&
    choices.every((choice) => isNil(choice.resolution));

  const renderSideInfo = () => {
    if (isResolvedView) {
      return (
        <PredictionChip question={question} status={PostStatus.RESOLVED} />
      );
    }

    return (
      <div className="embed-gap flex flex-col gap-2">
        {visibleChoices.map(
          ({ choice, color, values, resolution, displayedResolution }) => (
            <ChoiceOption
              key={`choice-option-${choice}`}
              choice={choice}
              color={color}
              values={values}
              resolution={resolution}
              displayedResolution={displayedResolution}
            />
          )
        )}
        {otherItemsCount > 0 && (
          <div className="flex flex-row text-gray-600 dark:text-gray-600-dark">
            <div className="self-center py-0 pr-1.5 text-center">
              <FontAwesomeIcon
                icon={faEllipsis}
                size="xl"
                className="resize-ellipsis"
              />
            </div>
            <div className="resize-label whitespace-nowrap px-1.5 py-0.5 text-left text-sm font-medium leading-4">
              {t("otherWithCount", { count: otherItemsCount })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="GroupTile ml-0 mr-2 flex w-full grid-cols-[200px_auto] flex-col items-start gap-3 p-1 pl-0 xs:grid">
      <div className="resize-container">{renderSideInfo()}</div>
      {!isResolvedView && (
        <MultipleChoiceChart
          timestamps={timestamps}
          choiceItems={choices}
          height={chartHeight}
          extraTheme={chartTheme}
          defaultZoom={defaultChartZoom}
          withZoomPicker={withZoomPicker}
          userForecasts={userForecasts}
        />
      )}
    </div>
  );
};

const ChoiceOption: FC<{
  choice: string;
  color: ThemeColor;
  values: number[];
  displayedResolution?: Resolution | null;
  resolution?: Resolution | null;
}> = ({ choice, color, values, displayedResolution, resolution }) => {
  return (
    <div
      key={`choice-option-${choice}`}
      className="flex h-auto flex-row items-center self-start sm:self-stretch"
    >
      <div className="py-0.5 pr-1.5">
        <ChoiceIcon color={color} className="resize-icon" />
      </div>
      <div className="resize-label line-clamp-2 w-full px-1.5 py-0.5 text-left text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
        {choice}
      </div>
      {isNil(resolution) ? (
        <div className="resize-label py-0.5 pr-1.5 text-right text-sm font-bold leading-4 text-gray-900 dark:text-gray-900-dark">
          {getForecastPctDisplayValue(values[values.length - 1])}
        </div>
      ) : (
        <div className="resize-label flex items-center whitespace-nowrap px-1.5 py-0.5 text-right text-sm font-bold leading-4 text-purple-800 dark:text-purple-800-dark">
          <ResolutionIcon />
          {displayedResolution ?? resolution}
        </div>
      )}
    </div>
  );
};

export default GroupTile;
