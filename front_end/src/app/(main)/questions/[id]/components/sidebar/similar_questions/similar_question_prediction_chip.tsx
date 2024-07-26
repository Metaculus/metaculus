import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { FC } from "react";

import { PostStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { formatPrediction } from "@/utils/forecasts";

type Props = {
  question: QuestionWithNumericForecasts;
  curationStatus: PostStatus;
  className?: string;
};

const SimilarPredictionChip: FC<Props> = ({
  question,
  curationStatus,
  className,
}) => {
  const prediction =
    question.forecasts.medians[question.forecasts.medians.length - 1];

  if (
    curationStatus == PostStatus.APPROVED ||
    curationStatus == PostStatus.OPEN
  ) {
    return (
      <span
        className={classNames(
          "flex flex-row gap-0.5 text-xs font-medium text-olive-700 dark:text-olive-400",
          className
        )}
      >
        <FontAwesomeIcon icon={faUserGroup} className="!w-[13px]" />
        <span>
          {prediction ? formatPrediction(prediction, question.type) : ""}
        </span>
      </span>
    );
  }

  return null;
};

export default SimilarPredictionChip;
