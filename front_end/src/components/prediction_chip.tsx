import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { PostStatus } from "@/types/post";
import { QuestionType } from "@/types/question";
import { formatPrediction } from "@/utils/forecasts";

function fmt_for_chip(
  resolution: number | string | null | undefined,
  questionType: QuestionType
) {
  let fmted_resolution = null;
  resolution = String(resolution);
  if (resolution === "null" || resolution === "undefined") {
    fmted_resolution = "Annulled";
  } else if (["yes", "no"].includes(resolution)) {
    fmted_resolution = resolution.charAt(0).toUpperCase() + resolution.slice(1);
  } else if (questionType === QuestionType.Date) {
    if (!isNaN(Number(resolution)) && resolution.trim() !== "") {
      fmted_resolution = String(new Date(Number(resolution) * 1000)).split(
        "T"
      )[0];
    } else {
      fmted_resolution = resolution.split("T")[0];
    }
  } else if (!isNaN(Number(resolution)) && resolution.trim() !== "") {
    fmted_resolution = parseFloat(Number(resolution).toPrecision(3));
    if (fmted_resolution > 1000) {
      fmted_resolution = (fmted_resolution / 1000).toFixed(2) + "k";
    } else if (fmted_resolution > 100) {
      fmted_resolution = fmted_resolution.toFixed(0);
    } else {
      fmted_resolution = fmted_resolution.toFixed(2);
    }
    fmted_resolution = String(fmted_resolution);
  }
  return fmted_resolution;
}

type Size = "compact" | "large";

type Props = {
  questionType: QuestionType;
  status: PostStatus;
  nr_forecasters?: number;
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

  const fmted_resolution = fmt_for_chip(resolution, questionType);
  const fmted_prediction = fmt_for_chip(prediction, questionType);

  switch (status) {
    case PostStatus.PENDING:
      return <span className="inline-flex flex-col"></span>;
    case PostStatus.RESOLVED:
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
            {fmted_resolution}
          </Chip>
          {size !== "compact" && !!nr_forecasters && (
            <p>
              {nr_forecasters} {t("forecasters")}
            </p>
          )}
        </span>
      );
    case PostStatus.CLOSED:
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
          {!!nr_forecasters && (
            <p>
              {nr_forecasters} {t("forecasters")}
            </p>
          )}
        </span>
      );
    case PostStatus.APPROVED:
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
          {!!nr_forecasters && (
            <p>
              {nr_forecasters} {t("forecasters")}
            </p>
          )}
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
      "PredictionChip inline-flex w-max items-center gap-2 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold text-gray-0 dark:text-gray-0-dark",
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
      "PredictionLabel whitespace-nowrap",
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

export default PredictionChip;
