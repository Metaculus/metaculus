"use client";
import { FloatingPortal } from "@floating-ui/react";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import GroupChart from "@/components/charts/group_chart";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import MCPredictionsTooltip from "@/components/charts/primitives/mc_predictions_tooltip";
import { useAuth } from "@/contexts/auth_context";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import { TickFormat, TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import { ForecastAvailability, QuestionType, Scaling } from "@/types/question";
import cn from "@/utils/core/cn";

import ChoicesLegend from "./choices_legend";

const MAX_VISIBLE_CHECKBOXES = 3;

type Props = {
  choiceItems: ChoiceItem[];
  tooltipTitle?: string;
  tooltipChoices: ChoiceTooltipItem[];
  tooltipUserChoices?: ChoiceTooltipItem[];
  forecastersCount?: number | null;
  onChoiceItemsUpdate: (choiceItems: ChoiceItem[]) => void;
  timestamps: number[];
  onCursorChange?: (value: number, format: TickFormat) => void;
  openTime?: number | null;
  actualCloseTime?: number | null;
  isClosed?: boolean;
  hideCP?: boolean;
  cursorTimestamp?: number | null;
  title?: string;
  yLabel?: string;
  questionType?: QuestionType;
  scaling?: Scaling;
  defaultZoom?: TimelineChartZoomOption;

  withLegend?: boolean;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  embedMode?: boolean;
  className?: string;
  forecastAvailability?: ForecastAvailability;
};

const MultiChoicesChartView: FC<Props> = ({
  choiceItems,
  tooltipTitle,
  tooltipChoices,
  tooltipUserChoices,
  cursorTimestamp,
  onChoiceItemsUpdate,
  timestamps,
  onCursorChange,
  openTime,
  actualCloseTime,
  isClosed,
  hideCP,

  title,
  yLabel,
  questionType,
  scaling,
  defaultZoom,

  withLegend = true,
  chartHeight,
  chartTheme,
  embedMode = false,
  className,
  forecastAvailability,
}) => {
  const { user } = useAuth();
  const isInteracted = useRef(false);
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

  const handleChoiceChange = useCallback(
    (choice: string, checked: boolean) => {
      if (!isInteracted.current) {
        isInteracted.current = true;
      }
      onChoiceItemsUpdate(
        choiceItems.map((item) =>
          item.choice === choice
            ? { ...item, active: checked, highlighted: false }
            : item
        )
      );
    },
    [choiceItems, onChoiceItemsUpdate]
  );
  const handleChoiceHighlight = useCallback(
    (choice: string, highlighted: boolean) => {
      onChoiceItemsUpdate(
        choiceItems.map((item) =>
          item.choice === choice ? { ...item, highlighted } : item
        )
      );
    },
    [choiceItems, onChoiceItemsUpdate]
  );
  const toggleSelectAll = useCallback(
    (isAllSelected: boolean) => {
      if (isAllSelected) {
        onChoiceItemsUpdate(
          choiceItems.map((item) => ({
            ...item,
            active: false,
            highlighted: false,
          }))
        );
      } else {
        onChoiceItemsUpdate(
          choiceItems.map((item) => ({ ...item, active: true }))
        );
      }
    },
    [choiceItems, onChoiceItemsUpdate]
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        className,
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className={"relative"}
      >
        {questionType === QuestionType.MultipleChoice ? (
          <MultipleChoiceChart
            actualCloseTime={actualCloseTime}
            timestamps={timestamps}
            choiceItems={choiceItems}
            hideCP={hideCP}
            yLabel={embedMode ? undefined : yLabel}
            onChartReady={handleChartReady}
            onCursorChange={onCursorChange}
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
            openTime={openTime}
            forceAutoZoom={isInteracted.current}
            isEmbedded={embedMode}
            forecastAvailability={forecastAvailability}
            chartTitle={!embedMode ? title : undefined}
          />
        ) : (
          <GroupChart
            actualCloseTime={actualCloseTime}
            timestamps={timestamps}
            choiceItems={choiceItems}
            cursorTimestamp={cursorTimestamp}
            hideCP={hideCP}
            yLabel={embedMode ? undefined : yLabel}
            onChartReady={handleChartReady}
            onCursorChange={onCursorChange}
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
            isEmptyDomain={
              !!forecastAvailability?.isEmpty ||
              !!forecastAvailability?.cpRevealsOn
            }
            openTime={openTime}
            forceAutoZoom={isInteracted.current}
          />
        )}
      </div>

      {withLegend && (
        <div className="mt-3 md:pl-2.5" ref={legendContainerRef}>
          <ChoicesLegend
            choices={choiceItems}
            onChoiceChange={handleChoiceChange}
            onChoiceHighlight={handleChoiceHighlight}
            onToggleAll={toggleSelectAll}
            maxLegendChoices={embedMode ? 2 : MAX_VISIBLE_CHECKBOXES}
          />
        </div>
      )}

      {isTooltipActive && !!tooltipChoices.length && (
        <FloatingPortal>
          <div
            className="pointer-events-none z-[100] rounded bg-gray-0 leading-4 shadow-lg dark:bg-gray-0-dark"
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <MCPredictionsTooltip
              title={tooltipTitle}
              communityPredictions={tooltipChoices}
              userPredictions={tooltipUserChoices}
            />
          </div>
        </FloatingPortal>
      )}
    </div>
  );
};

export default MultiChoicesChartView;
