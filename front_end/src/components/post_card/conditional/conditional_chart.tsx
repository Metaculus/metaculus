import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import PredictionChip from "@/components/prediction_chip";
import ProgressBar from "@/components/ui/progress_bar";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

type Props = {
  parentResolved: boolean;
  question: QuestionWithForecasts;
  disabled: boolean;
};

const ConditionalChart: FC<Props> = ({
  question,
  parentResolved,
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
              status={question.status}
              nr_forecasters={question.nr_forecasters}
              prediction={pctCandidate}
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
