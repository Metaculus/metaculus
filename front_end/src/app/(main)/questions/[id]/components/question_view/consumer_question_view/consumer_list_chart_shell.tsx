import { ReactNode } from "react";

import cn from "@/utils/core/cn";

type Props = {
  listContent: ReactNode;
  chartContent: ReactNode;
  className?: string;
};

const ConsumerListChartShell: React.FC<Props> = ({
  listContent,
  chartContent,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col sm:rounded-lg sm:border sm:border-gray-400/40 dark:sm:border-gray-400-dark/40",
      "sm:flex-row sm:items-stretch",
      className
    )}
  >
    <div className="order-1 sm:w-[200px] sm:shrink-0 sm:p-5">{listContent}</div>
    <div className="order-2 hidden flex-1 sm:block sm:border-l sm:border-gray-400/40 sm:p-5 dark:sm:border-gray-400-dark/40">
      {chartContent}
    </div>
  </div>
);

export default ConsumerListChartShell;
