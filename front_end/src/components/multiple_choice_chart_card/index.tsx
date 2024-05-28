"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import ChoiceCheckbox from "@/components/multiple_choice_chart_card/choice_checkbox";
import ChoicesTooltip from "@/components/multiple_choice_chart_card/choices_tooltip";
import { METAC_COLORS } from "@/contants/colors";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import { MultipleChoiceDataset, TickFormat } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";

const COLOR_SCALE = Object.values(METAC_COLORS["mc-option"]).map(
  (value) => value.DEFAULT
);

type Props = {
  dataset: MultipleChoiceDataset;
};

const MultipleChoiceChartCard: FC<Props> = ({ dataset }) => {
  const t = useTranslations();

  const [isChartReady, setIsChartReady] = useState(false);
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(() => {
    const { timestamps, nr_forecasters, ...choices } = dataset;
    return Object.entries(choices).map(([choice, values], index) => ({
      choice,
      values,
      color: COLOR_SCALE[index],
      active: true,
      highlighted: false,
    }));
  });

  const [cursorTimestamp, setCursorTimestamp] = useState(
    dataset.timestamps[dataset.timestamps.length - 1]
  );
  const cursorIndex = useMemo(
    () =>
      dataset.timestamps.findIndex(
        (timestamp) => timestamp === cursorTimestamp
      ),
    [cursorTimestamp, dataset.timestamps]
  );

  const [tooltipDate, setTooltipDate] = useState("");
  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(({ choice, values, color }) => ({
          choiceLabel: choice,
          color,
          valueLabel: `${Math.round(values[cursorIndex] * 100)}%`,
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
        "flex flex-col w-full",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="flex items-center">
        <h3 className="m-0 text-base font-normal leading-5">
          {t("forecastTimelineHeading")}
        </h3>
        <div className="ml-auto">
          {t("totalForecastersLabel")}{" "}
          <strong>{dataset.nr_forecasters[cursorIndex]}</strong>
        </div>
      </div>
      <div ref={refs.setReference} {...getReferenceProps()}>
        <MultipleChoiceChart
          timestamps={dataset.timestamps}
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
            color={color}
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
          className="pointer-events-none z-20 rounded bg-metac-gray-0 p-2 leading-4 shadow-lg dark:bg-metac-gray-0-dark"
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
