import { FC } from "react";

import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { PostWithForecasts } from "@/types/post";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import { sortGroupPredictionOptions } from "@/utils/questions";
import ContinuousGroupTimeline from "./continuous_group_timeline";

type Props = {
  post: PostWithForecasts;
};

const ForecastTimelineDrawer: FC<Props> = ({ post }) => {
  const questions = post.group_of_questions
    ?.questions as QuestionWithNumericForecasts[];
  const groupType = questions?.at(0)?.type;

  if (
    !groupType ||
    ![QuestionType.Numeric, QuestionType.Date].includes(groupType)
  ) {
    return null;
  }

  const sortedQuestions = sortGroupPredictionOptions(
    questions as QuestionWithNumericForecasts[]
  );
  const timestamps = getGroupQuestionsTimestamps(sortedQuestions);

  return (
    <ContinuousGroupTimeline
      questions={sortedQuestions}
      timestamps={timestamps}
    />
  );
};

export default ForecastTimelineDrawer;
