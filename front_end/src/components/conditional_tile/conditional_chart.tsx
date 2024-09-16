import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useMemo } from "react";
import { VictoryThemeDefinition } from "victory";

import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import PredictionChip from "@/components/prediction_chip";
import ProgressBar from "@/components/ui/progress_bar";
import { ContinuousAreaType } from "@/types/charts";
import { PostStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import {
  extractPrevNumericForecastValue,
  formatPrediction,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { cdfToPmf } from "@/utils/math";

type Props = {
  parentResolved: boolean;
  question: QuestionWithForecasts;
  parentStatus: PostStatus;
  disabled: boolean;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
};

const ConditionalChart: FC<Props> = ({
  question,
  parentResolved,
  parentStatus,
  disabled,
  chartTheme,
}) => {
  const resolved = parentResolved && question.resolution !== null;
  const aggregate = question.aggregations.recency_weighted;
  const userForecasts = question.my_forecasts;

  switch (question.type) {
    case QuestionType.Binary: {
      const pctCandidate = aggregate.latest?.centers![0];
      const pct = pctCandidate ? Math.round(pctCandidate * 100) : null;
      const userForecast = userForecasts?.latest?.forecast_values[1];
      const userPct = userForecast ? Math.round(userForecast * 100) : null;

      return (
        <>
          <ProgressBar
            userForecast={userPct}
            value={pct}
            disabled={disabled}
            renderLabel={(value) => {
              if (value === null) {
                return (
                  <div className="justify-center p-0 font-normal">
                    No data yet
                  </div>
                );
              }

              return (
                <div className="flex items-center gap-1 pl-1">
                  <FontAwesomeIcon icon={faUserGroup} size="sm" /> {`${value}%`}
                </div>
              );
            }}
          />
          {resolved && (
            <PredictionChip
              question={question}
              status={parentStatus}
              prediction={pctCandidate}
              size="compact"
            />
          )}
        </>
      );
    }
    case QuestionType.Numeric:
    case QuestionType.Date: {
      if (aggregate.history.length === 0) {
        return <div className="text-center text-xs">No data yet</div>;
      }

      const prediction = aggregate.latest?.centers![0];
      const formattedPrediction = prediction
        ? formatPrediction(prediction, question.type)
        : "";

      const continuousAreaChartData = [
        {
          pmf: cdfToPmf(aggregate.latest!.forecast_values),
          cdf: aggregate.latest!.forecast_values,
          type: "community" as ContinuousAreaType,
        },
      ];
      const prevForecast = userForecasts?.latest?.slider_values;
      const prevForecastValue = extractPrevNumericForecastValue(prevForecast);
      const dataset =
        prevForecastValue?.forecast && prevForecastValue?.weights
          ? getNumericForecastDataset(
              prevForecastValue.forecast,
              prevForecastValue.weights,
              question.open_lower_bound!,
              question.open_upper_bound!
            )
          : null;

      if (!!dataset) {
        continuousAreaChartData.push({
          pmf: dataset.pmf,
          cdf: dataset.cdf,
          type: "user" as ContinuousAreaType,
        });
      }

      return (
        <>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold leading-none text-olive-700 dark:text-olive-700-dark">
              <div>
                <FontAwesomeIcon icon={faUserGroup} size="sm" />
              </div>
              <span>{formattedPrediction}</span>
            </div>
            <ContinuousAreaChart
              height={40}
              scaling={question.scaling}
              data={continuousAreaChartData}
              extraTheme={chartTheme}
              questionType={question.type}
              resolution={question.resolution}
            />
          </div>
          {resolved && (
            <PredictionChip
              question={question}
              status={parentStatus}
              prediction={prediction}
              size="compact"
            />
          )}
        </>
      );
    }
    default:
      return null;
  }
};

export default ConditionalChart;
