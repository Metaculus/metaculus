import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import { CSSProperties, FC, PropsWithChildren } from "react";

import { PostStatus } from "@/types/post";
import { Question } from "@/types/question";
import { getDisplayUserValue, getDisplayValue } from "@/utils/charts";
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

  const aggregate = question.aggregations?.recency_weighted;
  const lastUserForecast = aggregate?.history[aggregate.history.length - 1];

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
          {showUserForecast && question.my_forecasts?.history.length ? (
            <p className="m-2 text-orange-800 dark:text-orange-800-dark">
              <FontAwesomeIcon icon={faUser} className="mr-1" />
              {getDisplayUserValue(
                question.my_forecasts,
                lastUserForecast.centers![0],
                lastUserForecast.start_time,
                question.type,
                question.scaling
              )}
            </p>
          ) : (
            <></>
          )}
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
    default:
      if (hideCP) {
        return (
          <span className={classNames("inline-flex flex-col", className)}>
            {showUserForecast && !!question.my_forecasts?.history.length && (
              <p className="m-2 text-base text-orange-800 dark:text-orange-800-dark">
                <FontAwesomeIcon icon={faUser} className="mr-1" />
                {getDisplayUserValue(
                  question.my_forecasts,
                  lastUserForecast.centers![0],
                  lastUserForecast.start_time,
                  question.type,
                  question.scaling
                )}
              </p>
            )}
          </span>
        );
      }
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
            {prediction
              ? getDisplayValue(prediction, question.type, question.scaling)
              : ""}
          </Chip>
          {!!nr_forecasters && (
            <p>
              {nr_forecasters} {t("forecasters")}
            </p>
          )}
          {showUserForecast && !!question.my_forecasts?.history.length && (
            <p className="m-2 text-orange-800 dark:text-orange-800-dark">
              <FontAwesomeIcon icon={faUser} className="mr-1" />
              {getDisplayUserValue(
                question.my_forecasts,
                lastUserForecast.centers![0],
                lastUserForecast.start_time,
                question.type,
                question.scaling
              )}
            </p>
          )}
        </span>
      );
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
