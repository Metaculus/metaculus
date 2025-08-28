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
  stemHeight?: number;
  stemThickness?: number;
  headSize?: number;
  className?: string;
};

const VerticalGradientArrow: FC<Props> = ({
  topLabel = "Less democratic",
  bottomLabel = "More democratic",
  fromColor = RED_L,
  midColor = NEUTRAL,
  toColor = GREEN_R,
  stemHeight = 52,
  stemThickness = 4,
  headSize = 16,
  className,
}) => {
  const stemStyle: React.CSSProperties = {
    height: stemHeight,
    width: stemThickness,
    background: `linear-gradient(180deg, ${fromColor} 0%, ${midColor} 50%, ${toColor} 100%)`,
    borderRadius: stemThickness / 2,
  };

  const upHeadStyle: React.CSSProperties = {
    borderLeft: `${headSize / 2}px solid transparent`,
    borderRight: `${headSize / 2}px solid transparent`,
    borderBottom: `${headSize}px solid ${fromColor}`,
  };

  const downHeadStyle: React.CSSProperties = {
    borderLeft: `${headSize / 2}px solid transparent`,
    borderRight: `${headSize / 2}px solid transparent`,
    borderTop: `${headSize}px solid ${toColor}`,
  };

  return (
    <div
      className={cn(
        "max-w-[111px] rounded-[8px] border border-blue-400 bg-white p-4 text-center dark:border-blue-400-dark",
        className
      )}
    >
      <div className="mx-auto space-y-3">
        <div className="text-xs font-normal leading-[16px] text-gray-800 dark:text-gray-800-dark sm:text-sm">
          {topLabel}
        </div>

        <div className="mx-auto flex w-min flex-col items-center">
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
