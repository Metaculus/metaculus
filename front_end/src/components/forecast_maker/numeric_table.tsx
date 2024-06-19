import React, { FC } from "react";

import { Quartiles } from "@/types/question";

type Props = {
  userQuartiles?: Quartiles;
  communityQuartiles: Quartiles;
  withUserQuartiles?: boolean;
};

const NumericForecastTable: FC<Props> = ({
  userQuartiles,
  communityQuartiles,
  withUserQuartiles = true,
}) => {
  return (
    <>
      <div className="mb-4 flex justify-between text-center">
        <div className="w-full" />
        {withUserQuartiles && (
          <>
            <div className="w-full text-orange-800 dark:text-orange-800-dark">
              My Prediction
            </div>
          </>
        )}
        <a className="w-full text-olive-700 dark:text-olive-700-dark">
          Community
        </a>
      </div>
      <div className="mb-4 flex justify-between">
        <div className="w-full text-center">
          <div className="w-full">lower 25%</div>
          <div className="w-full">median</div>
          <div className="w-full">upper 75%</div>
        </div>
        {withUserQuartiles && (
          <div className="w-full text-center">
            <div>{getDisplayValue(userQuartiles?.lower25)}</div>
            <div>{getDisplayValue(userQuartiles?.median)}</div>
            <div>{getDisplayValue(userQuartiles?.upper75)}</div>
          </div>
        )}

        <div className="w-full text-center">
          <div>{getDisplayValue(communityQuartiles.lower25)}</div>
          <div>{getDisplayValue(communityQuartiles.median)}</div>
          <div>{getDisplayValue(communityQuartiles.upper75)}</div>
        </div>
      </div>
    </>
  );
};

function getDisplayValue(value: number | undefined) {
  if (value === undefined) {
    return "...";
  }

  return `${Math.round(value * 1000) / 100}`;
}

export default NumericForecastTable;
