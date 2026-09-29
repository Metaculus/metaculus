import { BasicQuestionContent } from "@/app/(main)/labor-hub/components/question_cards/basic_question";
import { QuestionCard } from "@/app/(main)/labor-hub/components/question_cards/question_card";
import { GroupTimelineMarker } from "@/components/charts/primitives/timeline_markers/types";
import { PostWithForecasts } from "@/types/post";

import { ChartHeadline } from "./chart_headline";
import { GHM_VALUES, GhmValueKey, ValueRef } from "../../config/questions";

const CHART_HEIGHT = 240;

export function LinkedTimelineChart({
  post,
  valueKey,
  markers,
  activeMarkerId,
}: {
  post: PostWithForecasts;
  valueKey: GhmValueKey;
  markers: GroupTimelineMarker[];
  activeMarkerId: string;
}) {
  const ref: ValueRef = GHM_VALUES[valueKey];

  return (
    <QuestionCard
      title={post.title}
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
        timelineMarkers={markers}
        activeTimelineMarkerId={activeMarkerId}
      />
    </QuestionCard>
  );
}
