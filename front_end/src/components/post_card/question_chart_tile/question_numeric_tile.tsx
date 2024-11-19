import { useTranslations } from "next-intl";
import { FC } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import NumericChart from "@/components/charts/numeric_chart";
import PredictionChip from "@/components/prediction_chip";
import LocalDaytime from "@/components/ui/local_daytime";
import { ContinuousAreaType, TimelineChartZoomOption } from "@/types/charts";
import { PostStatus, QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts, QuestionType } from "@/types/question";
import { getNumericChartTypeFromQuestion } from "@/utils/charts";
import { cdfToPmf } from "@/utils/math";

const HEIGHT = 100;

type Props = {
  question: QuestionWithNumericForecasts;
  curationStatus: PostStatus | QuestionStatus;
  defaultChartZoom?: TimelineChartZoomOption;
  hideCP?: boolean;
  forecasters?: number;
  isCPRevealed?: boolean;
};

const QuestionNumericTile: FC<Props> = ({
  question,
  curationStatus,
  defaultChartZoom,
  hideCP,
  forecasters,
  isCPRevealed,
}) => {
  const t = useTranslations();
  const latest = question.aggregations.recency_weighted.latest;
  const prediction = latest?.centers![0];

  const continuousAreaChartData = [];
  if (latest) {
    continuousAreaChartData.push({
      pmf: cdfToPmf(latest.forecast_values),
      cdf: latest.forecast_values,
      type: "community" as ContinuousAreaType,
    });
  }

  const userForecast = question.my_forecasts?.latest;
  if (!!userForecast) {
    continuousAreaChartData.push({
      pmf: cdfToPmf(userForecast.forecast_values),
      cdf: userForecast.forecast_values,
      type: "user" as ContinuousAreaType,
    });
  }

  return (
    <div className="flex justify-between">
      <div className="mr-3 inline-flex flex-col justify-center gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
        <PredictionChip
          question={question}
          prediction={prediction}
          status={curationStatus as PostStatus}
          showUserForecast
          hideCP={hideCP}
        />

        <ForecastersCounter forecasters={forecasters} className="p-1" />
      </div>
      <div className="relative my-1 h-24 w-2/3 min-w-24 max-w-[500px] flex-1 overflow-visible">
        {question.type === QuestionType.Binary ? (
          <NumericChart
            aggregation={question.aggregations.recency_weighted}
            myForecasts={question.my_forecasts}
            height={HEIGHT}
            questionType={
              getNumericChartTypeFromQuestion(question.type) ??
              QuestionType.Numeric
            }
            actualCloseTime={
              question.actual_close_time
                ? new Date(question.actual_close_time).getTime()
                : null
            }
            scaling={question.scaling}
            defaultZoom={defaultChartZoom}
            resolution={question.resolution}
            resolveTime={question.actual_resolve_time}
            hideCP={hideCP}
            isCPRevealed={isCPRevealed}
            openTime={
              question.open_time
                ? new Date(question.open_time).getTime()
                : undefined
            }
          />
        ) : (
          <ContinuousAreaChart
            scaling={question.scaling}
            data={continuousAreaChartData}
            height={HEIGHT}
            questionType={question.type}
            resolution={question.resolution}
            hideCP={hideCP}
          />
        )}
        {!isCPRevealed && question.cp_reveal_time && (
          <div className="absolute inset-0 flex items-center justify-center pl-3 text-center text-sm">
            <p>
              {t("cpWillRevealOn")}{" "}
              <LocalDaytime date={question.cp_reveal_time} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionNumericTile;
