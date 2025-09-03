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
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import { PostGroupOfQuestions } from "@/types/post";
import { Question, QuestionWithNumericForecasts } from "@/types/question";
import { findPreviousTimestamp } from "@/utils/charts/cursor";
import { getLineGraphTypeFromQuestion } from "@/utils/charts/helpers";
import { getGroupQuestionsTimestamps } from "@/utils/charts/timestamps";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/questions/choices";
import { getGroupForecastAvailability } from "@/utils/questions/forecastAvailability";
import { getContinuousGroupScaling } from "@/utils/questions/helpers";

type QuestionsDataProps =
  | {
      questions: QuestionWithNumericForecasts[];
      group?: never;
    }
  | {
      questions?: never;
      group: PostGroupOfQuestions<QuestionWithNumericForecasts>;
    };

type Props = QuestionsDataProps & {
  actualCloseTime?: number | null;
  openTime?: number | null;
  isClosed?: boolean;

  preselectedQuestionId?: number;
  hideCP?: boolean;
  maxVisibleCheckboxes?: number;

  defaultZoom?: TimelineChartZoomOption;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  embedMode?: boolean;
  withLegend?: boolean;
  className?: string;
};

/**
 * Renders details group chart based on provided questions
 * Supports 2 types of input:
 * - group data, which will automatically apply sorting based on group post configuration
 * - raw questions list (specifically useful for rendering conditional post timeline)
 */
const GroupTimeline: FC<Props> = ({
  questions,
  group,
  actualCloseTime,
  openTime,
  isClosed,

  preselectedQuestionId,
  hideCP,
  maxVisibleCheckboxes = 3,

  defaultZoom,
  chartHeight,
  chartTheme,
  embedMode,
  withLegend,
  className,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const optionQuestions = group ? group.questions : questions;

  const forecastAvailability = getGroupForecastAvailability(optionQuestions);
  const timestamps = useMemo(
    () =>
      getGroupQuestionsTimestamps(optionQuestions, {
        withUserTimestamps: !!forecastAvailability.cpRevealsOn,
      }),
    [optionQuestions, forecastAvailability.cpRevealsOn]
  );

  const groupType = optionQuestions.at(0)?.type;
  const graphType = groupType ? getLineGraphTypeFromQuestion(groupType) : null;
  const scaling = useMemo(
    () =>
      graphType === "continuous"
        ? getContinuousGroupScaling(optionQuestions)
        : undefined,
    [optionQuestions, graphType]
  );

  const generateList = useCallback(
    (
      questions?: QuestionWithNumericForecasts[],
      group?: PostGroupOfQuestions<QuestionWithNumericForecasts>,
      preselectedQuestionId?: number
    ): ChoiceItem[] => {
      if (group) {
        return generateChoiceItemsFromGroupQuestions(group, {
          activeCount: maxVisibleCheckboxes,
          preselectedQuestionId,
        });
      }

      if (questions) {
        return generateChoiceItemsFromGroupQuestions(questions, {
          activeCount: maxVisibleCheckboxes,
          preselectedQuestionId,
        });
      }

      return [];
    },
    [maxVisibleCheckboxes]
  );
  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(questions, group, preselectedQuestionId)
  );

  // sync BE driven data with local state
  useEffect(() => {
    setChoiceItems(generateList(questions, group, preselectedQuestionId));
  }, [questions, preselectedQuestionId, generateList, group]);

  const [cursorTimestamp, _tooltipDate, handleCursorChange] =
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
              question: optionQuestions.find((q) => q.id === id),
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
    forecastAvailability.cpRevealsOn,
    forecastAvailability?.isEmpty,
    hideCP,
    t,
    cursorTimestamp,
    optionQuestions,
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
              question: optionQuestions.find((q) => q.id === id),
            }),
          };
        }
      );
  }, [optionQuestions, choiceItems, cursorTimestamp, user]);

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
    if (highlightedChoice) {
      return highlightedChoice.aggregationForecasterCounts?.at(-1) ?? null;
    }

    // fallback: when multiple choices are active, show cursor-based forecasters from first active choice
    if (selectedChoices.length > 1) {
      const firstActiveChoice = selectedChoices.at(0);
      if (firstActiveChoice?.aggregationForecasterCounts) {
        // Use cursor-based logic like single choice case
        const actualTimestamps =
          firstActiveChoice.aggregationTimestamps ?? timestamps;
        const closestTimestamp = findPreviousTimestamp(
          actualTimestamps,
          cursorTimestamp
        );
        const cursorIndex = actualTimestamps.findIndex(
          (timestamp) => timestamp === closestTimestamp
        );

        return (
          firstActiveChoice.aggregationForecasterCounts[cursorIndex] ?? null
        );
      }
    }

    return null;
  }, [choiceItems, cursorTimestamp, timestamps]);

  return (
    <MultiChoicesChartView
      cursorTimestamp={cursorTimestamp}
      tooltipChoices={tooltipChoices}
      tooltipUserChoices={tooltipUserChoices}
      tooltipTitle={group?.group_variable}
      forecastersCount={forecastersCount}
      choiceItems={choiceItems}
      hideCP={hideCP}
      timestamps={timestamps}
      onCursorChange={handleCursorChange}
      onChoiceItemsUpdate={setChoiceItems}
      isClosed={isClosed}
      actualCloseTime={actualCloseTime}
      openTime={openTime}
      questionType={groupType}
      scaling={scaling}
      title={t("forecastTimelineHeading")}
      chartTheme={chartTheme}
      embedMode={embedMode}
      chartHeight={chartHeight}
      withLegend={withLegend}
      defaultZoom={defaultZoom}
      forecastAvailability={forecastAvailability}
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

  return getPredictionDisplayValue(value, {
    questionType: question.type,
    scaling: question.scaling,
    actual_resolve_time: question.actual_resolve_time ?? null,
  });
}

export default GroupTimeline;
