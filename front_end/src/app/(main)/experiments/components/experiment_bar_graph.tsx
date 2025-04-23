"use client";
import { FC, Fragment, ReactNode, useEffect, useState } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import { BaseExperimentBar } from "@/types/experiments";
import cn from "@/utils/core/cn";

type Props<T> = {
  bars: T[];
  totalValue: number;
  getBarColor: (bar: T) => string | undefined;
  externalHoveredId?: string | null;
  onHover?: (id: string | null) => void;
  renderHoverPopover?: (bar: T) => ReactNode;
  interactive?: boolean;
};

const ExperimentBarGraph = <T extends BaseExperimentBar>({
  bars,
  totalValue,
  getBarColor,
  onHover,
  externalHoveredId,
  renderHoverPopover,
  interactive = true,
}: Props<T>) => {
  const [hoveredBar, setHoveredBar] = useState<T | null>(null);

  useEffect(() => {
    if (externalHoveredId === undefined) return;

    if (externalHoveredId) {
      const bar = bars.find((bar) => bar.id === externalHoveredId);
      if (bar) {
        setHoveredBar(bar);
      }
    } else {
      setHoveredBar(null);
    }
  }, [bars, externalHoveredId]);

  const handleHover = (bar: T | null) => {
    setHoveredBar(bar);
    onHover?.(bar?.id ?? null);
  };

  let accumulatedOffsetX = 0;
  return (
    <div
      className={cn("relative flex w-full flex-col", {
        "pointer-events-none": !interactive,
      })}
    >
      <div className="relative mt-2 h-4 w-full">
        {bars.map((bar, index) => {
          const barWidth = (bar.value * 100) / totalValue;
          const barColor = getBarColor(bar) ?? "#A9A9A9";
          const isHovered = hoveredBar?.id === bar.id;
          const offsetX = accumulatedOffsetX;
          const textOverlayOffsetX = offsetX + barWidth / 2;

          const BarElement = (
            <Bar
              index={index}
              barWidth={barWidth}
              offsetX={accumulatedOffsetX}
              color={barColor}
              isHovered={isHovered}
              onHover={(isHovered) => handleHover(isHovered ? bar : null)}
            />
          );
          accumulatedOffsetX += barWidth;

          return (
            <Fragment key={bar.id}>
              {BarElement}
              {isHovered && !!renderHoverPopover && (
                <div
                  className="absolute z-20 flex -translate-x-1/2 flex-col items-center whitespace-nowrap text-sm text-black dark:text-white"
                  style={{
                    left: `${textOverlayOffsetX}%`,
                    top: "120%",
                  }}
                >
                  {renderHoverPopover(bar)}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

type BarProps = {
  index: number;
  barWidth: number;
  offsetX: number;
  color: string;
  isHovered: boolean;
  onHover: (isHovered: boolean) => void;
};

const Bar: FC<BarProps> = ({
  index,
  barWidth,
  offsetX,
  color,
  isHovered,
  onHover,
}) => {
  const { theme } = useAppTheme();
  const hoverColor = theme === "dark" ? "white" : "#2d2e2e";

  return (
    <div
      className={cn("absolute h-full", index && "border-l border-white")}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        width: `${barWidth}%`,
        left: `${offsetX}%`,
        backgroundColor: isHovered ? hoverColor : color,
      }}
    />
  );
};

export default ExperimentBarGraph;
