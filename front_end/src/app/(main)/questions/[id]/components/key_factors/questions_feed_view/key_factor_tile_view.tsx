"use client";

import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, ReactNode } from "react";

import Tooltip from "@/components/ui/tooltip";
import { KeyFactor } from "@/types/comment";
import cn from "@/utils/core/cn";

export type Props = {
  kf: KeyFactor;
  className?: string;
  expanded?: boolean;
  onToggle?: () => void;
};

export const KeyFactorTileDriverView: FC<Props> = ({
  kf,
  className,
  expanded,
  onToggle,
}) => {
  return (
    <KeyFactorTileContainer
      expanded={expanded}
      className={className}
      onClick={onToggle}
    >
      {kf.driver?.text}
    </KeyFactorTileContainer>
  );
};

export const KeyFactorTileNewsView: FC<Props> = ({
  kf,
  className,
  expanded,
  onToggle,
}) => {
  return (
    <KeyFactorTileContainer
      expanded={expanded}
      startAdornment={
        <span className="shrink-0 font-medium text-salmon-800 dark:text-salmon-800-dark">
          {kf.news?.source}:
        </span>
      }
      className={className}
      onClick={onToggle}
    >
      {kf.news?.title}
    </KeyFactorTileContainer>
  );
};

export const KeyFactorTileBaseRateTrendView: FC<Props> = ({
  kf,
  className,
  expanded,
  onToggle,
}) => {
  const t = useTranslations();
  const br = kf.base_rate;
  if (!br || br.type !== "trend") return null;

  const unit = br.unit ?? "";
  const year = br.projected_by_year ?? "";
  const ref = br.reference_class ?? "";

  return (
    <KeyFactorTileContainer
      expanded={expanded}
      startAdornment={
        <>
          <span className="shrink-0 font-medium text-purple-800 dark:text-purple-800-dark">
            {br.projected_value} {unit}
          </span>
          <span className="lowercase text-gray-500 dark:text-gray-500-dark">
            {" "}
            {t("by")}
          </span>
          <span className="mr-1 shrink-0 font-medium lowercase text-gray-500 dark:text-gray-500-dark">
            {" "}
            {year}
          </span>
        </>
      }
      className={className}
      onClick={onToggle}
    >
      {ref}
    </KeyFactorTileContainer>
  );
};

export const KeyFactorTileBaseRateFreqView: FC<Props> = ({
  kf,
  className,
  expanded,
  onToggle,
}) => {
  const br = kf.base_rate;
  if (!br || br.type !== "frequency") return null;

  const num = br.rate_numerator ?? 0;
  const den = br.rate_denominator ?? 0;
  const ref = br.reference_class ?? "";

  return (
    <KeyFactorTileContainer
      expanded={expanded}
      startAdornment={
        <>
          <span className="font-medium text-purple-800 dark:text-purple-800-dark">
            {num}
          </span>
          <span className="text-gray-500 dark:text-gray-500-dark"> in</span>
          <span className="mr-1 font-medium text-gray-500 dark:text-gray-500-dark">
            {" "}
            {den}
          </span>
        </>
      }
      className={className}
      onClick={onToggle}
    >
      {ref}
    </KeyFactorTileContainer>
  );
};

export const KeyFactorTileQuestionLinkView: FC<
  Props & { label: string | null; title: string }
> = ({ className, expanded, onToggle, label, title }) => {
  const tooltipText = "This is another Metaculus question.";

  return (
    <KeyFactorTileContainer
      expanded={expanded}
      className={className}
      onClick={onToggle}
      startAdornment={
        label ? (
          <span
            className={cn(
              "shrink-0 font-medium text-olive-800 dark:text-olive-800-dark"
            )}
          >
            {label}
          </span>
        ) : undefined
      }
      endAdornment={
        <Tooltip tooltipContent={tooltipText} showDelayMs={150}>
          <FontAwesomeIcon
            onClick={(e) => e.stopPropagation()}
            icon={faQuestionCircle}
            className="cursor-pointer text-blue-500 hover:text-blue-800 dark:text-blue-500-dark dark:hover:text-blue-800-dark"
          />
        </Tooltip>
      }
    >
      {title}
    </KeyFactorTileContainer>
  );
};

type KeyFactorTileContainerProps = PropsWithChildren<{
  expanded?: boolean;
  className?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  onClick?: () => void;
}>;

export const KeyFactorTileContainer: FC<KeyFactorTileContainerProps> = ({
  children,
  expanded = false,
  className,
  startAdornment,
  endAdornment,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "w-full max-w-full rounded-[12px] px-2.5 py-1.5 text-xs leading-[16px] antialiased",
        "bg-gray-200 text-gray-800 dark:bg-gray-200-dark dark:text-gray-800-dark",
        "flex min-w-0",
        expanded ? "items-start" : "items-center",
        className
      )}
      onClick={onClick}
    >
      {startAdornment && (
        <div className="mr-2 shrink-0 whitespace-nowrap">{startAdornment}</div>
      )}
      <div
        className={cn(
          expanded ? "whitespace-normal break-words" : "truncate",
          "min-w-0 flex-1"
        )}
      >
        {children}
      </div>
      {endAdornment && <div className="ml-2 shrink-0">{endAdornment}</div>}
    </div>
  );
};
