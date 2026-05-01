import React, { FC } from "react";

import ForecastMaker from "@/components/forecast_maker";
import BackgroundInfo from "@/components/question/background_info";
import ResolutionCriteria from "@/components/question/resolution_criteria";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { isContinuousQuestion } from "@/utils/questions/helpers";

import ParticipationSummarySection from "./participation_summary";
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
  const { question, nr_forecasters } = post;

  if (!question) return null;

  if (isConsumerView) {
    return (
      <div className="flex flex-col gap-4">
        {question.type !== QuestionType.MultipleChoice && (
          <ParticipationSummarySection
            question={question}
            forecastsCount={post.forecasts_count ?? 0}
            forecastersCount={nr_forecasters}
          />
        )}
        <ResolutionScoreCards
          post={post}
          isConsumerView={isConsumerView}
          noSectionWrapper={noSectionWrapper}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!hideParticipation && question.type != QuestionType.MultipleChoice && (
        <ParticipationSummarySection
          question={question}
          forecastsCount={post.forecasts_count ?? 0}
          forecastersCount={nr_forecasters}
        />
      )}
      <ResolutionScoreCards post={post} />
      {isContinuousQuestion(question) && <ForecastMaker post={post} />}
      <ResolutionCriteria post={post} defaultOpen />
      <BackgroundInfo post={post} defaultOpen />
    </div>
  );
};

export default SingleQuestionScoreData;
