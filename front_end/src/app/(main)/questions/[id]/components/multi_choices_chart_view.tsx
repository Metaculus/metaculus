"use client";
import classNames from "classnames";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import ChoicesLegend from "@/app/(main)/questions/[id]/components/choices_legend";
import ChoicesTooltip from "@/app/(main)/questions/[id]/components/choices_tooltip";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { useAuth } from "@/contexts/auth_context";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import { TickFormat, TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem, UserChoiceItem } from "@/types/choices";
import { QuestionType, Scaling } from "@/types/question";

const MAX_VISIBLE_CHECKBOXES = 6;

type Props = {
  choiceItems: ChoiceItem[];
  tooltipDate: string;
  tooltipChoices: ChoiceTooltipItem[];
  tooltipUserChoices?: ChoiceTooltipItem[];
  onChoiceItemChange: (choice: string, checked: boolean) => void;
  onChoiceItemHighlight: (choice: string, highlighted: boolean) => void;
  onToggleSelectAll: (isAllSelected: boolean) => void;
  timestamps: number[];
  onCursorChange: (value: number, format: TickFormat) => void;
  actualCloseTime?: number | null;
  userForecasts?: UserChoiceItem[];
  isClosed?: boolean;

  title?: string;
  yLabel?: string;
  questionType?: QuestionType;
  scaling?: Scaling;
  defaultZoom?: TimelineChartZoomOption;

  withLegend?: boolean;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  embedMode?: boolean;
};

const MultiChoicesChartView: FC<Props> = ({
  choiceItems,
  tooltipDate,
  tooltipChoices,
  tooltipUserChoices,
  onChoiceItemChange,
  onChoiceItemHighlight,
  onToggleSelectAll,
  timestamps,
  onCursorChange,
  actualCloseTime,
  userForecasts,
  isClosed,

  title,
  yLabel,
  questionType,
  scaling,
  defaultZoom,

  withLegend = true,
  chartHeight,
  chartTheme,
  embedMode = false,
}) => {
  const { user } = useAuth();

  const [isChartReady, setIsChartReady] = useState(false);
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const legendContainerRef = useRef<HTMLDivElement>(null);
  const [normalizedChartHeight, setNormalizedChartHeight] = useState<
    number | undefined
  >(undefined);
  useEffect(() => {
    if (!legendContainerRef.current || !chartHeight) return;

    setNormalizedChartHeight(
      chartHeight -
        (legendContainerRef.current?.clientHeight ?? 0) -
        (legendContainerRef.current.offsetHeight ?? 0)
    );
  }, [chartHeight]);

  const {
    isActive: isTooltipActive,
    getReferenceProps,
    getFloatingProps,
    refs,
    floatingStyles,
  } = useChartTooltip();

  return (
    <div
      className={classNames(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="flex items-center">
        {!embedMode && !!title && (
          <h3 className="m-0 text-base font-normal leading-5">{title}</h3>
        )}
      </div>
      <div ref={refs.setReference} {...getReferenceProps()}>
        <MultipleChoiceChart
          actualCloseTime={actualCloseTime}
          timestamps={timestamps}
          choiceItems={choiceItems}
          yLabel={embedMode ? undefined : yLabel}
          onChartReady={handleChartReady}
          onCursorChange={onCursorChange}
          userForecasts={userForecasts}
          questionType={questionType}
          scaling={scaling}
          isClosed={isClosed}
          extraTheme={chartTheme}
          height={normalizedChartHeight}
          withZoomPicker
          defaultZoom={
            defaultZoom
              ? defaultZoom
              : user
                ? TimelineChartZoomOption.All
                : TimelineChartZoomOption.TwoMonths
          }
        />
      </div>

      {withLegend && (
        <div className="mt-3" ref={legendContainerRef}>
          <ChoicesLegend
            choices={choiceItems}
            onChoiceChange={onChoiceItemChange}
            onChoiceHighlight={onChoiceItemHighlight}
            maxLegendChoices={embedMode ? 2 : MAX_VISIBLE_CHECKBOXES}
            onToggleAll={onToggleSelectAll}
          />
        </div>
      )}

      {isTooltipActive && !!tooltipChoices.length && (
        <div
          className="pointer-events-none z-20 rounded bg-gray-0 p-2 leading-4 shadow-lg dark:bg-gray-0-dark"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <ChoicesTooltip
            date={tooltipDate}
            choices={tooltipChoices}
            userChoices={tooltipUserChoices}
          />
        </div>
      )}
    </div>
  );
};

export default MultiChoicesChartView;
