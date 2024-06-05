import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { QuestionStatus, QuestionType } from "@/types/question";
import {
  getForecastNumericDisplayValue,
  getForecastPctDisplayValue,
} from "@/utils/forecasts";

type Size = "compact" | "large";

type Props = {
  questionType: QuestionType;
  status: QuestionStatus;
  prediction: number | undefined;
  resolution: string | null;
  size?: Size;
  chipClassName?: string;
};

const PredictionChip: FC<Props> = ({
  questionType,
  status,
  prediction,
  resolution,
  chipClassName,
  size,
}) => {
  const t = useTranslations();

  switch (status) {
    case QuestionStatus.Resolved:
      return (
        <span className="inline-flex flex-col">
          <Label className="text-metac-purple-900 dark:text-metac-purple-900-dark">
            {t("resolved")} :
          </Label>
          <Chip
            size={size}
            className={classNames(
              "bg-metac-purple-800 dark:bg-metac-purple-800-dark",
              chipClassName
            )}
          >
            {resolution}
          </Chip>
        </span>
      );
    case QuestionStatus.Closed:
      return (
        <Chip
          size={size}
          className={classNames(
            "bg-metac-olive-700 dark:bg-metac-olive-700-dark",
            chipClassName
          )}
        >
          <FontAwesomeIcon icon={faUserGroup} size="xs" />
          {t("Closed")}
        </Chip>
      );
    case QuestionStatus.Active:
    default:
      return (
        <Chip
          size={size}
          className={classNames(
            "bg-metac-olive-700 dark:bg-metac-olive-700-dark",
            chipClassName
          )}
        >
          <FontAwesomeIcon icon={faUserGroup} size="xs" />
          {prediction ? formatPrediction(prediction, questionType) : ""}
        </Chip>
      );
  }
};

type ChipProps = {
  className?: string;
  size?: Size;
};

const Chip: FC<PropsWithChildren<ChipProps>> = ({
  className,
  size,
  ...props
}) => (
  <span
    className={classNames(
      "inline-flex w-max items-center gap-2 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold text-metac-gray-0 dark:text-metac-gray-0-dark",
      {
        "h-5 text-xs": size === "compact",
        "h-9 text-xl": size === "large",
        "h-7 text-base": !size,
      },
      className
    )}
    {...props}
  />
);

type LabelProps = {
  size?: Size;
  className?: string;
};

const Label: FC<PropsWithChildren<LabelProps>> = ({
  size,
  className,
  ...props
}) => (
  <span
    className={classNames(
      "whitespace-nowrap",
      {
        "text-sm": size === "compact",
        "text-xl": size === "large",
        "text-base": !size,
      },
      className
    )}
    {...props}
  />
);

function formatPrediction(prediction: number, questionType: QuestionType) {
  switch (questionType) {
    case QuestionType.Numeric:
      return getForecastNumericDisplayValue(prediction);
    case QuestionType.Binary:
      return getForecastPctDisplayValue(prediction);
    default:
      return prediction;
  }
}

export default PredictionChip;
