import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import NumericAreaChart from "@/components/charts/numeric_area_chart";
import PredictionChip from "@/components/prediction_chip";
import ProgressBar from "@/components/ui/progress_bar";
import { PostStatus } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { formatPrediction, getIsForecastEmpty } from "@/utils/forecasts";

type Props = {
  parentResolved: boolean;
  question: QuestionWithForecasts;
  parentStatus: PostStatus;
  disabled: boolean;
};

const ConditionalChart: FC<Props> = ({
  question,
  parentResolved,
  parentStatus,
  disabled,
}) => {
  const resolved = parentResolved && question.resolution !== null;

  switch (question.type) {
    case QuestionType.Binary: {
      const pctCandidate = question.forecasts?.values_mean?.at(-1);
      const pct = pctCandidate ? Math.round(pctCandidate * 100) : null;

      return (
        <>
          <ProgressBar
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
              questionType={question.type}
              status={parentStatus}
              nr_forecasters={question.nr_forecasters}
              prediction={pctCandidate}
              resolution={question.resolution}
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

      const prediction = question.forecasts.values_mean.at(-1);
      const formattedPrediction = prediction
        ? formatPrediction(prediction, question.type)
        : "";

      return (
        <>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold leading-none text-olive-700 dark:text-olive-700-dark">
              <div>
                <FontAwesomeIcon icon={faUserGroup} size="sm" />
              </div>
              <span>{formattedPrediction}</span>
            </div>
            <NumericAreaChart
              height={40}
              min={question.min}
              max={question.max}
              data={[
                {
                  pmf: question.forecasts.latest_pmf,
                  cdf: question.forecasts.latest_cdf,
                  color: "green",
                },
              ]}
            />
          </div>
          {resolved && (
            <PredictionChip
              questionType={question.type}
              status={parentStatus}
              nr_forecasters={question.nr_forecasters}
              prediction={prediction}
              resolution={question.resolution}
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
