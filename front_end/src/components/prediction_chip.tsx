import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale, useTranslations } from "next-intl";
import { CSSProperties, FC, PropsWithChildren } from "react";

import QuestionCPMovement from "@/components/cp_movement";
import ReaffirmButton from "@/components/post_card/reaffirm_button";
import { PostStatus } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  UserForecast,
} from "@/types/question";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";
import {
  getDiscreteValueOptions,
  getPredictionDisplayValue,
} from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";
import { formatValueUnit } from "@/utils/questions/units";

type Size = "compact" | "large";

type Props = {
  question: QuestionWithForecasts;
  status: PostStatus;
  predictionOverride?: number | null; // override displayed CP (e.g. for graph cursor), otherwise the latest CP is used
  size?: Size;
  className?: string;
  chipClassName?: string;
  unresolvedChipStyle?: CSSProperties;
  showUserForecast?: boolean;
  onReaffirm?: (userForecast: UserForecast) => void;
  canPredict?: boolean;
  hideCP?: boolean;
  showWeeklyMovement?: boolean;
  enforceCPDisplay?: boolean; // ensure CP is shown even on closed and resolved questions
};

const PredictionChip: FC<Props> = ({
  question,
  status,
  predictionOverride,
  className,
  chipClassName,
  unresolvedChipStyle,
  size,
  showUserForecast,
  onReaffirm,
  canPredict = false,
  hideCP,
  showWeeklyMovement = false,
  enforceCPDisplay = false,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const { resolution } = question;

  const formattedResolution = formatResolution({
    resolution,
    questionType: question.type,
    locale,
    scaling: question.scaling,
    unit: question.unit,
    actual_resolve_time: question.actual_resolve_time ?? null,
  });

  const renderUserForecast = () => {
    const latest = question.my_forecasts?.latest;

    if (showUserForecast && latest && isForecastActive(latest)) {
      const displayValue = getPredictionDisplayValue(
        latest.centers ? latest.centers[0] : latest.forecast_values[1],
        {
          questionType: question.type,
          scaling: question.scaling,
          actual_resolve_time: question.actual_resolve_time ?? null,
        }
      );

      return (
        <p className="m-2 text-orange-800 dark:text-orange-800-dark">
          <FontAwesomeIcon icon={faUser} className="mr-1" />
          {displayValue}{" "}
          {!!onReaffirm && canPredict && (
            <ReaffirmButton
              onClick={() => {
                onReaffirm(latest);
              }}
            />
          )}
        </p>
      );
    }

    return null;
  };

  const renderCommunityForecast = (showWeeklyMovement = false) => {
    if (!communityPredictionDisplayValue) {
      return null;
    }

    return (
      <>
        <Chip
          size={size}
          className={cn(
            "bg-olive-700 dark:bg-olive-700-dark",
            {
              "mt-2":
                status === PostStatus.CLOSED || status === PostStatus.RESOLVED,
            },
            chipClassName
          )}
          style={unresolvedChipStyle}
        >
          <FontAwesomeIcon icon={faUserGroup} size="xs" />
          {formatValueUnit(communityPredictionDisplayValue, question.unit)}
        </Chip>
        {showWeeklyMovement && (
          <QuestionCPMovement
            question={question}
            className="my-1 max-w-[140px] sm:max-w-[110px] md:max-w-[200px]"
          />
        )}
      </>
    );
  };

  const latest =
    question.aggregations[question.default_aggregation_method].latest;
  let communityPredictionDisplayValue: string | null = null;
  if (predictionOverride) {
    communityPredictionDisplayValue = getPredictionDisplayValue(
      predictionOverride,
      {
        questionType: question.type,
        scaling: question.scaling,
        actual_resolve_time: question.actual_resolve_time ?? null,
        discreteValueOptions:
          question.type === QuestionType.Discrete
            ? getDiscreteValueOptions(question)
            : undefined,
      }
    );
  } else if (latest && isForecastActive(latest)) {
    communityPredictionDisplayValue = getPredictionDisplayValue(
      latest.centers?.[0],
      {
        questionType: question.type,
        scaling: question.scaling,
        actual_resolve_time: question.actual_resolve_time ?? null,
        discreteValueOptions:
          question.type === QuestionType.Discrete
            ? getDiscreteValueOptions(question)
            : undefined,
      }
    );
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
            {t("resolved")}:
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
          {enforceCPDisplay && renderCommunityForecast()}
          {renderUserForecast()}
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
            style={unresolvedChipStyle}
          >
            {t("Closed")}
          </Chip>
          {enforceCPDisplay && renderCommunityForecast()}
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
          {renderCommunityForecast(showWeeklyMovement)}
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
