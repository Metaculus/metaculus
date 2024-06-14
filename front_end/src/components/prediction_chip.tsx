import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { PostStatus } from "@/types/post";
import { QuestionType } from "@/types/question";
import {
  getForecastNumericDisplayValue,
  getForecastPctDisplayValue,
} from "@/utils/forecasts";

type Size = "compact" | "large";

type Props = {
  questionType: QuestionType;
  status: PostStatus;
  nr_forecasters: number;
  prediction: number | undefined;
  resolution: string | null;
  size?: Size;
  chipClassName?: string;
};

const PredictionChip: FC<Props> = ({
  questionType,
  status,
  nr_forecasters,
  prediction,
  resolution,
  chipClassName,
  size,
}) => {
  const t = useTranslations();

  switch (status) {
    case PostStatus.InReview:
      return <span className="inline-flex flex-col"></span>;
    case PostStatus.Resolved:
      return (
        <span
          className={classNames("inline-flex", {
            "flex-col": size === "large" || !size,
            "flex-row items-center gap-1": size === "compact",
          })}
        >
          <Label className="text-purple-900 dark:text-purple-900-dark">
            {t("resolved")} :
          </Label>
          <Chip
            size={size}
            className={classNames(
              "bg-purple-800 dark:bg-purple-800-dark",
              chipClassName
            )}
          >
            {resolution}
          </Chip>
          {size !== "compact" && (
            <p>
              {nr_forecasters} {t("forecasters")}
            </p>
          )}
        </span>
      );
    case PostStatus.Closed:
      return (
        <span className="inline-flex flex-col">
          <Chip
            size={size}
            className={classNames(
              "bg-olive-700 dark:bg-olive-700-dark",
              chipClassName
            )}
          >
            <FontAwesomeIcon icon={faUserGroup} size="xs" />
            {t("Closed")}
          </Chip>
          <p>
            {nr_forecasters} {t("forecasters")}
          </p>
        </span>
      );
    case PostStatus.Active:
    default:
      return (
        <span className="inline-flex flex-col">
          <Chip
            size={size}
            className={classNames(
              "bg-olive-700 dark:bg-olive-700-dark",
              chipClassName
            )}
          >
            <FontAwesomeIcon icon={faUserGroup} size="xs" />
            {prediction ? formatPrediction(prediction, questionType) : ""}
          </Chip>
          <p>
            {nr_forecasters} {t("forecasters")}
          </p>
        </span>
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
      "inline-flex w-max items-center gap-2 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold text-gray-0 dark:text-gray-0-dark",
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
