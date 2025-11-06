"use client";
import { FC, PropsWithChildren, ReactNode } from "react";

import { KeyFactor } from "@/types/comment";
import cn from "@/utils/core/cn";

export type Props = {
  kf: KeyFactor;
  className?: string;
  expanded?: boolean;
};

export const KeyFactorTileDriverDisplay: FC<Props> = ({
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

export const KeyFactorTileNewsDisplay: FC<Props> = () => null;
export const KeyFactorTileBaseRateTrendDisplay: FC<Props> = () => null;
export const KeyFactorTileBaseRateFreqDisplay: FC<Props> = () => null;
export const KeyFactorTileQuestionLinkDisplay: FC<Props> = () => null;

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
        expanded ? "block" : "flex min-w-0 items-center",
        className
      )}
    >
      {startAdornment && <div className="mr-2 shrink-0">{startAdornment}</div>}
      <div
        className={cn(
          expanded ? "whitespace-normal break-words" : "block truncate",
          "min-w-0 flex-1"
        )}
      >
        {children}
      </div>
      {endAdornment && <div className="ml-2 shrink-0">{endAdornment}</div>}
    </div>
  );
};
