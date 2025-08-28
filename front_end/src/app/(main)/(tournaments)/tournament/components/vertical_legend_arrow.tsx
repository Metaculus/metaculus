"use client";

import { FC } from "react";

import cn from "@/utils/core/cn";

import { GREEN_R, NEUTRAL, RED_L } from "../constants/colors";

type Props = {
  topLabel?: string;
  bottomLabel?: string;
  fromColor?: string;
  midColor?: string;
  toColor?: string;
  stemThickness?: number;
  headSize?: number;
  className?: string;
};

const VerticalGradientArrow: FC<Props> = ({
  topLabel = "-100",
  bottomLabel = "100",
  fromColor = RED_L,
  midColor = NEUTRAL,
  toColor = GREEN_R,
  stemThickness = 4,
  headSize = 16,
  className,
}) => {
  const stemStyle: React.CSSProperties = {
    flex: "1 1 auto",
    minHeight: 0,
    width: stemThickness,
    background: `linear-gradient(180deg, ${fromColor} 0%, ${midColor} 50%, ${toColor} 100%)`,
    borderRadius: stemThickness / 2,
  };

  const upHeadStyle: React.CSSProperties = {
    borderLeft: `${headSize / 2}px solid transparent`,
    borderRight: `${headSize / 2}px solid transparent`,
    borderBottom: `${headSize}px solid ${fromColor}`,
    height: 0,
    width: 0,
  };

  const downHeadStyle: React.CSSProperties = {
    borderLeft: `${headSize / 2}px solid transparent`,
    borderRight: `${headSize / 2}px solid transparent`,
    borderTop: `${headSize}px solid ${toColor}`,
    height: 0,
    width: 0,
  };

  return (
    <div
      className={cn(
        "min-h-full max-w-[111px] self-stretch rounded-[8px] border border-blue-400 bg-gray-0 p-4 text-center dark:border-blue-400-dark dark:bg-gray-0-dark",
        className
      )}
    >
      <div className="mx-auto flex h-full flex-col">
        <div className="text-xs font-normal leading-[16px] text-gray-800 dark:text-gray-800-dark sm:text-sm">
          {topLabel}
        </div>

        <div className="mx-auto my-1 flex min-h-0 w-min flex-1 flex-col items-center">
          <span aria-hidden style={upHeadStyle} className="block" />
          <span aria-hidden style={stemStyle} className="-my-[3px] block" />
          <span aria-hidden style={downHeadStyle} className="-mt-[3px] block" />
        </div>

        <div className="text-xs font-normal leading-[16px] text-gray-800 dark:text-gray-800-dark sm:text-sm">
          {bottomLabel}
        </div>
      </div>
    </div>
  );
};

export default VerticalGradientArrow;
