import { FC } from "react";

import BasicQuestionCard from "@/components/question_card/basic_card";
import { QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
};

const QuestionCard: FC<Props> = ({ question }) => {
  return (
    <BasicQuestionCard question={question}>
      TODO: render type-related data
    </BasicQuestionCard>
  );
};

export default QuestionCard;
