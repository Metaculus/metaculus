"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import cn from "@/utils/core/cn";

type ListChartExpandedContextType = {
  setIsExpanded: (value: boolean) => void;
  hoveredChoiceName: string | null;
  setHoveredChoiceName: (name: string | null) => void;
};

const ListChartExpandedContext = createContext<ListChartExpandedContextType>({
  setIsExpanded: () => {},
  hoveredChoiceName: null,
  setHoveredChoiceName: () => {},
});

export const useListChartExpanded = () => useContext(ListChartExpandedContext);

type Props = {
  listContent: ReactNode;
  chartContent: ReactNode;
  stretchListContent?: boolean;
  className?: string;
};

const ConsumerListChartShell: React.FC<Props> = ({
  listContent,
  chartContent,
  stretchListContent = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredChoiceName, setHoveredChoiceName] = useState<string | null>(
    null
  );

  // Memoize so isExpanded changes don't re-render context consumers (e.g. the chart).
  const contextValue = useMemo(
    () => ({ setIsExpanded, hoveredChoiceName, setHoveredChoiceName }),
    [hoveredChoiceName, setHoveredChoiceName, setIsExpanded]
  );

  return (
    <ListChartExpandedContext.Provider value={contextValue}>
      <div
        className={cn(
          "flex flex-col sm:rounded-lg sm:border sm:border-gray-400/40 dark:sm:border-gray-400-dark/40",
          "sm:flex-row sm:items-stretch",
          className
        )}
        onMouseLeave={() => setHoveredChoiceName(null)}
      >
        <div
          className={cn(
            "order-1 sm:w-80 sm:shrink-0 sm:p-5",
            stretchListContent && "sm:flex sm:flex-col"
          )}
        >
          {listContent}
        </div>
        <div
          className={cn(
            "relative order-2 hidden flex-1 sm:block sm:p-5",
            "sm:before:absolute sm:before:bottom-0 sm:before:left-0 sm:before:w-px sm:before:bg-gray-400/40 sm:before:content-[''] dark:sm:before:bg-gray-400-dark/40",
            isExpanded ? "sm:before:top-2" : "sm:before:top-0"
          )}
        >
          {chartContent}
        </div>
      </div>
    </ListChartExpandedContext.Provider>
  );
};

export default ConsumerListChartShell;
