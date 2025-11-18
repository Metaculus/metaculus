"use client";

import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, ReactNode } from "react";

import { KeyFactor } from "@/types/comment";
import cn from "@/utils/core/cn";

export type Props = {
  kf: KeyFactor;
  className?: string;
  expanded?: boolean;
};

export const KeyFactorTileDriverView: FC<Props> = ({
  kf,
  className,
  expanded,
}) => {
  return (
    <KeyFactorTileContainer expanded={expanded} className={className}>
      {kf.driver?.text}
    </KeyFactorTileContainer>
  );
};

export const KeyFactorTileNewsView: FC<Props> = () => null;

export const KeyFactorTileBaseRateTrendView: FC<Props> = ({
  kf,
  className,
  expanded,
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
    >
      {ref}
    </KeyFactorTileContainer>
  );
};

export const KeyFactorTileBaseRateFreqView: FC<Props> = ({
  kf,
  className,
  expanded,
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
    >
      {ref}
    </KeyFactorTileContainer>
  );
};
export const KeyFactorTileQuestionLinkView: FC<Props> = () => null;

type KeyFactorTileContainerProps = PropsWithChildren<{
  expanded?: boolean;
  className?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}>;

export const KeyFactorTileContainer: FC<KeyFactorTileContainerProps> = ({
  children,
  expanded = false,
  className,
  startAdornment,
  endAdornment,
}) => {
  return (
    <div
      className={cn(
        "w-full max-w-full rounded-[12px] px-2.5 py-1.5 text-sm leading-[16px] antialiased",
        "bg-gray-200 text-gray-800 dark:bg-gray-200-dark dark:text-gray-800-dark",
        "flex min-w-0",
        expanded ? "items-start" : "items-center",
        className
      )}
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
