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
  getIsForecastEmpty,
  getNumericForecastDataset,
} from "@/utils/forecasts";

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

  switch (question.type) {
    case QuestionType.Binary: {
      const pctCandidate = question.forecasts?.medians?.at(-1);
      const pct = pctCandidate ? Math.round(pctCandidate * 100) : null;
      const userForecast = question.forecasts?.my_forecasts?.medians?.at(-1);
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
      if (getIsForecastEmpty(question.forecasts)) {
        return <div className="text-center text-xs">No data yet</div>;
      }

      const prediction = question.forecasts.medians.at(-1);
      const formattedPrediction = prediction
        ? formatPrediction(prediction, question.type)
        : "";

      const continuousAreaChartData = [
        {
          pmf: question.forecasts.latest_pmf,
          cdf: question.forecasts.latest_cdf,
          type: "community" as ContinuousAreaType,
        },
      ];
      const prevForecast = question.forecasts.my_forecasts?.slider_values;
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
              rangeMin={question.range_min!}
              rangeMax={question.range_max!}
              zeroPoint={question.zero_point}
              data={continuousAreaChartData}
              extraTheme={chartTheme}
              questionType={question.type}
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
