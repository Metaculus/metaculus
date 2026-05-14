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
};

const ConsumerGroupChart: FC<Props> = ({ post, preselectedQuestionId }) => {
  const { hoveredChoiceName, setHoveredChoiceName } = useListChartExpanded();
  const { open_time, actual_close_time, scheduled_close_time, status } = post;
  const refCloseTime = actual_close_time ?? scheduled_close_time;

  return (
    <div onMouseLeave={() => setHoveredChoiceName(null)}>
      <GroupTimeline
        group={post.group_of_questions}
        actualCloseTime={getPostDrivenTime(refCloseTime)}
        openTime={getPostDrivenTime(open_time)}
        isClosed={status === PostStatus.CLOSED}
        preselectedQuestionId={preselectedQuestionId}
        withLegend={false}
        withHighlightArea={false}
        withHighlightEndpoint
        externalHighlightedChoice={hoveredChoiceName}
      />
    </div>
  );
};

export default ConsumerGroupChart;
