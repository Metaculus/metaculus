import React, { FC } from "react";

import { computeQuartilesFromCDF } from "@/utils/math";

type Props = {
  cdf: number[];
  latestCdf: number[];
};

const NumericForecastTable: FC<Props> = ({ cdf, latestCdf }) => {
  const quantiles = computeQuartilesFromCDF(cdf);
  const cp_quantiles = computeQuartilesFromCDF(latestCdf);

  return (
    <>
      <div className="mb-4 flex justify-between text-center">
        <div className="w-full" />
        <div className="w-full text-orange-800 dark:text-orange-800-dark">
          My Prediction
        </div>
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
        <div className="w-full text-center">
          <div>{Math.round(quantiles.lower25 * 1000) / 100}</div>
          <div>{Math.round(quantiles.median * 1000) / 100}</div>
          <div>{Math.round(quantiles.upper75 * 1000) / 100}</div>
        </div>
        <div className="w-full text-center">
          <div>{Math.round(cp_quantiles.lower25 * 1000) / 100}</div>
          <div>{Math.round(cp_quantiles.median * 1000) / 100}</div>
          <div>{Math.round(cp_quantiles.upper75 * 1000) / 100}</div>
        </div>
      </div>
    </>
  );
};

export default NumericForecastTable;
