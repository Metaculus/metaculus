import React, { FC } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import ParticipationSummary from "./participation_summary";
import ResolutionScoreCards from "./resolution_score_cards";

type Props = {
  post: PostWithForecasts;
  isConsumerView?: boolean;
  noSectionWrapper?: boolean;
  hideParticipation?: boolean;
};

const SingleQuestionScoreData: FC<Props> = ({
  post,
  isConsumerView,
  noSectionWrapper,
  hideParticipation,
}) => {
  const { question, status, nr_forecasters } = post;

  if (!question) return null;

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
      {!hideParticipation && question.type != QuestionType.MultipleChoice && (
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

export default SingleQuestionScoreData;
