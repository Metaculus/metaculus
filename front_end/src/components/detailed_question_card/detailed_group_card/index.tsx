"use client";

import { FC, useEffect, useMemo } from "react";
import { VictoryThemeDefinition } from "victory";

import { useIsEmbedMode } from "@/app/(embed)/questions/components/question_view_mode_context";
import GroupTimeline from "@/app/(main)/questions/[id]/components/group_timeline";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import FanChart from "@/components/charts/fan_chart";
import { MultipleChoiceTile } from "@/components/post_card/multiple_choice_tile";
import { ContinuousQuestionTypes } from "@/constants/questions";
import { useHideCP } from "@/contexts/cp_context";
import { TimelineChartZoomOption } from "@/types/charts";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import {
  GroupOfQuestionsGraphType,
  GroupOfQuestionsPost,
  PostStatus,
} from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getGroupQuestionsTimestamps } from "@/utils/charts/timestamps";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/questions/choices";
import { getGroupForecastAvailability } from "@/utils/questions/forecastAvailability";
import {
  getContinuousGroupScaling,
  getPostDrivenTime,
} from "@/utils/questions/helpers";
import { getCommonUnit } from "@/utils/questions/units";

import { getMaxVisibleCheckboxes } from "../embeds";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  preselectedQuestionId?: number;
  /**
   * Skips post-driven presentation.
   * Specifically useful to show timeline for fan graph groups
   */
  groupPresentationOverride?: GroupOfQuestionsGraphType;
  className?: string;
  prioritizeOpenSubquestions?: boolean;
  embedChartHeight?: number;
  onLegendHeightChange?: (height: number) => void;
  chartTheme?: VictoryThemeDefinition;
  defaultZoom?: TimelineChartZoomOption;
};

const DetailedGroupCard: FC<Props> = ({
  post,
  preselectedQuestionId,
  groupPresentationOverride,
  className,
  prioritizeOpenSubquestions = false,
  embedChartHeight,
  onLegendHeightChange,
  chartTheme,
  defaultZoom,
}) => {
  const {
    open_time,
    actual_close_time,
    scheduled_close_time,
    group_of_questions: { questions, graph_type },
    status,
  } = post;
  const refCloseTime = actual_close_time ?? scheduled_close_time;

  const { hideCP } = useHideCP();

  const presentationType = groupPresentationOverride ?? graph_type;

  const hasUserForecast = questions.some(
    (q) => !!q.my_forecasts?.history.length
  );

  useEffect(() => {
    if (groupPresentationOverride) {
      // skip event tracking as it will be tracked by details card in hero section
      return;
    }

    if (hasUserForecast) {
      sendAnalyticsEvent("visitPredictedQuestion", {
        event_category: "group",
      });
    }
  }, [groupPresentationOverride, hasUserForecast]);

  const isEmbed = useIsEmbedMode();

  const maxVisibleCheckboxes = useMemo(
    () => getMaxVisibleCheckboxes(isEmbed),
    [isEmbed]
  );

  const forecastAvailability = getGroupForecastAvailability(questions);

  const groupType = questions[0]?.type;
  const isContinuousGroup =
    !!groupType && ContinuousQuestionTypes.some((t) => t === groupType);

  const commonUnit = useMemo(() => {
    if (!isContinuousGroup) return null;
    return getCommonUnit(
      questions.map((q) => ({
        unit: q.unit,
        scaling: q.scaling ? { unit: q.unit } : null,
      }))
    );
  }, [isContinuousGroup, questions]);

  const groupScaling = useMemo(
    () =>
      isContinuousGroup ? getContinuousGroupScaling(questions) : undefined,
    [isContinuousGroup, questions]
  );
  const timestamps = getGroupQuestionsTimestamps(questions, {
    withUserTimestamps: !!forecastAvailability.cpRevealsOn,
  });

  const [_cursorTimestamp, _tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

  if (
    forecastAvailability.isEmpty &&
    forecastAvailability.cpRevealsOn &&
    status !== PostStatus.OPEN
  ) {
    return null;
  }

  switch (presentationType) {
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
      if (isEmbed && (groupType === QuestionType.Binary || isContinuousGroup)) {
        const timestamps = getGroupQuestionsTimestamps(questions, {
          withUserTimestamps: !!forecastAvailability.cpRevealsOn,
        });

        const choiceItems = generateChoiceItemsFromGroupQuestions(
          post.group_of_questions,
          {
            activeCount: maxVisibleCheckboxes,
            preselectedQuestionId,
          }
        );

        return (
          <>
            <MultipleChoiceTile
              group={post.group_of_questions}
              groupType={groupType}
              choices={choiceItems}
              visibleChoicesCount={Math.min(
                maxVisibleCheckboxes,
                choiceItems.length
              )}
              hideCP={hideCP}
              timestamps={timestamps}
              actualCloseTime={getPostDrivenTime(refCloseTime)}
              openTime={getPostDrivenTime(open_time)}
              forecastAvailability={forecastAvailability}
              canPredict={false}
              showChart
              chartHeight={embedChartHeight}
              scaling={groupScaling}
              onLegendHeightChange={onLegendHeightChange}
              chartTheme={chartTheme}
              yLabel={commonUnit ?? undefined}
              onCursorChange={handleCursorChange}
              defaultChartZoom={defaultZoom}
            />
            {hideCP && <RevealCPButton />}
          </>
        );
      }

      return (
        <>
          <GroupTimeline
            group={post.group_of_questions}
            actualCloseTime={getPostDrivenTime(refCloseTime)}
            openTime={getPostDrivenTime(open_time)}
            isClosed={status === PostStatus.CLOSED}
            preselectedQuestionId={preselectedQuestionId}
            hideCP={hideCP}
            className={className}
            prioritizeOpen={prioritizeOpenSubquestions}
            embedMode={isEmbed}
            chartHeight={embedChartHeight}
            chartTheme={chartTheme}
            defaultZoom={defaultZoom}
          />
          {hideCP && <RevealCPButton />}
        </>
      );
    }
    case GroupOfQuestionsGraphType.FanGraph:
      return (
        <>
          <FanChart
            group={post.group_of_questions}
            hideCP={hideCP}
            withTooltip
            height={embedChartHeight}
            isEmbedded={isEmbed}
            onLegendHeightChange={onLegendHeightChange}
          />
          {hideCP && <RevealCPButton />}
        </>
      );
    default:
      return null;
  }
};

export default DetailedGroupCard;
