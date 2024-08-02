import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { PostStatus, Resolution } from "@/types/post";
import { Question } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import { formatResolution } from "@/utils/questions";

type Size = "compact" | "large";

type Props = {
  question: Question;
  status: PostStatus;
  prediction?: number;
  size?: Size;
  className?: string;
  chipClassName?: string;
};

const PredictionChip: FC<Props> = ({
  question,
  status,
  prediction,
  className,
  chipClassName,
  size,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const { resolution, nr_forecasters } = question;

  const fmted_resolution = formatResolution(resolution, question.type, locale);

  const fmted_prediction = formatResolution(prediction, question.type, locale);

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
        <span className={classNames("inline-flex flex-col", className)}>
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
        <span className={classNames("inline-flex flex-col", className)}>
          <Chip
            size={size}
            className={classNames(
              "bg-olive-700 dark:bg-olive-700-dark",
              chipClassName
            )}
          >
            <FontAwesomeIcon icon={faUserGroup} size="xs" />
            {prediction ? getDisplayValue(prediction, question) : ""}
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
      "InternalChip inline-flex w-max items-center gap-2 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold text-gray-0 dark:text-gray-0-dark",
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
