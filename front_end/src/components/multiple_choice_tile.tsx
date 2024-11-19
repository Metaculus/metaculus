"use client";

import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { VictoryThemeDefinition } from "victory";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import ChoiceIcon from "@/components/choice_icon";
import ResolutionIcon from "@/components/icons/resolution";
import PredictionChip from "@/components/prediction_chip";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, UserChoiceItem } from "@/types/choices";
import { PostStatus, Resolution } from "@/types/post";
import { Question, QuestionType, Scaling } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { getChoiceOptionValue } from "@/utils/charts";

import LocalDaytime from "./ui/local_daytime";

type Props = {
  timestamps: number[];
  actualCloseTime?: number | null;
  choices: ChoiceItem[];
  visibleChoicesCount: number;
  defaultChartZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  userForecasts?: UserChoiceItem[];
  question?: Question;
  questionType?: QuestionType;
  scaling?: Scaling | undefined;
  hideCP?: boolean;
  isCPRevealed?: boolean;
};

const MultipleChoiceTile: FC<Props> = ({
  timestamps,
  actualCloseTime,
  choices,
  visibleChoicesCount,
  defaultChartZoom,
  withZoomPicker,
  chartHeight = 100,
  chartTheme,
  userForecasts,
  question,
  questionType,
  scaling,
  hideCP,
  isCPRevealed,
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

  return (
    <div className="MultipleChoiceTile ml-0 mr-2 flex w-full grid-cols-[200px_auto] flex-col items-start gap-3 pr-1 xs:grid">
      <div className="resize-container">
        {isResolvedView ? (
          <PredictionChip question={question} status={PostStatus.RESOLVED} />
        ) : (
          <div className="embed-gap flex flex-col gap-2">
            {visibleChoices.map(
              ({
                choice,
                color,
                values,
                resolution,
                displayedResolution,
                scaling,
              }) => (
                <ChoiceOption
                  key={`choice-option-${choice}`}
                  choice={choice}
                  color={color}
                  values={hideCP ? [null as unknown as number] : values}
                  resolution={resolution}
                  displayedResolution={displayedResolution}
                  questionType={questionType}
                  scaling={scaling}
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
        )}
      </div>
      {!isResolvedView && (
        <div className="relative">
          <MultipleChoiceChart
            timestamps={timestamps}
            actualCloseTime={actualCloseTime}
            choiceItems={hideCP ? [] : choices}
            height={chartHeight}
            extraTheme={chartTheme}
            defaultZoom={defaultChartZoom}
            withZoomPicker={withZoomPicker}
            userForecasts={userForecasts}
            questionType={questionType}
            scaling={scaling}
          />
          {!isCPRevealed && question?.cp_reveal_time && (
            <div className="absolute inset-0 flex items-center justify-center pl-4 text-center text-xs lg:text-sm">
              <p className="max-w-[300px]">
                {t("cpWillRevealOn")}{" "}
                <LocalDaytime date={question.cp_reveal_time} />
              </p>
            </div>
          )}
        </div>
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
  questionType?: QuestionType;
  scaling?: Scaling;
}> = ({
  choice,
  color,
  values,
  displayedResolution,
  resolution,
  questionType,
  scaling,
}) => {
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
          {getChoiceOptionValue(
            values[values.length - 1],
            questionType,
            scaling
          )}
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

export default MultipleChoiceTile;
