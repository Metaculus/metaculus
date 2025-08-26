"use client";
import { FloatingPortal } from "@floating-ui/react";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import GroupChart from "@/components/charts/group_chart";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import MCPredictionsTooltip from "@/components/charts/primitives/mc_predictions_tooltip";
import { METAC_COLORS } from "@/constants/colors";
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
  const handleChartReady = useCallback(() => setIsChartReady(true), []);

  const legendContainerRef = useRef<HTMLDivElement>(null);
  const [normalizedChartHeight, setNormalizedChartHeight] = useState<
    number | undefined
  >();
  useEffect(() => {
    if (!legendContainerRef.current || !chartHeight) return;
    setNormalizedChartHeight(
      chartHeight -
        (legendContainerRef.current?.clientHeight ?? 0) -
        (legendContainerRef.current.offsetHeight ?? 0)
    );
  }, [chartHeight]);

  const maxPrimary = embedMode ? 2 : MAX_VISIBLE_CHECKBOXES;
  const leftChoices = useMemo(
    () => choiceItems.slice(0, maxPrimary),
    [choiceItems, maxPrimary]
  );
  const leftActiveCount = useMemo(
    () => leftChoices.filter((c) => c.active).length,
    [leftChoices]
  );
  const [othersVisible, setOthersVisible] = useState(true);

  useEffect(() => {
    if (leftActiveCount !== 1 && !othersVisible) {
      setOthersVisible(true);
    }
  }, [leftActiveCount, othersVisible]);

  const {
    isActive: isTooltipActive,
    getReferenceProps,
    getFloatingProps,
    refs,
    floatingStyles,
  } = useChartTooltip();

  const handleChoiceChange = useCallback(
    (choice: string, checked: boolean) => {
      if (!isInteracted.current) isInteracted.current = true;
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
      onChoiceItemsUpdate(
        choiceItems.map((item) =>
          isAllSelected
            ? { ...item, active: false, highlighted: false }
            : { ...item, active: true }
        )
      );
    },
    [choiceItems, onChoiceItemsUpdate]
  );

  const chartChoiceItems = useMemo(
    () => buildChartChoiceItems(choiceItems, embedMode, othersVisible),
    [choiceItems, embedMode, othersVisible]
  );

  const singleActive = useMemo(
    () => getSingleActive(choiceItems),
    [choiceItems]
  );
  const forceBinaryView =
    questionType === QuestionType.MultipleChoice && singleActive !== null;

  const binaryChoiceItems = useMemo(
    () =>
      singleActive
        ? [
            {
              ...singleActive,
              color: singleActive.color,
              highlighted: true,
            },
          ]
        : [],
    [singleActive]
  );

  const handleOthersToggle = useCallback(
    (checked: boolean) => {
      setOthersVisible(checked);

      const maxPrimary = embedMode ? 2 : MAX_VISIBLE_CHECKBOXES;
      const updated = choiceItems.map((item, idx) =>
        idx >= maxPrimary ? { ...item, active: checked } : item
      );

      onChoiceItemsUpdate(updated);
    },
    [choiceItems, onChoiceItemsUpdate, embedMode]
  );

  const commonChartProps = {
    actualCloseTime,
    timestamps,
    hideCP,
    yLabel: embedMode ? undefined : yLabel,
    onChartReady: handleChartReady,
    onCursorChange,
    scaling,
    isClosed,
    extraTheme: chartTheme,
    height: normalizedChartHeight,
    withZoomPicker: true,
    defaultZoom: resolveDefaultZoom(defaultZoom, !!user),
    openTime,
    forceAutoZoom: isInteracted.current,
    forecastAvailability,
  } as const;

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
        className="relative"
      >
        {forceBinaryView ? (
          <GroupChart
            {...commonChartProps}
            cursorTimestamp={null}
            questionType={QuestionType.Binary}
            isEmptyDomain={
              !!forecastAvailability?.isEmpty ||
              !!forecastAvailability?.cpRevealsOn
            }
            choiceItems={binaryChoiceItems}
          />
        ) : questionType === QuestionType.MultipleChoice ? (
          <MultipleChoiceChart
            {...commonChartProps}
            isEmbedded={embedMode}
            chartTitle={!embedMode ? title : undefined}
            choiceItems={chartChoiceItems}
          />
        ) : (
          <GroupChart
            {...commonChartProps}
            questionType={questionType}
            isEmptyDomain={
              !!forecastAvailability?.isEmpty ||
              !!forecastAvailability?.cpRevealsOn
            }
            cursorTimestamp={cursorTimestamp}
            choiceItems={choiceItems}
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
            othersToggle={othersVisible}
            onOthersToggle={handleOthersToggle}
            othersDisabled={leftActiveCount !== 1}
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

function resolveDefaultZoom(
  explicit: TimelineChartZoomOption | undefined,
  hasUser: boolean
) {
  return (
    explicit ??
    (hasUser ? TimelineChartZoomOption.All : TimelineChartZoomOption.TwoMonths)
  );
}

function buildChartChoiceItems(
  all: ChoiceItem[],
  embedMode: boolean,
  othersVisible = true
): ChoiceItem[] {
  const maxPrimary = embedMode ? 2 : MAX_VISIBLE_CHECKBOXES;
  const primary = all.slice(0, maxPrimary);
  const right = all.slice(maxPrimary);
  if (right.length === 0 && primary.every((p) => p.active)) return all;

  const leftInactive = primary.filter((c) => !c.active);
  const pool = [...right, ...leftInactive];
  if (pool.length === 0) return all;

  const leftInactiveSet = new Set(leftInactive.map((c) => c.choice));

  const aggTs = pool[0]?.aggregationTimestamps ?? [];
  const userTs = pool[0]?.userTimestamps ?? [];

  const sumNullable = (vals: Array<number | null | undefined>) => {
    let sum = 0;
    let hasAny = false;
    for (const v of vals) {
      if (v != null) {
        sum += v;
        hasAny = true;
      }
    }
    return hasAny ? Number(sum.toFixed(6)) : null;
  };

  const aggregationValues = aggTs.map((_, i) =>
    sumNullable(
      pool.map((o) =>
        o.active || leftInactiveSet.has(o.choice) ? o.aggregationValues[i] : 0
      )
    )
  );

  const userValues = userTs.map((_, i) =>
    sumNullable(
      pool.map((o) =>
        o.active || leftInactiveSet.has(o.choice) ? o.userValues[i] : 0
      )
    )
  );

  const anyIncluded = pool.some(
    (o) => o.active || leftInactiveSet.has(o.choice)
  );

  const othersItem = {
    choice: "Others",
    color: METAC_COLORS.gray["400"],
    active: anyIncluded && othersVisible,
    highlighted: false,
    aggregationTimestamps: aggTs,
    aggregationValues,
    userTimestamps: userTs,
    userValues,
  } as unknown as ChoiceItem;

  return [...primary, othersItem];
}

function getSingleActive(all: ChoiceItem[]): ChoiceItem | null {
  const actives = all.filter((c) => c.active);
  return actives.length === 1 ? actives[0] ?? null : null;
}

export default MultiChoicesChartView;
