"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import ChoiceCheckbox from "@/components/detailed_question_card/multiple_choice_chart_card/choice_checkbox";
import ChoicesTooltip from "@/components/detailed_question_card/multiple_choice_chart_card/choices_tooltip";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import { TickFormat } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import { MultipleChoiceForecast } from "@/types/question";
import { generateChartChoices } from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

type Props = {
  forecast: MultipleChoiceForecast;
};

const MultipleChoiceChartCard: FC<Props> = ({ forecast }) => {
  const t = useTranslations();

  const [isChartReady, setIsChartReady] = useState(false);
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateChartChoices(forecast)
  );

  const [cursorTimestamp, setCursorTimestamp] = useState(
    forecast.timestamps[forecast.timestamps.length - 1]
  );
  const cursorIndex = useMemo(
    () =>
      forecast.timestamps.findIndex(
        (timestamp) => timestamp === cursorTimestamp
      ),
    [cursorTimestamp, forecast.timestamps]
  );

  const [tooltipDate, setTooltipDate] = useState("");
  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(({ choice, values, color }) => ({
          choiceLabel: choice,
          color,
          valueLabel: getForecastPctDisplayValue(values[cursorIndex]),
        })),
    [choiceItems, cursorIndex]
  );

  const handleCursorChange = useCallback(
    (value: number, format: TickFormat) => {
      setCursorTimestamp(value);
      setTooltipDate(format(value));
    },
    []
  );

  const {
    isActive: isTooltipActive,
    getReferenceProps,
    getFloatingProps,
    refs,
    floatingStyles,
  } = useChartTooltip();

  const handleChoiceChange = useCallback((choice: string, checked: boolean) => {
    setChoiceItems((prev) =>
      prev.map((item) =>
        item.choice === choice
          ? { ...item, active: checked, highlighted: false }
          : item
      )
    );
  }, []);
  const handleChoiceHighlight = useCallback(
    (choice: string, highlighted: boolean) => {
      setChoiceItems((prev) =>
        prev.map((item) =>
          item.choice === choice ? { ...item, highlighted } : item
        )
      );
    },
    []
  );

  return (
    <div
      className={classNames(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="flex items-center">
        <h3 className="m-0 text-base font-normal leading-5">
          {t("forecastTimelineHeading")}
        </h3>
        <div className="dark:text-white ml-auto">
          {t("totalForecastersLabel")}{" "}
          <strong>{forecast.nr_forecasters[cursorIndex]}</strong>
        </div>
      </div>
      <div ref={refs.setReference} {...getReferenceProps()}>
        <MultipleChoiceChart
          timestamps={forecast.timestamps}
          choiceItems={choiceItems}
          yLabel={t("communityPredictionLabel")}
          onChartReady={handleChartReady}
          onCursorChange={handleCursorChange}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-normal">
        {choiceItems.map(({ choice, color, active }) => (
          <ChoiceCheckbox
            key={`multiple-choice-legend-${choice}`}
            choice={choice}
            color={color.DEFAULT}
            checked={active}
            onChange={(checked) => handleChoiceChange(choice, checked)}
            onHighlight={(highlighted) =>
              handleChoiceHighlight(choice, highlighted)
            }
          />
        ))}
      </div>

      {isTooltipActive && !!tooltipChoices.length && (
        <div
          className="pointer-events-none z-20 rounded bg-gray-0 p-2 leading-4 shadow-lg dark:bg-gray-0-dark"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <ChoicesTooltip date={tooltipDate} choices={tooltipChoices} />
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceChartCard;
