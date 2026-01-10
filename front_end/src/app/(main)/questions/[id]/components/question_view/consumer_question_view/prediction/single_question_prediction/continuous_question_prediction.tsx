"use client";

import { getContinuousAreaChartData } from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import ConsumerContinuousTile from "@/components/consumer_post_card/consumer_question_tile/consumer_continuous_tile";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";

type Props = {
  question: QuestionWithNumericForecasts;
};

const ContinuousQuestionPrediction: React.FC<Props> = ({ question }) => {
  const forecastAvailability = getQuestionForecastAvailability(question);

  // Hide chart if no forecasts or CP not yet revealed
  const shouldHideChart =
    forecastAvailability.isEmpty || !!forecastAvailability.cpRevealsOn;

  const continuousAreaChartData = getContinuousAreaChartData({
    question,
    isClosed: question.status === QuestionStatus.CLOSED,
  });

  return (
    <div className="mx-auto mb-7 flex max-w-[340px] flex-col items-center gap-2.5">
      <ConsumerContinuousTile
        question={question}
        forecastAvailability={forecastAvailability}
        variant="question"
      />
      {!shouldHideChart && (
        <>
          <div className="w-full overflow-visible pb-1 pt-4 md:pb-4">
            <div className="origin-center scale-125 transform-gpu md:scale-150">
              <MinifiedContinuousAreaChart
                question={question}
                data={continuousAreaChartData}
                height={50}
                forceTickCount={2}
                variant="question"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContinuousQuestionPrediction;
