import { FC } from "react";

import { getContinuousAreaChartData } from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import { QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";

import ConsumerBinaryTile from "./consumer_binary_tile";
import ConsumerContinuousTile from "./consumer_continuous_tile";
type Props = {
  question: QuestionWithForecasts;
};

const ConsumerQuestionTile: FC<Props> = ({ question }) => {
  const forecastAvailability = getQuestionForecastAvailability(question);

  // Hide chart if no forecasts or CP not yet revealed
  const shouldHideChart =
    forecastAvailability.isEmpty || !!forecastAvailability.cpRevealsOn;

  // Open/Closed - delegate to specific tile components based on question type
  switch (question.type) {
    case QuestionType.Binary:
      return (
        <ConsumerBinaryTile
          question={question}
          forecastAvailability={forecastAvailability}
        />
      );
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      const continuousAreaChartData = getContinuousAreaChartData({
        question,
        isClosed: question.status === QuestionStatus.CLOSED,
      });
      return (
        <div className="flex flex-col gap-2.5">
          <ConsumerContinuousTile
            question={question}
            forecastAvailability={forecastAvailability}
          />
          {!shouldHideChart && (
            <MinifiedContinuousAreaChart
              question={question}
              data={continuousAreaChartData}
              height={50}
              forceTickCount={2}
              variant="feed"
            />
          )}
        </div>
      );
    default:
      return null;
  }
};

export default ConsumerQuestionTile;
