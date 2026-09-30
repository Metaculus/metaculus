import { BasicQuestionContent } from "@/app/(main)/labor-hub/components/question_cards/basic_question";
import { QuestionCard } from "@/app/(main)/labor-hub/components/question_cards/question_card";
import { PostWithForecasts } from "@/types/post";

import { ChartHeadline } from "./chart_headline";
import { GHM_VALUES, GhmValueKey, ValueRef } from "../../config/questions";

const CHART_HEIGHT = 310;

export function LinkedTimelineChart({
  post,
  valueKey,
}: {
  post: PostWithForecasts;
  valueKey: GhmValueKey;
}) {
  const ref: ValueRef = GHM_VALUES[valueKey];

  return (
    <QuestionCard
      title={post.short_title || post.title}
      variant="primary"
      postIds={[post.id]}
      subheader={<ChartHeadline valueKey={valueKey} />}
      className="border border-blue-400 dark:border-blue-400-dark"
    >
      <BasicQuestionContent
        postData={post}
        preferTimeline
        subQuestionId={ref.subQuestionId}
        chartHeight={CHART_HEIGHT}
      />
    </QuestionCard>
  );
}
