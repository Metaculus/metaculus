import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import { CSSProperties, FC, PropsWithChildren } from "react";

import { PostStatus } from "@/types/post";
import { Question } from "@/types/question";
import { getUserPredictionDisplayValue, getDisplayValue } from "@/utils/charts";
import { formatResolution, isUnsuccessfullyResolved } from "@/utils/questions";

type Size = "compact" | "large";

type Props = {
  question: Question;
  status: PostStatus;
  prediction?: number;
  size?: Size;
  className?: string;
  chipClassName?: string;
  unresovledChipStyle?: CSSProperties;
  showUserForecast?: boolean;
  hideCP?: boolean;
};

const PredictionChip: FC<Props> = ({
  question,
  status,
  prediction,
  className,
  chipClassName,
  unresovledChipStyle,
  size,
  showUserForecast,
  hideCP,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const { resolution, nr_forecasters } = question;

  const formattedResolution = formatResolution(
    resolution,
    question.type,
    locale
  );

  const renderUserForecast = () => {
    if (showUserForecast && question.my_forecasts?.history.length) {
      const timestamp = question.my_forecasts.history.at(-1)?.start_time;

      const displayValue = getUserPredictionDisplayValue(
        question.my_forecasts,
        timestamp,
        question.type,
        question.scaling
      );

      return (
        <p className="m-2 text-orange-800 dark:text-orange-800-dark">
          <FontAwesomeIcon icon={faUser} className="mr-1" />
          {displayValue}
        </p>
      );
    }

    return null;
  };

  switch (status) {
    case PostStatus.PENDING:
      return (
        <span className={classNames("inline-flex flex-col", className)}></span>
      );
    case PostStatus.RESOLVED:
      return (
        <span
          className={classNames(
            "inline-flex",
            {
              "flex-col": size === "large" || !size,
              "flex-row items-center gap-1": size === "compact",
            },
            className
          )}
        >
          <Label className="text-purple-900 dark:text-purple-900-dark">
            {t("resolved")} :
          </Label>
          <Chip
            size={size}
            className={classNames(
              isUnsuccessfullyResolved(resolution)
                ? "border border-purple-800 text-purple-800 dark:border-purple-800-dark dark:text-purple-800-dark"
                : "bg-purple-800 dark:bg-purple-800-dark",
              chipClassName
            )}
          >
            {formattedResolution}
          </Chip>
          {renderUserForecast()}
          {size !== "compact" && !!nr_forecasters && (
            <p>
              {nr_forecasters} {t("forecasters")}
            </p>
          )}
        </span>
      );
    case PostStatus.CLOSED:
      return (
        <span className={classNames("inline-flex flex-col", className)}>
          <Chip
            size={size}
            className={classNames(
              "bg-olive-700 dark:bg-olive-700-dark",
              chipClassName
            )}
            style={unresovledChipStyle}
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
    default: {
      if (hideCP) {
        return (
          <span className={classNames("inline-flex flex-col", className)}>
            {renderUserForecast()}
          </span>
        );
      }

      const predictionDisplayValue = prediction
        ? getDisplayValue(prediction, question.type, question.scaling)
        : null;
      return (
        <span className={classNames("inline-flex flex-col", className)}>
          {!!predictionDisplayValue && (
            <Chip
              size={size}
              className={classNames(
                "bg-olive-700 dark:bg-olive-700-dark",
                chipClassName
              )}
              style={unresovledChipStyle}
            >
              <FontAwesomeIcon icon={faUserGroup} size="xs" />
              {predictionDisplayValue}
            </Chip>
          )}
          {!!nr_forecasters && (
            <p>
              {nr_forecasters} {t("forecasters")}
            </p>
          )}
          {renderUserForecast()}
        </span>
      );
    }
  }
};

type ChipProps = {
  className?: string;
  style?: CSSProperties;
  size?: Size;
};

const Chip: FC<PropsWithChildren<ChipProps>> = ({
  className,
  style,
  size,
  ...props
}) => (
  <span
    className={classNames(
      "InternalChip inline-flex w-max items-center gap-2 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold text-gray-0 dark:text-gray-0-dark",
      {
        "h-5 text-xs": size === "compact",
        "h-9 text-xl": size === "large",
        "h-7 text-base": !size,
      },
      className
    )}
    style={style}
    suppressHydrationWarning
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
      "InternalLabel whitespace-nowrap",
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
