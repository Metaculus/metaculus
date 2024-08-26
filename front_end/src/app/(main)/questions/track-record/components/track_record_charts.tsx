import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

import {
  TrackRecordCalibrationCurveItem,
  TrackRecordHistogramItem,
  TrackRecordScatterPlotItem,
} from "@/types/track_record";

import CalibrationChart from "./charts/calibration_chart";
import ScatterPlot from "./charts/scatter_plot";
import UserHistogram from "./charts/user_histogram";

type Props = {
  scatterPlot?: TrackRecordScatterPlotItem[];
  scoreHistogram?: TrackRecordHistogramItem[];
  calibrationCurve?: TrackRecordCalibrationCurveItem[];
  className?: string;
};

const TrackRecordCharts: FC<Props> = ({
  scatterPlot,
  scoreHistogram,
  calibrationCurve,
  className,
}) => {
  const t = useTranslations();

  return (
    <div className={classNames("flex flex-col rounded", className)}>
      <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
        {t("scoreScatterPlot")}
      </h3>
      {scatterPlot && <ScatterPlot score_scatter_plot={scatterPlot} />}
      <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
        {t("scoreHistogram")}
      </h3>
      {scoreHistogram && (
        <UserHistogram rawHistogramData={scoreHistogram} color="gray" />
      )}

      <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
        {t("calibrationCurve")}
      </h3>
      {calibrationCurve && <CalibrationChart data={calibrationCurve} />}
      <div className="flex flex-col items-center space-y-3 divide-y divide-gray-300 dark:divide-gray-700">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-8">
          <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
            <span className="block h-4 w-7 bg-gray-500/30"></span>
            {t("confidenceInterval")}
          </div>
          <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
            <span className="block h-1 w-7 bg-gray-500"></span>
            {t("perfectCalibration")}
          </div>
          <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
            <span className="block size-2 rotate-45 bg-[#ffa500]"></span>
            {t("userCalibration")}
          </div>
        </div>
        <span className="pt-3 text-center text-sm text-gray-600 dark:text-gray-400">
          {t("calibrationCurveInfo")}
        </span>
      </div>
    </div>
  );
};

export default TrackRecordCharts;
