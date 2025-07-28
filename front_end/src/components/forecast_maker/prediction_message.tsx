import React, { FC } from "react";

export const ForecastPredictionMessage: FC<{
  predictionMessage?: string | React.ReactNode;
}> = ({ predictionMessage }) => {
  if (!predictionMessage) {
    return null;
  }

  return (
    <div className="mb-2 text-center text-sm text-gray-700 dark:text-gray-700-dark">
      {predictionMessage}
    </div>
  );
};

export default ForecastPredictionMessage;
