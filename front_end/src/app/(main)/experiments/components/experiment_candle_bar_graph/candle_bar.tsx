import { FC } from "react";

import { Candle } from "@/types/experiments";
import { ExtendedQuartiles } from "@/types/question";

const CandleBar: FC<Candle> = ({ quartiles, color }) => {
  const { lower10, lower25, median, upper75, upper90 } =
    normalizeQuartileValues(quartiles);

  return (
    <div className="relative h-4 w-full">
      {/* Gray line */}
      <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-gray-300 dark:bg-gray-600" />

      {/* 10 - 90 percentiles line */}
      <div
        className="absolute h-0.5 -translate-y-1/2"
        style={{
          top: "50%",
          width: `${(upper90 ?? 0) - (lower10 ?? 0)}%`,
          left: `${lower10 ?? 0}%`,
          backgroundColor: color,
        }}
      />

      {/* 25 - 75 percentiles bar */}
      <div
        className="absolute top-0 h-full "
        style={{
          width: `${(upper75 ?? 0) - (lower10 ?? 0)}%`,
          left: `${lower25 ?? 0}%`,
          backgroundColor: color,
        }}
      />

      {/* Left candlebar side */}
      <div
        className="absolute top-0 h-full w-1"
        style={{
          left: `${lower10 ?? 0}%`,
          backgroundColor: color,
        }}
      />

      {/* Right candlebar  side */}
      <div
        className="absolute top-0 h-full w-1"
        style={{
          left: `${upper90 ?? 0}%`,
          backgroundColor: color,
        }}
      />

      {/* The circle for the median value */}
      <div
        className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          top: "50%",
          left: `${median ?? 0}%`,
        }}
      />
    </div>
  );
};

const normalizeQuartileValues = (
  quartiles: ExtendedQuartiles
): ExtendedQuartiles =>
  Object.fromEntries(
    Object.entries(quartiles).map(([key, value]) => [
      key,
      value === null ? null : value * 100,
    ])
  ) as ExtendedQuartiles;

export default CandleBar;
