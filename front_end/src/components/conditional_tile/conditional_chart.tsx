import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { VictoryThemeDefinition } from "victory";

import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import PredictionChip from "@/components/prediction_chip";
import ProgressBar from "@/components/ui/progress_bar";
import { ContinuousAreaType } from "@/types/charts";
import { PostStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import {
  extractPrevNumericForecastValue,
  getSliderNumericForecastDataset,
  getQuantileNumericForecastDataset,
  isQuantileForecast,
  isSliderForecast,
} from "@/utils/forecasts";
import { cdfToPmf } from "@/utils/math";
import { getQuestionForecastAvailability } from "@/utils/questions";

import CPRevealTime from "../cp_reveal_time";

type Props = {
  question: QuestionWithForecasts;
  disabled: boolean;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  hideCP?: boolean;
};

const ConditionalChart: FC<Props> = ({
  question,
  disabled,
  chartTheme,
  hideCP,
}) => {
  const t = useTranslations();

  const resolved = question.resolution !== null;
  const aggregate = question.aggregations.recency_weighted;
  const aggregateLatest = aggregate.latest;
  const userLatest = question.my_forecasts?.latest;

  const forecastAvailability = getQuestionForecastAvailability(question);
  if (forecastAvailability.cpRevealsOn) {
    return (
      <CPRevealTime
        className="!relative text-xs"
        cpRevealTime={forecastAvailability.cpRevealsOn}
      />
    );
  }

  if (forecastAvailability.isEmpty) {
    return <div className="text-xs">{t("noForecastsYet")}</div>;
  }

  switch (question.type) {
    case QuestionType.Binary: {
      const pctCandidate =
        aggregateLatest && !aggregateLatest.end_time
          ? aggregateLatest.centers?.[0]
          : undefined;
      const pct = pctCandidate ? Math.round(pctCandidate * 100) : null;
      const userForecast =
        userLatest && !userLatest.end_time
          ? userLatest.forecast_values[1]
          : null;
      const userPct = userForecast ? Math.round(userForecast * 100) : null;

      const themeProgressColor = chartTheme?.line?.style?.data?.stroke;

      return (
        <>
          <ProgressBar
            userForecast={userPct}
            value={pct}
            disabled={disabled}
            renderLabel={(value) => {
              if (value === null) {
                return (
                  <div className="justify-center p-0 font-normal">No data</div>
                );
              }
              if (hideCP) {
                return null;
              }
              return (
                <div className="flex items-center gap-1 pl-1">
                  <FontAwesomeIcon icon={faUserGroup} size="sm" /> {`${value}%`}
                </div>
              );
            }}
            progressColor={
              typeof themeProgressColor === "string"
                ? themeProgressColor
                : undefined
            }
            hideCP={hideCP}
          />
          {resolved && (
            <PredictionChip
              question={question}
              status={PostStatus.RESOLVED}
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
      if (aggregateLatest && aggregateLatest.end_time) {
        return <div className="text-center text-xs">No data</div>;
      }

      const prediction =
        aggregateLatest && !aggregateLatest.end_time
          ? aggregateLatest.centers?.[0]
          : undefined;
      const formattedPrediction = prediction
        ? getDisplayValue({
            value: prediction,
            questionType: question.type,
            scaling: question.scaling,
          })
        : "";

      const continuousAreaChartData =
        aggregateLatest && !aggregateLatest.end_time
          ? [
              {
                pmf: cdfToPmf(aggregateLatest.forecast_values),
                cdf: aggregateLatest.forecast_values,
                type: "community" as ContinuousAreaType,
              },
            ]
          : [];
      const prevForecast =
        userLatest && !userLatest.end_time
          ? userLatest.distribution_input
          : null;
      const prevForecastValue = extractPrevNumericForecastValue(prevForecast);
      let dataset: { cdf: number[]; pmf: number[] } | null = null;
      if (isSliderForecast(prevForecastValue)) {
        dataset = getSliderNumericForecastDataset(
          prevForecastValue.components,
          question.open_lower_bound,
          question.open_upper_bound
        );
      }
      if (isQuantileForecast(prevForecastValue)) {
        dataset = getQuantileNumericForecastDataset(
          prevForecastValue.components,
          question
        );
      }

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
            {!hideCP && (
              <div className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold leading-none text-olive-700 dark:text-olive-700-dark">
                <div>
                  <FontAwesomeIcon icon={faUserGroup} size="sm" />
                </div>
                <span>{formattedPrediction}</span>
              </div>
            )}
            <ContinuousAreaChart
              height={40}
              scaling={question.scaling}
              data={continuousAreaChartData}
              extraTheme={chartTheme}
              questionType={question.type}
              resolution={question.resolution}
              hideCP={hideCP}
            />
          </div>
          {resolved && (
            <PredictionChip
              question={question}
              status={PostStatus.RESOLVED}
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
