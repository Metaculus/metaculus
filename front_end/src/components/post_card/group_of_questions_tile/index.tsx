"use client";
import { FC } from "react";

import MultipleChoiceTile from "@/components/multiple_choice_tile";
import GroupNumericTile from "@/components/post_card/group_of_questions_tile/group_numeric_tile";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostWithForecasts, PostStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  generateChoiceItemsFromBinaryGroup,
  getGroupQuestionsTimestamps,
} from "@/utils/charts";
import {
  generateUserForecasts,
  sortGroupPredictionOptions,
} from "@/utils/questions";

type Props = {
  questions: QuestionWithForecasts[];
  curationStatus: PostStatus;
  post: PostWithForecasts;
};

const GroupOfQuestionsTile: FC<Props> = ({
  questions,
  curationStatus,
  post,
}) => {
  const { user } = useAuth();
  const tileType = questions.at(0)?.type;

  if (!tileType) {
    return <div>Forecasts data is empty</div>;
  }

  switch (tileType) {
    case QuestionType.Binary: {
      const visibleChoicesCount = 3;
      const sortedQuestions = sortGroupPredictionOptions(
        questions as QuestionWithNumericForecasts[]
      );
      const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
      const choices = generateChoiceItemsFromBinaryGroup(sortedQuestions, {
        activeCount: visibleChoicesCount,
      });
      return (
        <MultipleChoiceTile
          choices={choices}
          timestamps={timestamps}
          visibleChoicesCount={visibleChoicesCount}
          defaultChartZoom={
            user
              ? TimelineChartZoomOption.All
              : TimelineChartZoomOption.TwoMonths
          }
          userForecasts={
            user
              ? generateUserForecasts(
                  sortedQuestions as QuestionWithNumericForecasts[]
                )
              : undefined
          }
        />
      );
    }
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <GroupNumericTile
          questions={questions as QuestionWithNumericForecasts[]}
          curationStatus={curationStatus}
          post={post}
        />
      );
    default:
      return null;
  }
};

export default GroupOfQuestionsTile;
