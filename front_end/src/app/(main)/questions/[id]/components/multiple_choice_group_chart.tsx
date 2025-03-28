import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { VictoryThemeDefinition } from "victory";

import MultiChoicesChartView from "@/app/(main)/questions/[id]/components/multiple_choices_chart_view";
import CPRevealTime from "@/components/cp_reveal_time";
import { useAuth } from "@/contexts/auth_context";
import usePrevious from "@/hooks/use_previous";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import {
  QuestionLinearGraphType,
  Question,
  QuestionWithNumericForecasts,
  ForecastAvailability,
} from "@/types/question";
import {
  findPreviousTimestamp,
  generateChoiceItemsFromGroupQuestions,
  getContinuousGroupScaling,
  getDisplayValue,
} from "@/utils/charts";
import { generateUserForecasts } from "@/utils/questions";

type Props = {
  questions: QuestionWithNumericForecasts[];
  timestamps: number[];
  type: QuestionLinearGraphType;
  actualCloseTime?: number | null;
  openTime?: number;
  isClosed?: boolean;

  preselectedQuestionId?: number;
  hideCP?: boolean;
  forecastAvailability?: ForecastAvailability;
  maxVisibleCheckboxes?: number;

  defaultZoom?: TimelineChartZoomOption;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  embedMode?: boolean;
  withLegend?: boolean;
  className?: string;
};

