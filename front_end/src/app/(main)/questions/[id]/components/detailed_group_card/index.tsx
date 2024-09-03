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

type Props = {
  questions: QuestionWithForecasts[];
  graphType: string;
  preselectedQuestionId?: number;
  isClosed?: boolean;
};

const DetailedGroupCard: FC<Props> = ({
  questions,
  preselectedQuestionId,
  isClosed,
  graphType,
}) => {
  const groupType = questions.at(0)?.type;

  if (!groupType) {
    return <div>Forecasts data is empty</div>;
  }

  switch (graphType) {
    case "multiple_choice_graph": {
      const sortedQuestions = sortGroupPredictionOptions(
        questions as QuestionWithNumericForecasts[]
      );
      const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
      switch (groupType) {
        case QuestionType.Binary: {
          return (
            <BinaryGroupChart
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
              questions={sortedQuestions}
              timestamps={timestamps}
              isClosed={isClosed}
            />
          );
      }
    }
    default:
      return (
        <NumericGroupChart
          questions={questions as QuestionWithNumericForecasts[]}
        />
      );
  }
};

export default DetailedGroupCard;
