import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale, useTranslations } from "next-intl";
import { CSSProperties, FC, PropsWithChildren } from "react";

import CPWeeklyMovement from "@/components/cp_weekly_movement";
import ReaffirmButton from "@/components/post_card/reaffirm_button";
import { PostStatus } from "@/types/post";
import { QuestionWithForecasts, UserForecast } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import { formatResolution, isUnsuccessfullyResolved } from "@/utils/questions";

type Size = "compact" | "large";

type Props = {
  question: QuestionWithForecasts;
  status: PostStatus;
  prediction?: number;
  size?: Size;
  className?: string;
  chipClassName?: string;
  unresovledChipStyle?: CSSProperties;
  showUserForecast?: boolean;
  onReaffirm?: (userForecast: UserForecast) => void;
  canPredict?: boolean;
  hideCP?: boolean;
  compact?: boolean;
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
  onReaffirm,
  canPredict = false,
  hideCP,
  compact,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const { resolution, nr_forecasters } = question;

  const formattedResolution = formatResolution(
    resolution,
    question.type,
    locale,
    question.scaling
  );

  const renderUserForecast = () => {
    const latest = question.my_forecasts?.latest;

    if (showUserForecast && latest && !latest.end_time) {
      const displayValue = getDisplayValue({
        value: latest.centers ? latest.centers[0] : latest.forecast_values[1],
        questionType: question.type,
        scaling: question.scaling,
      });

      return (
        <p className="m-2 text-orange-800 dark:text-orange-800-dark">
          <FontAwesomeIcon icon={faUser} className="mr-1" />
          {displayValue}{" "}
          {!!onReaffirm && canPredict && (
            <ReaffirmButton
              onClick={() => {
                onReaffirm(latest);
              }}
              combined
            />
          )}
        </p>
      );
    }

    return null;
  };

  const latest = question.aggregations.recency_weighted.latest;
  let communityPredictionDisplayValue: string | null = null;
  if (prediction) {
    communityPredictionDisplayValue = getDisplayValue({
      value: prediction,
      questionType: question.type,
      scaling: question.scaling,
    });
  } else if (latest && !latest.end_time) {
    communityPredictionDisplayValue = getDisplayValue({
      value: latest.centers?.[0],
      questionType: question.type,
      scaling: question.scaling,
    });
  }

  switch (status) {
    case PostStatus.PENDING:
      return <span className={cn("inline-flex flex-col", className)}></span>;
    case PostStatus.RESOLVED:
      return (
        <span
          className={cn(
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
            className={cn(
              isUnsuccessfullyResolved(resolution)
                ? "border border-purple-800 text-purple-800 dark:border-purple-800-dark dark:text-purple-800-dark"
                : "bg-purple-800 dark:bg-purple-800-dark",
              chipClassName
            )}
          >
            {formattedResolution}
          </Chip>
          {!!communityPredictionDisplayValue && (
            <Chip
              size={size}
              className={cn(
                "bg-olive-700 dark:bg-olive-700-dark",
                chipClassName,
                "mt-2"
              )}
              style={unresovledChipStyle}
            >
              <FontAwesomeIcon icon={faUserGroup} size="xs" />
              {communityPredictionDisplayValue}
            </Chip>
          )}
          {!!nr_forecasters && (
            <p>
              {nr_forecasters} {t("forecasters")}
            </p>
          )}
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
        <span className={cn("inline-flex flex-col", className)}>
          <Chip
            size={size}
            className={cn(
              "bg-purple-800 dark:bg-purple-800-dark",
              chipClassName
            )}
            style={unresovledChipStyle}
          >
            {t("Closed")}
          </Chip>
          {!!communityPredictionDisplayValue && (
            <Chip
              size={size}
              className={cn(
                "bg-olive-700 dark:bg-olive-700-dark",
                chipClassName,
                "mt-2"
              )}
              style={unresovledChipStyle}
            >
              <FontAwesomeIcon icon={faUserGroup} size="xs" />
              {communityPredictionDisplayValue}
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
    default: {
      if (hideCP) {
        return (
          <span className={cn("inline-flex flex-col", className)}>
            {renderUserForecast()}
          </span>
        );
      }

      return (
        <span className={cn("inline-flex flex-col", className)}>
          {!!communityPredictionDisplayValue && (
            <>
              <Chip
                size={size}
                className={cn(
                  "bg-olive-700 dark:bg-olive-700-dark",
                  chipClassName
                )}
                style={unresovledChipStyle}
              >
                <FontAwesomeIcon icon={faUserGroup} size="xs" />
                {communityPredictionDisplayValue}
              </Chip>
              {!compact && (
                <CPWeeklyMovement
                  question={question}
                  className="my-1 max-w-[100px]"
                />
              )}
            </>
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
    className={cn(
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
    className={cn(
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
