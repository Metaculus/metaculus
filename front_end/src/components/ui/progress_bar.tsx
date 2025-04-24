import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

type Props = {
  value: number | null;
  userForecast: number | null;
  disabled?: boolean;
  renderLabel?: (value: number | null) => ReactNode;
  progressColor?: string;
  hideCP?: boolean;
};

const ProgressBar: FC<Props> = ({
  value,
  userForecast,
  renderLabel,
  disabled = false,
  progressColor,
  hideCP,
}) => {
  return (
    <div className="BinaryPredictionBar relative h-5">
      <div
        className={cn(
          "BinaryPredictionBar-inner absolute inset-x-0 top-0 h-5",
          disabled
            ? "bg-gray-300 text-gray-500 dark:bg-gray-300-dark dark:text-gray-500-dark"
            : "bg-olive-300 text-olive-700 dark:bg-olive-300-dark dark:text-olive-700-dark"
        )}
      >
        <div className="BinaryPredictionBar-value flex h-full items-center text-xs font-semibold leading-[14px]">
          {renderLabel ? renderLabel(value) : <span>{value}</span>}
        </div>
      </div>
      {value !== null && !hideCP && (
        <div
          className={cn(
            "BinaryPredictionBar-outer absolute left-0 top-0 h-5 overflow-hidden text-gray-0 dark:text-gray-0-dark",
            disabled
              ? "bg-gray-500 dark:bg-gray-500-dark"
              : "bg-olive-700 dark:bg-olive-700-dark"
          )}
          style={{ width: `${value}%`, backgroundColor: progressColor }}
        >
          <div className="BinaryPredictionBar-value flex h-full items-center text-xs font-semibold leading-[14px]">
            {renderLabel ? renderLabel(value) : <span>{value}</span>}
          </div>
        </div>
      )}
      {userForecast && (
        <div
          className="absolute top-[-2px] ml-[-1.5px] h-[24px] w-[3px] border-[1px] border-orange-400 bg-orange-200 dark:bg-orange-800"
          style={{ left: `${userForecast}%` }}
        ></div>
      )}
    </div>
  );
};

export default ProgressBar;
