import React, { FC, ReactNode } from "react";

import cn from "@/utils/cn";
import { formatValueUnit, isUnitCompact } from "@/utils/questions";

type Props = {
  communityPredictionDisplayValue: string | null;
  unit?: string;
  isClosed: boolean;
};
// TODO: adjust for numeric questions when units will be implemented
const ContinuousCPBar: FC<Props> = ({
  communityPredictionDisplayValue,
  unit,
  isClosed,
}) => {
  if (!communityPredictionDisplayValue) {
    return null;
  }

  return (
    <div className="flex min-w-[200px] max-w-[200px] justify-center">
      <div
        className={cn(
          "flex w-fit flex-col items-center rounded border-2 border-blue-400 bg-transparent px-5 py-2 dark:border-blue-400-dark dark:bg-transparent",
          {
            "border-gray-300 dark:border-gray-300-dark": isClosed,
          }
        )}
      >
        <div
          className={cn(
            "flex items-center gap-x-1.5 text-center text-lg font-bold uppercase leading-7 text-blue-700 dark:text-blue-700-dark sm:flex-col",
            {
              "text-gray-600 dark:text-gray-600-dark": isClosed,
            }
          )}
        >
          {renderDisplayValue(communityPredictionDisplayValue, unit)}
        </div>
      </div>
    </div>
  );
};

function renderDisplayValue(displayValue: string, unit?: string): ReactNode {
  if (!unit) return displayValue;

  if (isUnitCompact(unit)) return formatValueUnit(displayValue, unit);

  return (
    <>
      <div>{displayValue}</div>
      <div className="text-xs font-medium">{unit}</div>
    </>
  );
}

export default ContinuousCPBar;
