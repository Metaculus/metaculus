import classNames from "classnames";
import { FC, ReactNode } from "react";

type Props = {
  value: number | null;
  disabled?: boolean;
  renderLabel?: (value: number | null) => ReactNode;
};

const ProgressBar: FC<Props> = ({ value, renderLabel, disabled = false }) => {
  return (
    <div className="BinaryPredictionBar relative h-5">
      <div
        className={classNames(
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
      {value !== null && (
        <div
          className={classNames(
            "BinaryPredictionBar-outer absolute left-0 top-0 h-5 overflow-hidden text-gray-0 dark:text-gray-0-dark",
            disabled
              ? "bg-gray-500 dark:bg-gray-500-dark"
              : "bg-olive-700 dark:bg-olive-700-dark"
          )}
          style={{ width: `${value}%` }}
        >
          <div className="BinaryPredictionBar-value flex h-full items-center text-xs font-semibold leading-[14px]">
            {renderLabel ? renderLabel(value) : <span>{value}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
