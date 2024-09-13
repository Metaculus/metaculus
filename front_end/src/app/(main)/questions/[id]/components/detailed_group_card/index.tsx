import { FC } from "react";

import NumericGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/numeric_group_chart";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";
import { sortGroupPredictionOptions } from "@/utils/questions";

import BinaryGroupChart from "./binary_group_chart";
import ContinuousGroupTimeline from "../continuous_group_timeline";
import { GroupOfQuestionsGraphType } from "@/types/charts";

type Props = {
  questions: QuestionWithForecasts[];
  graphType: string;
  preselectedQuestionId?: number;
  isClosed?: boolean;
  actualCloseTime: string | null;
};

const DetailedGroupCard: FC<Props> = ({
  questions,
  preselectedQuestionId,
  isClosed,
  graphType,
  actualCloseTime,
}) => {
  const groupType = questions.at(0)?.type;

  if (!groupType) {
    return <div>Forecasts data is empty</div>;
  }

  switch (graphType) {
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
      const sortedQuestions = sortGroupPredictionOptions(
        questions as QuestionWithNumericForecasts[]
      );
      const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
      switch (groupType) {
        case QuestionType.Binary: {
          return (
            <BinaryGroupChart
              actualCloseTime={
                actualCloseTime ? new Date(actualCloseTime).getTime() : null
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
                actualCloseTime ? new Date(actualCloseTime).getTime() : null
              }
              questions={sortedQuestions}
              timestamps={timestamps}
              isClosed={isClosed}
            />
          );
      }
    }
    case GroupOfQuestionsGraphType.FanGraph:
      return (
        <NumericGroupChart
          questions={questions as QuestionWithNumericForecasts[]}
        />
      );
    default:
      return null;
  }
};

export default DetailedGroupCard;
