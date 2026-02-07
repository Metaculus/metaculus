"use client";
import { FloatingPortal } from "@floating-ui/react";
import { useTranslations } from "next-intl";
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
  forecastersCount,
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
  const t = useTranslations();

  const isMC = questionType === QuestionType.MultipleChoice;

  const legendContainerRef = useRef<HTMLDivElement>(null);
  const [normalizedChartHeight, setNormalizedChartHeight] = useState<number>();
  useEffect(() => {
    if (!legendContainerRef.current || !chartHeight) return;
    setNormalizedChartHeight(
      chartHeight -
        (legendContainerRef.current?.clientHeight ?? 0) -
        (legendContainerRef.current.offsetHeight ?? 0)
    );
  }, [chartHeight]);

  const maxPrimary = embedMode ? 2 : MAX_VISIBLE_CHECKBOXES;
  const showOthersToggle = isMC && choiceItems.length > maxPrimary;

  const normalizedInitRef = useRef(false);
  useEffect(() => {
    if (!isMC) return;
    if (normalizedInitRef.current) return;
    if (!choiceItems.length) return;
    const updated = choiceItems.map((it, idx) =>
      idx >= maxPrimary ? { ...it, active: false } : it
    );
    const changed = updated.some(
      (it, i) => it.active !== choiceItems[i]?.active
    );
    if (changed) onChoiceItemsUpdate(updated);
    normalizedInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMC, choiceItems, maxPrimary, onChoiceItemsUpdate]);
  const computeOthersVisible = useCallback(
    (items: ChoiceItem[]) => {
      if (!isMC || items.length <= maxPrimary) return false;
      const left = items.slice(0, maxPrimary);
      const right = items.slice(maxPrimary);
      const dropdown = [...left.filter((c) => !c.active), ...right];
      if (dropdown.length === 0) return false;
      return dropdown.every((c) => c.active);
    },
    [isMC, maxPrimary]
  );
  const [othersVisible, setOthersVisible] = useState<boolean>(() =>
    computeOthersVisible(choiceItems)
  );
  useEffect(() => {
    if (!showOthersToggle) return;
    const next = computeOthersVisible(choiceItems);
    if (next !== othersVisible) setOthersVisible(next);
  }, [showOthersToggle, choiceItems, computeOthersVisible, othersVisible]);

  const {
    isActive: isTooltipActive,
    getReferenceProps,
    getFloatingProps,
    refs,
    floatingStyles,
  } = useChartTooltip();
  const attachRef = useCallback(
    (node: HTMLElement | null) => {
      if (node) refs.setReference(node);
    },
    [refs]
  );

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
      if (isMC && choiceItems.length > maxPrimary) {
        const left = choiceItems.slice(0, maxPrimary);
        const leftInactive = new Set(
          left.filter((c) => !c.active).map((c) => c.choice)
        );
        const rightChoices = new Set(
          choiceItems.slice(maxPrimary).map((c) => c.choice)
        );
        const dropdownSet = new Set<string>([...leftInactive, ...rightChoices]);
        const nextActive = !isAllSelected;
        onChoiceItemsUpdate(
          choiceItems.map((item) =>
            dropdownSet.has(item.choice)
              ? { ...item, active: nextActive, highlighted: false }
              : item
          )
        );
      } else {
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
      }
    },
    [isMC, choiceItems, maxPrimary, onChoiceItemsUpdate]
  );

  const chartChoiceItems = useMemo(
    () => (isMC ? buildChartChoiceItems(choiceItems, embedMode) : choiceItems),
    [isMC, choiceItems, embedMode]
  );

  const totalActiveCount = useMemo(
    () => choiceItems.filter((c) => c.active).length,
    [choiceItems]
  );

  const canTimeline = isMC && totalActiveCount === 1;

  const [timelineMode, setTimelineMode] = useState(false);

  useEffect(() => {
    if (!canTimeline && timelineMode) setTimelineMode(false);
  }, [canTimeline, timelineMode]);

  const useBinaryView = canTimeline && timelineMode;

  const singleActive = useMemo(
    () => getSingleActive(choiceItems),
    [choiceItems]
  );

  const binaryChoiceItems = useMemo(
    () =>
      singleActive
        ? [{ ...singleActive, color: singleActive.color, highlighted: true }]
        : [],
    [singleActive]
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
    attachRef,
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
        {useBinaryView ? (
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
        ) : isMC ? (
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
        <div className="-ml-1 mt-3" ref={legendContainerRef}>
          <ChoicesLegend
            choices={choiceItems}
            onChoiceChange={handleChoiceChange}
            onChoiceHighlight={handleChoiceHighlight}
            onToggleAll={toggleSelectAll}
            maxLegendChoices={embedMode ? 2 : MAX_VISIBLE_CHECKBOXES}
            othersToggle={showOthersToggle ? !timelineMode : undefined}
            onOthersToggle={
              showOthersToggle
                ? (checked) => setTimelineMode(!checked)
                : undefined
            }
            othersDisabled={
              showOthersToggle ? totalActiveCount !== 1 : undefined
            }
          />
        </div>
      )}

      {isTooltipActive &&
        (tooltipChoices.length > 0 ||
          !!tooltipUserChoices?.length ||
          !!forecastAvailability?.cpRevealsOn ||
          !!forecastAvailability?.isEmpty) && (
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
                showMeColumn={
                  !!tooltipUserChoices?.length ||
                  !!forecastAvailability?.cpRevealsOn ||
                  !!forecastAvailability?.isEmpty
                }
                FooterRow={
                  forecastersCount !== null &&
                  forecastersCount !== undefined ? (
                    <tr className="border-t border-gray-300 dark:border-gray-300-dark">
                      <th
                        className="px-3 pb-1 pt-2 text-left text-sm font-normal text-gray-800 dark:text-gray-800-dark"
                        colSpan={2}
                      >
                        {t("activeForecastersLabel")}
                      </th>
                      <td
                        className="pr-5 pt-1 text-right text-sm font-normal tabular-nums text-gray-700 dark:text-gray-700-dark"
                        colSpan={2}
                      >
                        {forecastersCount}
                      </td>
                    </tr>
                  ) : null
                }
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
  embedMode: boolean
): ChoiceItem[] {
  const maxPrimary = embedMode ? 2 : MAX_VISIBLE_CHECKBOXES;
  const primary = all.slice(0, maxPrimary);
  const right = all.slice(maxPrimary);
  const series: ChoiceItem[] = [];
  primary.forEach((p) => {
    if (p.active) series.push(p);
  });
  right.forEach((r) => {
    if (r.active) series.push(r);
  });

  const pool = [
    ...primary.filter((p) => !p.active),
    ...right.filter((r) => !r.active),
  ];
  if (pool.length === 0) return series.length ? series : primary;

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
    sumNullable(pool.map((o) => o.aggregationValues[i]))
  );
  const userValues = userTs.map((_, i) =>
    sumNullable(pool.map((o) => o.userValues[i]))
  );

  const othersItem = {
    choice: "Others",
    color: METAC_COLORS.gray["400"],
    active: true,
    highlighted: false,
    aggregationTimestamps: aggTs,
    aggregationValues,
    userTimestamps: userTs,
    userValues,
  } as unknown as ChoiceItem;

  return [...series, othersItem];
}

function getSingleActive(all: ChoiceItem[]): ChoiceItem | null {
  const actives = all.filter((c) => c.active);
  return actives.length === 1 ? actives[0] ?? null : null;
}

export default MultiChoicesChartView;
