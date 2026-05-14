"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import cn from "@/utils/core/cn";

type ListChartExpandedContextType = {
  setIsExpanded: (value: boolean) => void;
};

const ListChartExpandedContext = createContext<ListChartExpandedContextType>({
  setIsExpanded: () => {},
});

export const useListChartExpanded = () => useContext(ListChartExpandedContext);

type Props = {
  listContent: ReactNode;
  chartContent: ReactNode;
  className?: string;
};

const ConsumerListChartShell: React.FC<Props> = ({
  listContent,
  chartContent,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ListChartExpandedContext.Provider value={{ setIsExpanded }}>
      <div
        className={cn(
          "flex flex-col sm:rounded-lg sm:border sm:border-gray-400/40 dark:sm:border-gray-400-dark/40",
          "sm:flex-row sm:items-stretch",
          className
        )}
      >
        <div className="order-1 sm:w-80 sm:shrink-0 sm:p-5">{listContent}</div>
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
