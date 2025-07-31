import { QuestionType, QuestionWithForecasts } from "@/types/question";

import BinaryQuestionPrediction from "./binary_question_prediction";
import ContinuousQuestionPrediction from "./continuous_question_prediction";

type Props = {
  question: QuestionWithForecasts;
  canPredict: boolean;
};

const SingleQuestionPrediction: React.FC<Props> = ({
  question,
  canPredict,
}) => {
  switch (question.type) {
    case QuestionType.Binary:
      return (
        <BinaryQuestionPrediction question={question} canPredict={canPredict} />
      );
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      return <ContinuousQuestionPrediction question={question} />;
    default:
      return null;
  }
};

export default SingleQuestionPrediction;
