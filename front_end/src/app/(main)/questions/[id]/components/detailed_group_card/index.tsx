import { FC } from "react";

import NumericGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/numeric_group_chart";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";

import BinaryGroupChart from "./binary_group_chart";

type Props = {
  questions: QuestionWithForecasts[];
};

const DetailedGroupCard: FC<Props> = ({ questions }) => {
  const groupType = questions.at(0)?.type;

  if (!groupType) {
    return <div>Forecasts data is empty</div>;
  }

  switch (groupType) {
    case QuestionType.Binary: {
      const timestamps = getGroupQuestionsTimestamps(
        questions as QuestionWithNumericForecasts[]
      );

      return (
        <BinaryGroupChart
          questions={questions as QuestionWithNumericForecasts[]}
          timestamps={timestamps}
        />
      );
    }
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <NumericGroupChart
          questions={questions as QuestionWithNumericForecasts[]}
        />
      );
  }
};

export default DetailedGroupCard;
