import { FC } from "react";

import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { PostWithForecasts } from "@/types/post";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import { sortGroupPredictionOptions } from "@/utils/questions";
import ContinuousGroupTimeline from "./continuous_group_timeline";
import BinaryGroupChart from "./detailed_group_card/binary_group_chart";
import { GroupOfQuestionsGraphType } from "@/types/charts";

type Props = {
  post: PostWithForecasts;
  preselectedQuestionId?: number;
};

const ForecastTimelineDrawer: FC<Props> = ({ post, preselectedQuestionId }) => {
  const questions = post.group_of_questions
    ?.questions as QuestionWithNumericForecasts[];
  const groupType = questions?.at(0)?.type;

  if (
    !groupType ||
    post.group_of_questions?.graph_type ===
      GroupOfQuestionsGraphType.MultipleChoiceGraph
  ) {
    return null;
  }

  const sortedQuestions = sortGroupPredictionOptions(
    questions as QuestionWithNumericForecasts[]
  );
  const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
  const isClosed = post.actual_close_time
    ? new Date(post.actual_close_time).getTime() < Date.now()
    : false;

  switch (groupType) {
    case QuestionType.Binary: {
      return (
        <BinaryGroupChart
          actualCloseTime={
            post.actual_close_time
              ? new Date(post.actual_close_time).getTime()
              : null
          }
          questions={sortedQuestions}
          timestamps={timestamps}
          preselectedQuestionId={preselectedQuestionId}
          isClosed={isClosed}
        />
      );
    }
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <ContinuousGroupTimeline
          actualCloseTime={
            post.actual_close_time
              ? new Date(post.actual_close_time).getTime()
              : null
          }
          questions={sortedQuestions}
          timestamps={timestamps}
          isClosed={isClosed}
        />
      );
  }
};

export default ForecastTimelineDrawer;
