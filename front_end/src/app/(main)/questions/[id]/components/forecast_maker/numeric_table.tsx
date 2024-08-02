import React, { FC } from "react";

import { Bounds, Quartiles, Question } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

type Props = {
  question: Question;
  userBounds?: Bounds;
  userQuartiles?: Quartiles;
  communityBounds?: Bounds;
  communityQuartiles?: Quartiles;
  withUserQuartiles?: boolean;
};

const NumericForecastTable: FC<Props> = ({
  question,
  userBounds,
  userQuartiles,
  communityBounds,
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
          <div className="w-full">mass below lower bound</div>
          <div className="w-full">lower 25%</div>
          <div className="w-full">median</div>
          <div className="w-full">upper 75%</div>
          <div className="w-full">mass above upper bound</div>
        </div>
        {withUserQuartiles && (
          <div className="w-full text-center">
            <div>{(userBounds!.belowLower * 100).toFixed(1)}%</div>
            <div>{getDisplayValue(userQuartiles?.lower25, question)}</div>
            <div>{getDisplayValue(userQuartiles?.median, question)}</div>
            <div>{getDisplayValue(userQuartiles?.upper75, question)}</div>
            <div>{(userBounds!.aboveUpper * 100).toFixed(1)}%</div>
          </div>
        )}

        <div className="w-full text-center">
          <div>{(communityBounds!.belowLower * 100).toFixed(1)}%</div>
          <div>{getDisplayValue(communityQuartiles?.lower25, question)}</div>
          <div>{getDisplayValue(communityQuartiles?.median, question)}</div>
          <div>{getDisplayValue(communityQuartiles?.upper75, question)}</div>
          <div>{(communityBounds!.aboveUpper * 100).toFixed(1)}%</div>
        </div>
      </div>
    </>
  );
};

export default NumericForecastTable;