const MultipleChoiceGroupChart: FC<Props> = ({
  questions,
  timestamps,
  type,
  actualCloseTime,
  openTime,
  isClosed,

  preselectedQuestionId,
  hideCP,
  forecastAvailability,
  maxVisibleCheckboxes = 6,

  defaultZoom,
  chartHeight,
  chartTheme,
  embedMode,
  withLegend,
  className,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const scaling = useMemo(
    () =>
      type === "continuous" ? getContinuousGroupScaling(questions) : undefined,
    [questions, type]
  );

  const userForecasts = useMemo(
    () => (user ? generateUserForecasts(questions, scaling) : undefined),
    [user, questions, scaling]
  );

  const timestampsCount = timestamps.length;
  const prevTimestampsCount = usePrevious(timestampsCount);
  const latestUserTimestamp = useMemo(() => {
    if (!userForecasts) {
      return null;
    }

    return Math.max(
      ...userForecasts
        .map((forecast) => forecast.timestamps?.at(-1) ?? 0)
        .filter((timestamp) => timestamp !== undefined)
    );
  }, [userForecasts]);
  const prevUserTimestamp = usePrevious(latestUserTimestamp);

  const generateList = useCallback(
    (
      questions: QuestionWithNumericForecasts[],
      preselectedQuestionId?: number
    ): ChoiceItem[] => {
      return generateChoiceItemsFromGroupQuestions(questions, {
        activeCount: maxVisibleCheckboxes,
        preselectedQuestionId,
      });
    },
    [maxVisibleCheckboxes]
  );
  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(questions, preselectedQuestionId)
  );

  // sync BE driven data with local state
  useEffect(() => {
    if (
      (prevTimestampsCount && prevTimestampsCount !== timestampsCount) ||
      (latestUserTimestamp && latestUserTimestamp !== prevUserTimestamp)
    ) {
      setChoiceItems(generateList(questions, preselectedQuestionId));
    }
  }, [
    questions,
    prevTimestampsCount,
    timestampsCount,
    preselectedQuestionId,
    latestUserTimestamp,
    prevUserTimestamp,
    generateList,
  ]);

  const [cursorTimestamp, tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);
  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(() => {
    return choiceItems
      .filter(({ active }) => active)
      .map(
        ({
          id,
          choice,
          aggregationValues,
          color,
          aggregationTimestamps: timestamps,
          closeTime,
        }) => {
          let valueElement: ReactNode;
          if (forecastAvailability?.cpRevealsOn) {
            valueElement = (
              <CPRevealTime cpRevealTime={forecastAvailability.cpRevealsOn} />
            );
          } else if (forecastAvailability?.isEmpty) {
            valueElement = t("noForecastsYet");
          } else if (hideCP) {
            valueElement = "...";
          } else {
            valueElement = getQuestionTooltipLabel({
              timestamps,
              values: aggregationValues,
              cursorTimestamp,
              closeTime,
              question: questions.find((q) => q.id === id),
            });
          }

          return {
            choiceLabel: choice,
            color,
            valueElement,
          };
        }
      );
  }, [
    choiceItems,
    forecastAvailability,
    hideCP,
    t,
    cursorTimestamp,
    questions,
  ]);
  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(() => {
    if (!user) {
      return [];
    }
    return choiceItems
      .filter(({ active }) => active)
      .map(
        ({
          id,
          choice,
          userValues,
          color,
          userTimestamps: timestamps,
          closeTime,
        }) => {
          return {
            choiceLabel: choice,
            color,
            valueElement: getQuestionTooltipLabel({
              timestamps,
              values: userValues,
              cursorTimestamp,
              closeTime,
              question: questions.find((q) => q.id === id),
            }),
          };
        }
      );
  }, [choiceItems, cursorTimestamp, questions, user]);

  const forecastersCount = useMemo(() => {
    // display cursor based value when viewing a single active option
    const selectedChoices = choiceItems.filter(({ active }) => active);
    if (selectedChoices.length === 1) {
      const selectedChoice = selectedChoices.at(0);
      if (!selectedChoice) {
        return null;
      }

      const actualTimestamps =
        selectedChoice.aggregationTimestamps ?? timestamps;
      const closestTimestamp = findPreviousTimestamp(
        actualTimestamps,
        cursorTimestamp
      );
      const cursorIndex = actualTimestamps.findIndex(
        (timestamp) => timestamp === closestTimestamp
      );

      return selectedChoice.aggregationForecasterCounts?.[cursorIndex] ?? null;
    }

    // otherwise display the value when option is highlighted
    const highlightedChoice = choiceItems.find(
      ({ highlighted }) => highlighted
    );
    if (!highlightedChoice) {
      return null;
    }
    return highlightedChoice.aggregationForecasterCounts?.at(-1) ?? null;
  }, [choiceItems, cursorTimestamp, timestamps]);

  return (
    <MultiChoicesChartView
      tooltipChoices={tooltipChoices}
      tooltipUserChoices={tooltipUserChoices}
      forecastersCount={forecastersCount}
      choiceItems={choiceItems}
      hideCP={hideCP}
      timestamps={timestamps}
      tooltipDate={tooltipDate}
      onCursorChange={handleCursorChange}
      onChoiceItemsUpdate={setChoiceItems}
      isClosed={isClosed}
      actualCloseTime={actualCloseTime}
      openTime={openTime}
      questionType={questions[0]?.type}
      scaling={scaling}
      title={t("forecastTimelineHeading")}
      yLabel={t("communityPredictionLabel")}
      chartTheme={chartTheme}
      embedMode={embedMode}
      chartHeight={chartHeight}
      withLegend={withLegend}
      defaultZoom={defaultZoom}
      isEmptyDomain={
        !!forecastAvailability?.isEmpty || !!forecastAvailability?.cpRevealsOn
      }
      className={className}
    />
  );
};

function getQuestionTooltipLabel({
  timestamps,
  values,
  cursorTimestamp,
  question,
  closeTime,
}: {
  timestamps: number[];
  values: (number | null)[];
  cursorTimestamp: number | null;
  question?: Question;
  isUserPrediction?: boolean;
  closeTime?: number | undefined;
}) {
  const hasValue =
    !isNil(cursorTimestamp) &&
    cursorTimestamp >= Math.min(...timestamps) &&
    cursorTimestamp <= Math.max(...timestamps, closeTime ?? 0);
  if (!hasValue || !question) {
    return "...";
  }

  const closestTimestamp = findPreviousTimestamp(timestamps, cursorTimestamp);
  const cursorIndex = timestamps.findIndex(
    (timestamp) => timestamp === closestTimestamp
  );

  const value = !isNil(cursorIndex) ? values[cursorIndex] : null;

  return getDisplayValue({
    value,
    questionType: question.type,
    scaling: question.scaling,
    actual_resolve_time: question.actual_resolve_time ?? null,
  });
}

export default MultipleChoiceGroupChart;
