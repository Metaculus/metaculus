"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { VictoryThemeDefinition } from "victory";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import ChoiceIcon from "@/components/choice_icon";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

type Props = {
  timestamps: number[];
  choices: ChoiceItem[];
  visibleChoicesCount: number;
  defaultChartZoom?: TimelineChartZoomOption;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
};

const MultipleChoiceTile: FC<Props> = ({
  timestamps,
  choices,
  visibleChoicesCount,
  defaultChartZoom,
  chartHeight = 100,
  chartTheme,
}) => {
  const t = useTranslations();

  const visibleChoices = choices.slice(0, visibleChoicesCount);
  const otherItemsCount = choices.length - visibleChoices.length;

  return (
    <div className="MultipleChoiceTile ml-0 mr-2 flex w-full grid-cols-[200px_auto] flex-col items-start gap-3 p-1 pl-0 xs:grid">
      <div className="resize-container">
        <div className="embed-gap flex flex-col gap-2">
          {visibleChoices.map(({ choice, color, values }) => (
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
              <div className="resize-label py-0.5 pr-1.5 text-right text-sm font-bold leading-4 text-gray-900 dark:text-gray-900-dark">
                {getForecastPctDisplayValue(values[values.length - 1])}
              </div>
            </div>
          ))}
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
      </div>
      <MultipleChoiceChart
        timestamps={timestamps}
        choiceItems={choices}
        height={chartHeight}
        extraTheme={chartTheme}
        defaultZoom={defaultChartZoom}
      />
    </div>
  );
};

export default MultipleChoiceTile;
