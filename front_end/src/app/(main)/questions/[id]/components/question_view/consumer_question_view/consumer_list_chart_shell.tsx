"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import useContainerSize from "@/hooks/use_container_size";
import cn from "@/utils/core/cn";

type ListChartExpandedContextType = {
  setIsExpanded: (value: boolean) => void;
  hoveredChoiceName: string | null;
  setHoveredChoiceName: (name: string | null) => void;
  chartAreaHeight: number;
};

const ListChartExpandedContext = createContext<ListChartExpandedContextType>({
  setIsExpanded: () => {},
  hoveredChoiceName: null,
  setHoveredChoiceName: () => {},
  chartAreaHeight: 0,
});

export const useListChartExpanded = () => useContext(ListChartExpandedContext);

type Props = {
  listContent: ReactNode;
  chartContent: ReactNode;
  stretchListContent?: boolean;
  hideListOnMobile?: boolean;
  hideDivider?: boolean;
  hideBorder?: boolean;
  reduceInnerPadding?: boolean;
  className?: string;
};

const ConsumerListChartShell: React.FC<Props> = ({
  listContent,
  chartContent,
  stretchListContent = false,
  hideListOnMobile = false,
  hideDivider = false,
  hideBorder = false,
  reduceInnerPadding = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredChoiceName, setHoveredChoiceName] = useState<string | null>(
    null
  );

  const { ref: listColumnRef, height: listColumnHeight } =
    useContainerSize<HTMLDivElement>();
  const chartAreaHeight = Math.max(0, listColumnHeight - 40);

  // Memoize so isExpanded changes don't re-render context consumers (e.g. the chart).
  const contextValue = useMemo(
    () => ({
      setIsExpanded,
      hoveredChoiceName,
      setHoveredChoiceName,
      chartAreaHeight,
    }),
    [hoveredChoiceName, chartAreaHeight, setHoveredChoiceName, setIsExpanded]
  );

  return (
    <ListChartExpandedContext.Provider value={contextValue}>
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-stretch",
          !hideBorder &&
            "sm:rounded-lg sm:border sm:border-gray-400/40 dark:sm:border-gray-400-dark/40",
          className
        )}
        onMouseLeave={() => setHoveredChoiceName(null)}
      >
        <div
          ref={listColumnRef}
          className={cn(
            "order-1 sm:w-80 sm:shrink-0 sm:self-start lg:w-64 xl:w-80",
            reduceInnerPadding ? "sm:py-5 sm:pl-5" : "sm:p-5",
            hideListOnMobile ? "hidden sm:block" : "",
            stretchListContent && "sm:flex sm:flex-col"
          )}
        >
          {listContent}
        </div>
        <div
          className={cn(
            "relative order-2 hidden flex-1 overflow-hidden sm:flex sm:flex-col",
            reduceInnerPadding ? "sm:py-5" : "sm:p-5",
            !hideDivider &&
              "sm:before:absolute sm:before:bottom-0 sm:before:left-0 sm:before:w-px sm:before:bg-gray-400/40 sm:before:content-[''] dark:sm:before:bg-gray-400-dark/40",
            !hideDivider && (isExpanded ? "sm:before:top-2" : "sm:before:top-0")
          )}
          style={
            listColumnHeight > 0 ? { height: listColumnHeight } : undefined
          }
        >
          {chartContent}
        </div>
      </div>
    </ListChartExpandedContext.Provider>
  );
};

export default ConsumerListChartShell;
