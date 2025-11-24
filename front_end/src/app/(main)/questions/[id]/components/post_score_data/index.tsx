import React, { FC } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

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
  let effectivePost = post;

  if (isConditionalPost(post)) {
    const { condition, question_yes, question_no } = post.conditional;
    if (condition.resolution === "yes") {
      effectivePost = {
        ...post,
        question: question_yes,
        conditional: undefined,
      } as unknown as PostWithForecasts;
    } else if (condition.resolution === "no") {
      effectivePost = {
        ...post,
        question: question_no,
        conditional: undefined,
      } as unknown as PostWithForecasts;
    }
  }

  const { question, status, nr_forecasters } = effectivePost;

  if (!question && !isGroupOfQuestionsPost(effectivePost)) return null;

  const isGroup = isGroupOfQuestionsPost(effectivePost);

  if (isGroup) {
    return <GroupResolutionScores post={effectivePost} />;
  }

  const isResolved = status === PostStatus.RESOLVED;

  if (!isResolved) return null;

  if (isConsumerView) {
    return (
      <ResolutionScoreCards
        post={effectivePost}
        isConsumerView={isConsumerView}
        noSectionWrapper={noSectionWrapper}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {question &&
        question.type != QuestionType.MultipleChoice &&
        !isConditionalPost(post) && (
          <ParticipationSummary
            question={question}
            forecastsCount={effectivePost.forecasts_count ?? 0}
            forecastersCount={nr_forecasters}
          />
        )}
      <ResolutionScoreCards post={effectivePost} />
    </div>
  );
};

export default PostScoreData;
