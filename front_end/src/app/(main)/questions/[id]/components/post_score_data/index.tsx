import React, { FC } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { isGroupOfQuestionsPost } from "@/utils/questions/helpers";

import GroupResolutionScores from "./group_resolution_scores";
import ParticipationSummary from "./participation_summary";
import ResolutionScoreCards from "./resolution_score_cards";

type Props = {
  post: PostWithForecasts;
  isConsumerView?: boolean;
  noSectionWrapper?: boolean;
};

const PostScoreData: FC<Props> = ({
  post,
  isConsumerView,
  noSectionWrapper,
}) => {
  const { question, status, nr_forecasters } = post;

  if (!question && !isGroupOfQuestionsPost(post)) return null;

  const isGroup = isGroupOfQuestionsPost(post);

  if (isGroup) {
    return <GroupResolutionScores post={post} />;
  }

  const isResolved = status === PostStatus.RESOLVED;

  if (!isResolved) return null;

  if (isConsumerView) {
    return (
      <ResolutionScoreCards
        post={post}
        isConsumerView={isConsumerView}
        noSectionWrapper={noSectionWrapper}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {question && question.type != QuestionType.MultipleChoice && (
        <ParticipationSummary
          question={question}
          forecastsCount={post.forecasts_count ?? 0}
          forecastersCount={nr_forecasters}
        />
      )}
      <ResolutionScoreCards post={post} />
    </div>
  );
};

export default PostScoreData;
