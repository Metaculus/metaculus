"use client";

import { FC } from "react";

import GroupTimeline from "@/app/(main)/questions/[id]/components/group_timeline";
import { GroupOfQuestionsPost, PostStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getPostDrivenTime } from "@/utils/questions/helpers";

import { useListChartExpanded } from "./consumer_list_chart_shell";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  preselectedQuestionId?: number;
  chartHeight?: number;
  visibleQuestions?: QuestionWithNumericForecasts[];
};

const ConsumerGroupChart: FC<Props> = ({
  post,
  preselectedQuestionId,
  chartHeight,
  visibleQuestions,
}) => {
  const { hoveredChoiceName, setHoveredChoiceName, chartAreaHeight } =
    useListChartExpanded();
  const { open_time, actual_close_time, scheduled_close_time, status } = post;
  const refCloseTime = actual_close_time ?? scheduled_close_time;

  const groupTimelineProps = visibleQuestions
    ? { questions: visibleQuestions }
    : { group: post.group_of_questions };

  // GroupChart renders a ~44px header (title + zoom picker) above the SVG div.
  // Subtract it so header + SVG together fit within chartAreaHeight.
  const CHART_HEADER_HEIGHT = 44;
  const effectiveChartHeight =
    chartAreaHeight > 0
      ? Math.max(80, chartAreaHeight - CHART_HEADER_HEIGHT)
      : chartHeight;

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
      />
    </div>
  );
};

export default ConsumerGroupChart;
