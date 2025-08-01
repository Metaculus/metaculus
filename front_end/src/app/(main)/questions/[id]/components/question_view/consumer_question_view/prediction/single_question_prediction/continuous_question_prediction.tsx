"use client";

import { useTranslations } from "next-intl";

import { getContinuousAreaChartData } from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import ConsumerContinuousTile from "@/components/consumer_post_card/consumer_question_tile/consumer_continuous_tile";
import { QuestionStatus } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { formatNumberWithUnit } from "@/utils/formatters/number";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";

type Props = {
  question: QuestionWithForecasts;
};

const ContinuousQuestionPrediction: React.FC<Props> = ({ question }) => {
  const continuousAreaChartData = getContinuousAreaChartData({
    question,
    isClosed: question.status === QuestionStatus.CLOSED,
  });

  return (
    <div className="mx-auto mb-7 flex max-w-[270px] flex-col items-center gap-2.5">
      <ConsumerContinuousTile
        question={question}
        forecastAvailability={getQuestionForecastAvailability(question)}
      />
      <MinifiedContinuousAreaChart
        question={question}
        data={continuousAreaChartData}
        height={50}
        forceTickCount={2}
      />
      <ContinuousQuestionRange question={question} />
    </div>
  );
};

const ContinuousQuestionRange: React.FC<{
  question: QuestionWithForecasts;
}> = ({ question }) => {
  const t = useTranslations();
  if (
    question.status === QuestionStatus.RESOLVED ||
    question.status === QuestionStatus.UPCOMING
  ) {
    return null;
  }

  const lowest = question.scaling?.range_min ?? 0;
  const highest = question.scaling?.range_max ?? 0;
  const unit = question.unit || "";

  const labelClassName = cn(
    question.status === QuestionStatus.CLOSED
      ? "text-gray-800 dark:text-gray-800-dark"
      : "text-olive-800 dark:text-olive-800-dark"
  );
  return (
    <div className="flex w-full flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
      <p className="m-0 flex justify-between">
        {t("lowest")}:{" "}
        <span className={labelClassName}>
          {formatNumberWithUnit(lowest, unit)}
        </span>
      </p>
      <p className="m-0 flex justify-between">
        {t("highest")}:{" "}
        <span className={labelClassName}>
          {formatNumberWithUnit(highest, unit)}
        </span>
      </p>
    </div>
  );
};

export default ContinuousQuestionPrediction;
