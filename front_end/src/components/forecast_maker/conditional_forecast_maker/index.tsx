import { FC } from "react";

import { PostConditional } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

type Props = {
  conditional: PostConditional<QuestionWithForecasts>;
};

const ConditionalForecastMaker: FC<Props> = ({ conditional }) => {
  const { question_yes, question_no } = conditional;
  if (question_yes.type !== question_no.type) {
    return null;
  }

  switch (question_yes.type) {
    case QuestionType.Binary:
      return <>Binary picker</>;
    case QuestionType.Date:
    case QuestionType.Numeric:
      return <>TODO: numeric picker</>;
    default:
      return null;
  }
};

export default ConditionalForecastMaker;
