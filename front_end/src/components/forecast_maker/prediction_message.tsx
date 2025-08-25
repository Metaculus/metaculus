import React, { FC } from "react";

import cn from "@/utils/core/cn";

export const ForecastPredictionMessage: FC<{
  predictionMessage?: string | React.ReactNode;
  className?: string;
}> = ({ predictionMessage, className }) => {
  if (!predictionMessage) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-2 text-center text-sm text-gray-700 dark:text-gray-700-dark",
        className
      )}
    >
      {predictionMessage}
    </div>
  );
};

export default ForecastPredictionMessage;
