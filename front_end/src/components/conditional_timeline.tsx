import { FC } from "react";

import BinaryGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/binary_group_chart";
import NumericGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/numeric_group_chart";
import { PostConditional } from "@/types/post";
import {
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts";

type Props = {
  conditional: PostConditional<QuestionWithNumericForecasts>;
};

const ConditionalTimeline: FC<Props> = ({ conditional }) => {
  const groupType = conditional.question_no.type;
  const questions = [conditional.question_yes, conditional.question_no];

  switch (groupType) {
    case QuestionType.Binary: {
      const timestamps = getGroupQuestionsTimestamps(questions);
      return <BinaryGroupChart questions={questions} timestamps={timestamps} />;
    }
    case QuestionType.Numeric:
    case QuestionType.Date:
      return <NumericGroupChart questions={questions} />;
  }
};

export default ConditionalTimeline;
