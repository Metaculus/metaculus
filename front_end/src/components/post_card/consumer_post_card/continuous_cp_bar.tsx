import { FC } from "react";

import cn from "@/utils/cn";

type Props = {
  communityPredictionDisplayValue: string | null;
  isClosed: boolean;
};
// TODO: adjust for numeric questions when units will be implemented
const ContinuousCPBar: FC<Props> = ({
  communityPredictionDisplayValue,
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
        <span
          className={cn(
            "text-lg font-bold leading-7 text-blue-700 dark:text-blue-700-dark",
            {
              "text-gray-600 dark:text-gray-600-dark": isClosed,
            }
          )}
        >
          {communityPredictionDisplayValue}
        </span>
      </div>
    </div>
  );
};

export default ContinuousCPBar;
