"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import {
  TrackRecordCalibrationCurveItem,
  TrackRecordHistogramItem,
  TrackRecordScatterPlotItem,
} from "@/types/track_record";
import cn from "@/utils/core/cn";

import CalibrationChart from "./charts/calibration_chart";
import ScatterPlot from "./charts/scatter_plot";
import UserHistogram from "./charts/user_histogram";

type Props = {
  scatterPlot?: TrackRecordScatterPlotItem[];
  scoreHistogram?: TrackRecordHistogramItem[];
  calibrationCurve?: TrackRecordCalibrationCurveItem[];
  username?: string;
  className?: string;
};

const TrackRecordCharts: FC<Props> = ({
  scatterPlot,
  scoreHistogram,
  calibrationCurve,
  username,
  className,
}) => {
  const t = useTranslations();

  return (
    <div className={cn("flex flex-col rounded", className)}>
      {t("trackRecordShowStatistics")}
      <hr />
      <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
        {t("calibrationCurve")}
      </h3>
      {calibrationCurve && (
        <CalibrationChart
          calibrationData={calibrationCurve}
          username={username}
        />
      )}
      <hr />
      <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
        {t("scoreScatterPlot")}
      </h3>
      {scatterPlot && (
        <ScatterPlot score_scatter_plot={scatterPlot} username={username} />
      )}
      <hr />
      <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
        {t("scoreHistogram")}
      </h3>
      {scoreHistogram && (
        <UserHistogram
          rawHistogramData={scoreHistogram}
          color="gray"
          username={username}
        />
      )}
    </div>
  );
};

export default TrackRecordCharts;
