"use client";

import ConditionalTimeline from "@/components/conditional_timeline";
import NumericForecastCard from "@/components/consumer_post_card/group_forecast_card/numeric_forecast_card";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { KeyFactor } from "@/types/comment";
import {
  GroupOfQuestionsGraphType,
  PostWithForecasts,
  QuestionStatus,
} from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  checkGroupOfQuestionsPostType,
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { useListChartExpanded } from "../consumer_list_chart_shell";

type Props = {
  postData: PostWithForecasts;
  className?: string;
  hideTitle?: boolean;
  keyFactors?: KeyFactor[];
  isConsumerView?: boolean;
  preselectedGroupQuestionId?: number;
};

const QuestionTimeline: React.FC<Props> = ({
  postData,
  className,
  hideTitle,
  keyFactors,
  isConsumerView = true,
  preselectedGroupQuestionId,
}) => {
  const { chartAreaHeight, setCursorTimestamp } = useListChartExpanded();
  const isFanGraph =
    postData.group_of_questions?.graph_type ===
    GroupOfQuestionsGraphType.FanGraph;
  const inShell = chartAreaHeight > 0;

  const wrapperClass = cn(
    inShell ? "" : isFanGraph ? "mb-8" : "mt-8",
    className
  );
  const embedHeight = inShell ? Math.max(80, chartAreaHeight - 44) : undefined;

  if (isConditionalPost(postData)) {
    return (
      <div className={cn("mt-8", className)}>
        <ConditionalTimeline post={postData} />
      </div>
    );
  }

  if (isQuestionPost(postData)) {
    if (postData.question.status !== QuestionStatus.UPCOMING) {
      return (
        <div className={wrapperClass}>
          <DetailedQuestionCard
            post={postData}
            hideTitle={hideTitle}
            isConsumerView={isConsumerView}
            keyFactors={keyFactors}
            embedChartHeight={embedHeight}
          />
        </div>
      );
    }
    return null;
  }

  if (isGroupOfQuestionsPost(postData)) {
    const isDateType = checkGroupOfQuestionsPostType(
      postData,
      QuestionType.Date
    );

    return (
      <div className={wrapperClass}>
        {isDateType ? (
          <div className="flex flex-col gap-6">
            <DetailedGroupCard
              post={postData}
              preselectedQuestionId={preselectedGroupQuestionId}
            />
            <NumericForecastCard post={postData} borderOnly />
          </div>
        ) : isFanGraph ? (
          <div className="flex flex-col gap-6">
            <DetailedGroupCard
              post={postData}
              preselectedQuestionId={preselectedGroupQuestionId}
              groupPresentationOverride={
                GroupOfQuestionsGraphType.MultipleChoiceGraph
              }
            />
            <DetailedGroupCard
              post={postData}
              preselectedQuestionId={preselectedGroupQuestionId}
            />
          </div>
        ) : (
          <DetailedGroupCard
            post={postData}
            preselectedQuestionId={preselectedGroupQuestionId}
            withLegend={!isConsumerView}
            embedChartHeight={embedHeight}
            onCursorChange={isConsumerView ? setCursorTimestamp : undefined}
            hideTooltip={isConsumerView}
          />
        )}
      </div>
    );
  }

  return null;
};

export function hasTimeline(postData: PostWithForecasts): boolean {
  if (isConditionalPost(postData)) {
    return true;
  }
  if (isQuestionPost(postData)) {
    return postData.question.status !== QuestionStatus.UPCOMING;
  }
  if (isGroupOfQuestionsPost(postData)) {
    return true;
  }
  return false;
}

export default QuestionTimeline;
