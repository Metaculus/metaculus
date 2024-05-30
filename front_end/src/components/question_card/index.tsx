import { FC } from "react";

import BasicQuestionCard from "@/components/question_card/basic_card";
import QuestionChartTile from "@/components/question_card/chart_tile";
import QuestionCardErrorBoundary from "@/components/question_card/error_boundary";
import { QuestionWithForecasts } from "@/types/question";

type Props = {
  question: QuestionWithForecasts;
};

const QuestionCard: FC<Props> = ({ question }) => {
  return (
    <QuestionCardErrorBoundary>
      <BasicQuestionCard question={question}>
        <div className="mb-0.5 pt-1.5">
          <QuestionChartTile question={question} />
        </div>
      </BasicQuestionCard>
    </QuestionCardErrorBoundary>
  );
};

export default QuestionCard;
