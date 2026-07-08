"use client";

import { FC } from "react";

import GroupTimeline from "@/app/(main)/questions/[id]/components/group_timeline";
import { useHideCP } from "@/contexts/cp_context";
import { GroupOfQuestionsPost, PostStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getPostDrivenTime } from "@/utils/questions/helpers";

import { useListChartExpanded } from "./consumer_list_chart_shell";
import GroupChartViewTabs from "./group_chart_view_tabs";
import { hasSubquestionDistribution } from "./group_distribution_utils";
import GroupDistributionsView from "./group_distributions_view";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  preselectedQuestionId?: number;
  chartHeight?: number;
  visibleQuestions?: QuestionWithNumericForecasts[];
  // Suppress the internal Timeline/Distributions switcher when a parent (the
  // fan-graph panel) owns the tab bar.
  hideViewTabs?: boolean;
};

const ConsumerGroupChart: FC<Props> = ({
  post,
  preselectedQuestionId,
  chartHeight,
  visibleQuestions,
  hideViewTabs = false,
}) => {
  const { hideCP } = useHideCP();
  const {
    hoveredChoiceName,
    setHoveredChoiceName,
    chartAreaHeight,
    setCursorTimestamp,
    viewMode,
    setViewMode,
  } = useListChartExpanded();
  const { open_time, actual_close_time, scheduled_close_time, status } = post;
  const refCloseTime = actual_close_time ?? scheduled_close_time;

  const groupTimelineProps = visibleQuestions
    ? { questions: visibleQuestions }
    : { group: post.group_of_questions };

  const canShowDistributions = (
    visibleQuestions ??
    post.group_of_questions?.questions ??
    []
  ).some(hasSubquestionDistribution);

  // GroupChart renders a ~44px header (title + zoom picker) above the SVG div.
  // Subtract it so header + SVG together fit within chartAreaHeight.
  const CHART_HEADER_HEIGHT = 44;
  const effectiveChartHeight =
    chartAreaHeight > 0
      ? Math.max(80, chartAreaHeight - CHART_HEADER_HEIGHT)
      : chartHeight;

  // When CP is hidden, or nothing has a distribution, we keep the plain timeline
  // and hide the view switcher.
  if (!hideCP && canShowDistributions && viewMode === "distributions") {
    return (
      <GroupDistributionsView
        post={post}
        visibleQuestions={visibleQuestions}
        height={effectiveChartHeight}
        hideViewTabs={hideViewTabs}
      />
    );
  }

  return (
    <div onMouseLeave={() => setHoveredChoiceName(null)}>
      <GroupTimeline
        {...groupTimelineProps}
        actualCloseTime={getPostDrivenTime(refCloseTime)}
        openTime={getPostDrivenTime(open_time)}
        isClosed={status === PostStatus.CLOSED}
        preselectedQuestionId={preselectedQuestionId}
        withLegend={false}
        withHighlightArea={false}
        externalHighlightedChoice={hoveredChoiceName}
        chartHeight={effectiveChartHeight}
        onCursorChange={setCursorTimestamp}
        hideTooltip
        headerLeft={
          hideCP || hideViewTabs || !canShowDistributions ? undefined : (
            <GroupChartViewTabs value={viewMode} onChange={setViewMode} />
          )
        }
      />
    </div>
  );
};

export default ConsumerGroupChart;
